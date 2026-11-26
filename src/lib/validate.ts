import { todayIso } from './dates.ts';
import { formatTr, fromKurus, toKurus } from './money.ts';
import { digitsOnly, isValidTckn, isValidVkn } from './taxId.ts';
import type { DocumentFields, FieldWarning } from './types.ts';

export const FIELD_LABEL: Record<string, string> = {
  belgeTuru: 'Belge türü',
  tarih: 'Tarih',
  saat: 'Saat',
  saticiUnvan: 'Satıcı',
  vknTckn: 'VKN/TCKN',
  vergiDairesi: 'Vergi dairesi',
  belgeNo: 'Fiş/fatura no',
  zNo: 'Z no',
  ekuNo: 'EKÜ no',
  kdv: 'KDV',
  toplam: 'Toplam',
  odemeSekli: 'Ödeme',
  aciklama: 'Açıklama',
};

export interface MoneyCheck {
  matrahKurus: number;
  kdvKurus: number;
  sumKurus: number;
  toplamKurus: number | null;
  farkKurus: number | null;
}

export function moneyCheck(fields: DocumentFields): MoneyCheck {
  let matrahKurus = 0;
  let kdvKurus = 0;
  for (const row of fields.kdvSatirlari) {
    matrahKurus += toKurus(row.matrah);
    kdvKurus += toKurus(row.kdv);
  }
  const sumKurus = matrahKurus + kdvKurus;
  const toplamKurus = fields.toplam == null ? null : toKurus(fields.toplam);
  const farkKurus = toplamKurus == null ? null : toplamKurus - sumKurus;
  return { matrahKurus, kdvKurus, sumKurus, toplamKurus, farkKurus };
}

function hasValue(field: string, fields: DocumentFields): boolean {
  switch (field) {
    case 'saticiUnvan':
      return fields.saticiUnvan.trim().length > 0;
    case 'vknTckn':
      return fields.vknTckn.trim().length > 0;
    case 'vergiDairesi':
      return fields.vergiDairesi.trim().length > 0;
    case 'belgeNo':
      return fields.belgeNo.trim().length > 0;
    case 'zNo':
      return fields.zNo.trim().length > 0;
    case 'ekuNo':
      return fields.ekuNo.trim().length > 0;
    case 'aciklama':
      return fields.aciklama.trim().length > 0;
    case 'tarih':
      return fields.tarih.length > 0;
    case 'saat':
      return fields.saat.length > 0;
    case 'toplam':
      return fields.toplam != null;
    default:
      return true;
  }
}

export function validateDocument(fields: DocumentFields, now = new Date()): FieldWarning[] {
  const warnings: FieldWarning[] = [];
  const today = todayIso(now);

  if (!fields.tarih) {
    warnings.push({ field: 'tarih', level: 'hata', message: 'Tarih yok.' });
  } else if (fields.tarih > today) {
    warnings.push({ field: 'tarih', level: 'uyari', message: 'Tarih bugünden sonra.' });
  } else if (Number(fields.tarih.slice(0, 4)) < now.getFullYear() - 5) {
    warnings.push({ field: 'tarih', level: 'uyari', message: 'Tarih beş yıldan eski.' });
  }

  if (fields.saat && !/^\d{2}:\d{2}$/.test(fields.saat)) {
    warnings.push({ field: 'saat', level: 'uyari', message: 'Saat okunaklı değil.' });
  }

  if (!fields.saticiUnvan.trim()) {
    warnings.push({ field: 'saticiUnvan', level: 'uyari', message: 'Satıcı unvanı yok.' });
  }

  const taxId = digitsOnly(fields.vknTckn);
  if (!taxId) {
    warnings.push({ field: 'vknTckn', level: 'uyari', message: 'VKN/TCKN yok.' });
  } else if (taxId.length !== 10 && taxId.length !== 11) {
    warnings.push({ field: 'vknTckn', level: 'uyari', message: 'VKN 10, TCKN 11 hane olmalı.' });
  } else if (taxId.length === 10 && !isValidVkn(taxId)) {
    warnings.push({ field: 'vknTckn', level: 'uyari', message: 'VKN kontrol basamağı tutmuyor.' });
  } else if (taxId.length === 11 && !isValidTckn(taxId)) {
    warnings.push({ field: 'vknTckn', level: 'uyari', message: 'TCKN kontrol basamağı tutmuyor.' });
  }

  if (fields.belgeTuru === 'fatura' && !fields.vergiDairesi.trim()) {
    warnings.push({ field: 'vergiDairesi', level: 'uyari', message: 'Vergi dairesi yok.' });
  }

  if (!fields.belgeNo.trim()) {
    warnings.push({ field: 'belgeNo', level: 'uyari', message: 'Fiş veya fatura numarası yok.' });
  }

  if (fields.belgeTuru === 'fis' && !fields.zNo.trim() && !fields.ekuNo.trim()) {
    warnings.push({ field: 'zNo', level: 'uyari', message: 'Fişte Z no ve EKÜ no yok.' });
  }

  const rates = new Set<number>();
  fields.kdvSatirlari.forEach((row, index) => {
    const field = `kdv:${index}`;
    if (rates.has(row.oran)) {
      warnings.push({ field, level: 'uyari', message: `%${row.oran} oranı iki kez yazılmış.` });
    }
    rates.add(row.oran);
    if (row.oran < 0 || row.oran > 100) {
      warnings.push({ field, level: 'hata', message: 'KDV oranı 0 ile 100 arasında olmalı.' });
    } else if (![0, 1, 10, 20].includes(row.oran)) {
      warnings.push({
        field,
        level: 'uyari',
        message: `%${row.oran} hazır sütunlarda kapalı. Tutar açıklamaya ve fiş satırına yazılır; sütunu Ayarlar'dan açabilirsiniz.`,
      });
    }
    if (row.matrah < 0 || row.kdv < 0) {
      warnings.push({ field, level: 'hata', message: 'Matrah ve KDV eksi olamaz.' });
    }
    if (row.oran > 0 && row.matrah > 0) {
      const expected = Math.round((toKurus(row.matrah) * row.oran) / 100);
      const actual = toKurus(row.kdv);
      const tolerance = Math.max(5, Math.round(Math.abs(expected) * 0.02));
      if (Math.abs(actual - expected) > tolerance) {
        warnings.push({
          field,
          level: 'uyari',
          message: `%${row.oran} KDV tutarı beklenen ${formatTr(fromKurus(expected))} TL değil.`,
        });
      }
    }
  });

  if (fields.kdvSatirlari.length === 0) {
    warnings.push({ field: 'kdv', level: 'uyari', message: 'KDV dökümü yok.' });
  }

  if (fields.toplam == null) {
    warnings.push({ field: 'toplam', level: 'hata', message: 'Toplam yok.' });
  } else if (fields.toplam < 0) {
    warnings.push({ field: 'toplam', level: 'hata', message: 'Toplam eksi olamaz.' });
  } else if (fields.kdvSatirlari.length > 0) {
    const check = moneyCheck(fields);
    const diff = Math.abs(check.farkKurus ?? 0);
    if (diff > 5) {
      warnings.push({
        field: 'toplam',
        level: diff > 100 ? 'hata' : 'uyari',
        message: `Matrah + KDV, toplamdan ${formatTr(fromKurus(diff))} TL farklı.`,
      });
    }
  }

  for (const [field, level] of Object.entries(fields.guven)) {
    if (level !== 'dusuk') continue;
    if (!hasValue(field, fields)) continue;
    if (warnings.some((warning) => warning.field === field)) continue;
    const label = FIELD_LABEL[field] ?? field;
    warnings.push({ field, level: 'uyari', message: `${label} bulanık, kontrol edin.` });
  }

  return warnings;
}

export function worstLevel(warnings: FieldWarning[]): 'ok' | 'uyari' | 'hata' {
  if (warnings.some((warning) => warning.level === 'hata')) return 'hata';
  if (warnings.length > 0) return 'uyari';
  return 'ok';
}
