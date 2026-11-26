import { counterAccount } from './accounts.ts';
import { toTrDate } from './dates.ts';
import { formatTr, fromKurus, toKurus } from './money.ts';
import { cleanText } from './text.ts';
import type { AccountSettings, ColumnKind, DocumentFields, JournalLine } from './types.ts';

export interface MustahsilMath {
  brutKurus: number | null;
  stopajKurus: number;
  borsaKurus: number;
  sgkKurus: number;
  meraKurus: number;
  kesintiKurus: number;
  netKurus: number | null;
  beklenenNetKurus: number | null;
  farkKurus: number | null;
}

export function amountOrZero(value: number | null | undefined): number {
  return value == null ? 0 : toKurus(value);
}

export function mustahsilMath(fields: DocumentFields): MustahsilMath {
  const brutKurus = fields.brutTutar == null ? null : toKurus(fields.brutTutar);
  const stopajKurus = amountOrZero(fields.stopajTutar);
  const borsaKurus = amountOrZero(fields.borsaTescil);
  const sgkKurus = amountOrZero(fields.sgkKesinti);
  const meraKurus = amountOrZero(fields.meraFonu);
  const kesintiKurus = stopajKurus + borsaKurus + sgkKurus + meraKurus;
  const netSource = fields.netOdenen ?? fields.toplam;
  const netKurus = netSource == null ? null : toKurus(netSource);
  const beklenenNetKurus = brutKurus == null ? null : brutKurus - kesintiKurus;
  const farkKurus = brutKurus == null || netKurus == null ? null : beklenenNetKurus! - netKurus;
  return { brutKurus, stopajKurus, borsaKurus, sgkKurus, meraKurus, kesintiKurus, netKurus, beklenenNetKurus, farkKurus };
}

export function buildMustahsilJournal(fields: DocumentFields, accounts: AccountSettings): { lines: JournalLine[]; farkKurus: number } {
  const math = mustahsilMath(fields);
  const brut = math.brutKurus ?? 0;
  const net = math.netKurus ?? math.beklenenNetKurus ?? 0;
  const fark = math.farkKurus ?? 0;
  const lines: JournalLine[] = [];
  const name = cleanText(fields.saticiUnvan, 42);
  const belge = cleanText(fields.belgeNo, 32);
  const urun = cleanText(fields.urunCinsi, 40);
  if (brut === 0 && net === 0 && math.kesintiKurus === 0) return { lines, farkKurus: 0 };

  push(lines, accounts.mustahsilMal || '153', ['MUSTAHSIL BRUT', urun, name, belge], brut, 'borc');
  push(lines, accounts.mustahsilStopaj || '360', ['GELIR VERGISI STOPAJ', name, belge], math.stopajKurus, 'alacak');
  push(lines, accounts.mustahsilBorsa || '360', ['BORSA TESCIL', name, belge], math.borsaKurus, 'alacak');
  push(lines, accounts.mustahsilMera || '360', ['MERA FONU', name, belge], math.meraKurus, 'alacak');
  push(lines, accounts.mustahsilSgk || '361', ['BAG-KUR SGK', name, belge], math.sgkKurus, 'alacak');
  const netAccount = counterAccount(accounts, fields.odemeSekli, 'alis');
  const netKurus = net + fark;
  push(
    lines,
    netAccount,
    [fark !== 0 ? `FARK ${formatTr(fromKurus(fark))}` : '', fields.odemeSekli === 'nakit' ? 'KASA' : 'SATICI', name, belge],
    netKurus,
    'alacak',
  );
  return { lines, farkKurus: fark };
}

function push(lines: JournalLine[], hesap: string, parts: string[], kurus: number, side: 'borc' | 'alacak'): void {
  if (kurus === 0) return;
  lines.push({
    hesapKodu: hesap.trim() || (side === 'borc' ? '153' : '360'),
    aciklama: cleanText(parts.filter(Boolean).join(' | '), 200),
    borc: side === 'borc' ? fromKurus(kurus) : 0,
    alacak: side === 'alacak' ? fromKurus(kurus) : 0,
  });
}

export function mustahsilSheetRows(docs: { fields: DocumentFields }[], accounts: AccountSettings): { rows: (string | number)[][]; kinds: ColumnKind[] } {
  const header = [
    'Tarih',
    'Makbuz No',
    'Üretici',
    'TCKN',
    'Ürün',
    'Miktar',
    'Birim',
    'Birim Fiyat',
    'Brüt',
    'Stopaj Oranı',
    'Stopaj',
    'Borsa Tescil',
    'SGK / Bağ-Kur',
    'Mera Fonu',
    'Net Ödenen',
    'Ödeme',
    'Brüt Hesap',
    'Stopaj Hesap',
    'SGK Hesap',
    'Net Hesap',
    'Logo Tipi',
  ];
  const rows: (string | number)[][] = [header];
  for (const doc of docs) {
    const fields = doc.fields;
    if (fields.belgeTuru !== 'mustahsil') continue;
    rows.push([
      toTrDate(fields.tarih),
      cleanText(fields.belgeNo, 40),
      cleanText(fields.saticiUnvan, 80),
      fields.vknTckn,
      cleanText(fields.urunCinsi, 80),
      fields.miktar ?? '',
      cleanText(fields.birim, 20),
      fields.birimFiyat ?? '',
      fields.brutTutar ?? 0,
      fields.stopajOran ?? '',
      fields.stopajTutar ?? 0,
      fields.borsaTescil ?? 0,
      fields.sgkKesinti ?? 0,
      fields.meraFonu ?? 0,
      fields.netOdenen ?? fields.toplam ?? 0,
      fields.odemeSekli,
      accounts.mustahsilMal,
      accounts.mustahsilStopaj,
      accounts.mustahsilSgk,
      counterAccount(accounts, fields.odemeSekli, 'alis'),
      accounts.mustahsilLogoTip,
    ]);
  }
  const moneyColumns = new Set([5, 7, 8, 10, 11, 12, 13, 14]);
  const intColumns = new Set([9, 20]);
  const kinds: ColumnKind[] = header.map((_, index) => (moneyColumns.has(index) ? 'money' : intColumns.has(index) ? 'int' : 'text'));
  return { rows, kinds };
}
