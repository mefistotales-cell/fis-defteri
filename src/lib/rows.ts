import { codeOr } from './accounts.ts';
import { handledRates } from './columns.ts';
import { toTrDate } from './dates.ts';
import { buildJournal } from './journal.ts';
import { fromKurus, formatTr, toKurus } from './money.ts';
import { cleanText } from './text.ts';
import type { AppSettings, ColumnKind, ColumnSpec, DocumentFields, ExportDoc, FieldWarning, JournalLine } from './types.ts';
import { ODEME_LABEL } from './types.ts';
import { moneyCheck, validateDocument } from './validate.ts';

export interface TableSheet {
  name: string;
  rows: (string | number)[][];
  kinds: ColumnKind[];
  skipped: string[];
}

interface DocCtx {
  doc: ExportDoc;
  settings: AppSettings;
  fisNo: number;
  warnings: FieldWarning[];
  note: string;
  line?: JournalLine;
}

export function sortDocs(docs: ExportDoc[]): ExportDoc[] {
  return docs.slice().sort((a, b) => {
    const left = a.fields.tarih || a.createdAt;
    const right = b.fields.tarih || b.createdAt;
    if (left !== right) return left < right ? -1 : 1;
    return a.fields.belgeNo.localeCompare(b.fields.belgeNo, 'tr');
  });
}

export function documentNote(fields: DocumentFields, warnings: FieldWarning[], rates: number[]): string {
  const parts: string[] = [];
  if (warnings.some((warning) => warning.level === 'hata')) parts.push('KONTROL');
  const pay =
    fields.odemeSekli === 'nakit'
      ? 'NAKIT'
      : fields.odemeSekli === 'kart'
        ? 'KART'
        : fields.odemeSekli === 'havale'
          ? 'HAVALE'
          : fields.odemeSekli === 'acik'
            ? 'ACIK'
            : '';
  if (pay) parts.push(pay);
  parts.push(fields.belgeTuru === 'fis' ? 'FIS' : 'FATURA');
  if (fields.zNo.trim()) parts.push(`Z:${cleanText(fields.zNo, 20)}`);
  if (fields.ekuNo.trim()) parts.push(`EKU:${cleanText(fields.ekuNo, 20)}`);
  if (fields.aciklama.trim()) parts.push(fields.aciklama);
  for (const row of fields.kdvSatirlari) {
    if (rates.includes(row.oran)) continue;
    parts.push(`KDV %${row.oran} matrah ${formatTr(row.matrah)} kdv ${formatTr(row.kdv)}`);
  }
  return cleanText(parts.join(' | '), 240);
}

export function buildLucaFatura(docs: ExportDoc[], settings: AppSettings): TableSheet {
  return documentSheet('Fatura', settings.sutunlar.lucaFatura, docs, settings, lucaFaturaCell);
}

export function buildLogoAlim(docs: ExportDoc[], settings: AppSettings): TableSheet {
  return documentSheet('Alim Faturasi', settings.sutunlar.logoAlim, docs, settings, logoAlimCell);
}

export function buildOzet(docs: ExportDoc[], settings: AppSettings): TableSheet {
  return documentSheet('Belgeler', settings.sutunlar.ozet, docs, settings, ozetCell);
}

export function buildLucaFis(docs: ExportDoc[], settings: AppSettings): TableSheet {
  return journalSheet('Fis', settings.sutunlar.lucaFis, docs, settings, fisCell);
}

export function buildLogoFis(docs: ExportDoc[], settings: AppSettings): TableSheet {
  return journalSheet('Muhasebe Fisi', settings.sutunlar.logoFis, docs, settings, fisCell);
}

export function buildTotals(docs: ExportDoc[]): TableSheet {
  const sums = {
    adet: docs.length,
    matrah1: 0,
    kdv1: 0,
    matrah10: 0,
    kdv10: 0,
    matrah20: 0,
    kdv20: 0,
    digerMatrah: 0,
    digerKdv: 0,
    toplam: 0,
    nakit: 0,
    kart: 0,
    havale: 0,
    acik: 0,
    belirsiz: 0,
    hatali: 0,
  };
  for (const doc of docs) {
    const fields = doc.fields;
    sums.matrah1 += toKurus(rateAmount(fields, 1, 'matrah'));
    sums.kdv1 += toKurus(rateAmount(fields, 1, 'kdv'));
    sums.matrah10 += toKurus(rateAmount(fields, 10, 'matrah'));
    sums.kdv10 += toKurus(rateAmount(fields, 10, 'kdv'));
    sums.matrah20 += toKurus(rateAmount(fields, 20, 'matrah'));
    sums.kdv20 += toKurus(rateAmount(fields, 20, 'kdv'));
    sums.digerMatrah += toKurus(otherAmount(fields, 'matrah'));
    sums.digerKdv += toKurus(otherAmount(fields, 'kdv'));
    const total = toKurus(toplamValue(fields));
    sums.toplam += total;
    if (fields.odemeSekli === 'nakit') sums.nakit += total;
    else if (fields.odemeSekli === 'kart') sums.kart += total;
    else if (fields.odemeSekli === 'havale') sums.havale += total;
    else if (fields.odemeSekli === 'acik') sums.acik += total;
    else sums.belirsiz += total;
    if (validateDocument(fields).some((warning) => warning.level === 'hata')) sums.hatali += 1;
  }
  const rows: (string | number)[][] = [
    ['Kalem', 'Tutar'],
    ['Belge sayısı', sums.adet],
    ['Matrah %1', fromKurus(sums.matrah1)],
    ['KDV %1', fromKurus(sums.kdv1)],
    ['Matrah %10', fromKurus(sums.matrah10)],
    ['KDV %10', fromKurus(sums.kdv10)],
    ['Matrah %20', fromKurus(sums.matrah20)],
    ['KDV %20', fromKurus(sums.kdv20)],
    ['Diğer matrah', fromKurus(sums.digerMatrah)],
    ['Diğer KDV', fromKurus(sums.digerKdv)],
    ['Genel toplam', fromKurus(sums.toplam)],
    ['Nakit', fromKurus(sums.nakit)],
    ['Kart', fromKurus(sums.kart)],
    ['Havale/EFT', fromKurus(sums.havale)],
    ['Açık hesap', fromKurus(sums.acik)],
    ['Ödemesi belirsiz', fromKurus(sums.belirsiz)],
    ['Kontrol gereken belge', sums.hatali],
  ];
  return { name: 'Toplamlar', rows, kinds: ['text', 'money'], skipped: [] };
}

export function buildReadmeSheet(settings: AppSettings): TableSheet {
  const hesap = settings.hesaplar;
  const lines = [
    'Bu sayfa programa yüklenmez. Muhasebeciye kontrol içindir.',
    'Luca fatura listesi: Muhasebe > Fiş İşlemleri > Excel Fatura Aktarımı. Yüklenecek dosya CSV’dir.',
    'Luca fiş: Muhasebe > Fiş İşlemleri > Excel Veri Aktarımı. Zorunlu sütunlar Fiş No, Fiş Tarihi, Hesap Kodu, Borç, Alacak.',
    'Logo Tiger/GO: fatura Excel’i ExcelTrans şablonuna göre okunur. Başlıklar Ayarlar’dan eşlenir.',
    'Logo İşbaşı için herkese açık sabit bir alım faturası şablonu doğrulanamadı. Özet sayfasını kullanın.',
    `Gider hesabı ${hesap.gider}. KDV %1 ${hesap.kdv['1']}, %10 ${hesap.kdv['10']}, %20 ${hesap.kdv['20']}.`,
    `Nakit ${hesap.kasa}, kart ${hesap.kart}, havale ${hesap.havale}, satıcı ${hesap.saticilar}.`,
    'Toplam, matrah+KDV ile tutmuyorsa fiş yine dengelenir ve satırda FARK yazar. Belgeyi fişle karşılaştırın.',
    'Eski %8 ve %18 tutarları, sütun açılmadıysa açıklamaya yazılır; %10 veya %20 sanılmaz.',
    `Logo fatura tipi varsayılanı: fiş ${settings.fisLogoTip} (alınan hizmet), fatura ${settings.faturaLogoTip} (mal alım).`,
  ];
  return {
    name: 'Okuma',
    rows: lines.map((line) => [line]),
    kinds: ['text'],
    skipped: [],
  };
}

function documentSheet(
  name: string,
  columns: ColumnSpec[],
  docs: ExportDoc[],
  settings: AppSettings,
  cell: (key: string, ctx: DocCtx) => string | number,
): TableSheet {
  const active = columns.filter((column) => column.enabled);
  const rates = handledRates(columns);
  const body = docs.map((doc, index) => {
    const warnings = validateDocument(doc.fields);
    const ctx: DocCtx = {
      doc,
      settings,
      fisNo: index + 1,
      warnings,
      note: documentNote(doc.fields, warnings, rates),
    };
    return active.map((column) => cell(column.key, ctx));
  });
  return {
    name,
    kinds: active.map((column) => column.kind),
    rows: [active.map((column) => column.header), ...body],
    skipped: [],
  };
}

function journalSheet(
  name: string,
  columns: ColumnSpec[],
  docs: ExportDoc[],
  settings: AppSettings,
  cell: (key: string, ctx: DocCtx) => string | number,
): TableSheet {
  const active = columns.filter((column) => column.enabled);
  const rates = handledRates(columns);
  const body: (string | number)[][] = [];
  const skipped: string[] = [];
  let fisNo = 0;
  for (const doc of docs) {
    const journal = buildJournal(doc.fields, settings.hesaplar);
    if (journal.lines.length === 0) {
      skipped.push(doc.fields.saticiUnvan || doc.fields.belgeNo || doc.id);
      continue;
    }
    fisNo += 1;
    const warnings = validateDocument(doc.fields);
    for (const line of journal.lines) {
      const ctx: DocCtx = {
        doc,
        settings,
        fisNo,
        warnings,
        note: documentNote(doc.fields, warnings, rates),
        line,
      };
      body.push(active.map((column) => cell(column.key, ctx)));
    }
  }
  return {
    name,
    kinds: active.map((column) => column.kind),
    rows: [active.map((column) => column.header), ...body],
    skipped,
  };
}

function lucaFaturaCell(key: string, ctx: DocCtx): string | number {
  const fields = ctx.doc.fields;
  switch (key) {
    case 'evrakTarihi':
      return toTrDate(fields.tarih);
    case 'evrakNo':
      return cleanText(fields.belgeNo, 40);
    case 'vkn':
      return fields.vknTckn;
    case 'unvan':
      return cleanText(fields.saticiUnvan, 120);
    case 'aciklama':
      return ctx.note;
    case 'matrah0':
      return rateAmount(fields, 0, 'matrah');
    case 'matrah1':
      return rateAmount(fields, 1, 'matrah');
    case 'matrah8':
      return rateAmount(fields, 8, 'matrah');
    case 'matrah10':
      return rateAmount(fields, 10, 'matrah');
    case 'matrah18':
      return rateAmount(fields, 18, 'matrah');
    case 'matrah20':
      return rateAmount(fields, 20, 'matrah');
    case 'kdv1':
      return rateAmount(fields, 1, 'kdv');
    case 'kdv8':
      return rateAmount(fields, 8, 'kdv');
    case 'kdv10':
      return rateAmount(fields, 10, 'kdv');
    case 'kdv18':
      return rateAmount(fields, 18, 'kdv');
    case 'kdv20':
      return rateAmount(fields, 20, 'kdv');
    case 'toplam':
      return toplamValue(fields);
    case 'tevkifat':
      return 0;
    case 'karsiHesap':
      return codeOr(ctx.settings.hesaplar.karsiHesap, '770');
    default:
      return '';
  }
}

function logoAlimCell(key: string, ctx: DocCtx): string | number {
  const fields = ctx.doc.fields;
  switch (key) {
    case 'faturaTarihi':
      return toTrDate(fields.tarih);
    case 'faturaNo':
      return cleanText(fields.belgeNo, 40);
    case 'belgeTuru':
      return fields.belgeTuru === 'fis' ? 'Fiş' : 'Fatura';
    case 'logoTip':
      return fields.belgeTuru === 'fis' ? ctx.settings.fisLogoTip : ctx.settings.faturaLogoTip;
    case 'cariUnvan':
      return cleanText(fields.saticiUnvan, 120);
    case 'vkn':
      return fields.vknTckn;
    case 'vergiDairesi':
      return cleanText(fields.vergiDairesi, 60);
    case 'aciklama':
      return ctx.note;
    case 'odeme':
      return ODEME_LABEL[fields.odemeSekli];
    case 'karsiHesap':
      return creditAccountCode(ctx);
    default:
      return lucaFaturaCell(key, ctx);
  }
}

function ozetCell(key: string, ctx: DocCtx): string | number {
  const fields = ctx.doc.fields;
  switch (key) {
    case 'tarih':
      return toTrDate(fields.tarih);
    case 'saat':
      return fields.saat;
    case 'tur':
      return fields.belgeTuru === 'fis' ? 'Fiş' : 'Fatura';
    case 'satici':
      return cleanText(fields.saticiUnvan, 120);
    case 'vkn':
      return fields.vknTckn;
    case 'vergiDairesi':
      return cleanText(fields.vergiDairesi, 60);
    case 'belgeNo':
      return cleanText(fields.belgeNo, 40);
    case 'zNo':
      return cleanText(fields.zNo, 20);
    case 'ekuNo':
      return cleanText(fields.ekuNo, 20);
    case 'digerMatrah':
      return otherAmount(fields, 'matrah');
    case 'digerKdv':
      return otherAmount(fields, 'kdv');
    case 'odeme':
      return ODEME_LABEL[fields.odemeSekli];
    case 'aciklama':
      return cleanText(fields.aciklama, 180);
    case 'uyarilar':
      return cleanText(ctx.warnings.map((warning) => warning.message).join(' '), 500);
    default:
      return lucaFaturaCell(key, ctx);
  }
}

function fisCell(key: string, ctx: DocCtx): string | number {
  const fields = ctx.doc.fields;
  const line = ctx.line;
  switch (key) {
    case 'fisNo':
      return String(ctx.fisNo);
    case 'fisTarihi':
    case 'evrakTarihi':
      return toTrDate(fields.tarih);
    case 'hesapKodu':
      return line?.hesapKodu ?? '';
    case 'evrakNo':
    case 'belgeNo':
      return cleanText(fields.belgeNo, 40);
    case 'aciklama':
      return line?.aciklama ?? ctx.note;
    case 'borc':
      return line?.borc ?? 0;
    case 'alacak':
      return line?.alacak ?? 0;
    case 'belgeTuru':
      return fields.belgeTuru === 'fis' ? 'FŞ' : 'FT';
    case 'miktar':
      return '';
    case 'paraBirimi':
      return 'TL';
    case 'hesapAdi':
      return '';
    default:
      return '';
  }
}

function creditAccountCode(ctx: DocCtx): string {
  const fields = ctx.doc.fields;
  const accounts = ctx.settings.hesaplar;
  if (fields.odemeSekli === 'nakit') return codeOr(accounts.kasa, '100');
  if (fields.odemeSekli === 'kart') return codeOr(accounts.kart, '108');
  if (fields.odemeSekli === 'havale') return codeOr(accounts.havale, '102');
  return codeOr(accounts.saticilar, '320');
}

function rateAmount(fields: DocumentFields, rate: number, part: 'matrah' | 'kdv'): number {
  let kurus = 0;
  for (const row of fields.kdvSatirlari) {
    if (row.oran === rate) kurus += toKurus(row[part]);
  }
  return fromKurus(kurus);
}

function otherAmount(fields: DocumentFields, part: 'matrah' | 'kdv'): number {
  let kurus = 0;
  for (const row of fields.kdvSatirlari) {
    if (row.oran === 1 || row.oran === 10 || row.oran === 20) continue;
    kurus += toKurus(row[part]);
  }
  return fromKurus(kurus);
}

function toplamValue(fields: DocumentFields): number {
  if (fields.toplam != null) return fromKurus(toKurus(fields.toplam));
  return fromKurus(moneyCheck(fields).sumKurus);
}
