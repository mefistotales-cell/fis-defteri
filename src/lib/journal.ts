import { counterAccount, kdvAccount, matrahAccount } from './accounts.ts';
import { buildMustahsilJournal } from './mustahsil.ts';
import { completeFields, sinifKodu } from './classify.ts';
import { formatTr, fromKurus, toKurus } from './money.ts';
import { cleanText } from './text.ts';
import type { AccountSettings, DocumentFields, JournalLine, SinifKodu, Yon } from './types.ts';
import { moneyCheck } from './validate.ts';

export interface JournalResult {
  lines: JournalLine[];
  farkKurus: number;
}

export function buildJournal(rawFields: DocumentFields, accounts: AccountSettings): JournalResult {
  const fields = completeFields(rawFields);
  if (fields.belgeTuru === 'mustahsil') return buildMustahsilJournal(fields, accounts);
  const check = moneyCheck(fields);
  const target = check.toplamKurus ?? check.sumKurus;
  const fark = target - check.sumKurus;
  const lines: JournalLine[] = [];
  const name = cleanText(fields.saticiUnvan, 42);
  const belge = cleanText(fields.belgeNo, 32);
  const yon = fields.yon;
  const matrahSide = yon === 'alis' ? 'borc' : 'alacak';
  const karsiSide = yon === 'alis' ? 'alacak' : 'borc';

  const matrah = new Map<SinifKodu, number>();
  for (const row of fields.kdvSatirlari) {
    const code = sinifKodu(yon, row.tur);
    matrah.set(code, (matrah.get(code) ?? 0) + toKurus(row.matrah));
  }
  if (matrah.size === 0 && target !== 0) matrah.set(sinifKodu(yon, 'mal'), target);
  const farkOn = largestKey(matrah);
  if (fark !== 0 && farkOn && fields.kdvSatirlari.length > 0) {
    matrah.set(farkOn, (matrah.get(farkOn) ?? 0) + fark);
  }

  for (const [sinif, kurus] of matrah) {
    const label = sinif.endsWith('hizmet') ? 'HIZMET' : 'MAL';
    pushAmount(
      lines,
      matrahAccount(accounts, sinif),
      [fark !== 0 && sinif === farkOn ? `FARK ${formatTr(fromKurus(fark))}` : '', label, name, belge],
      kurus,
      matrahSide,
    );
  }

  const groups = new Map<string, { kurus: number; rates: number[] }>();
  const order: string[] = [];
  for (const row of fields.kdvSatirlari.slice().sort((a, b) => a.oran - b.oran)) {
    const kurus = toKurus(row.kdv);
    if (kurus === 0) continue;
    const account = kdvAccount(accounts, row.oran, yon);
    const group = groups.get(account);
    if (group) {
      group.kurus += kurus;
      group.rates.push(row.oran);
    } else {
      groups.set(account, { kurus, rates: [row.oran] });
      order.push(account);
    }
  }
  for (const account of order) {
    const group = groups.get(account);
    if (!group) continue;
    const rates = [...new Set(group.rates)].map((rate) => `%${rate}`).join('+');
    pushAmount(lines, account, [`KDV ${rates}`, name, belge], group.kurus, matrahSide);
  }

  if (target !== 0) {
    pushAmount(lines, counterAccount(accounts, fields.odemeSekli, yon), [payLabel(fields.odemeSekli, yon), name, belge], target, karsiSide);
  }

  return { lines, farkKurus: fields.kdvSatirlari.length === 0 ? 0 : fark };
}

function largestKey(amounts: Map<SinifKodu, number>): SinifKodu | null {
  let best: SinifKodu | null = null;
  let max = -1;
  for (const [key, value] of amounts) {
    if (value > max) {
      max = value;
      best = key;
    }
  }
  return best;
}

function payLabel(odeme: DocumentFields['odemeSekli'], yon: Yon): string {
  if (odeme === 'nakit') return 'KASA';
  if (odeme === 'kart') return 'POS';
  if (odeme === 'havale') return 'BANKA';
  return yon === 'satis' ? 'ALICI' : 'SATICI';
}

function pushAmount(
  lines: JournalLine[],
  hesap: string,
  parts: string[],
  kurus: number,
  side: 'borc' | 'alacak',
): void {
  if (kurus === 0) return;
  if (kurus < 0) {
    pushAmount(lines, hesap, parts, -kurus, side === 'borc' ? 'alacak' : 'borc');
    return;
  }
  lines.push({
    hesapKodu: hesap,
    aciklama: cleanText(parts.filter(Boolean).join(' | '), 200),
    borc: side === 'borc' ? fromKurus(kurus) : 0,
    alacak: side === 'alacak' ? fromKurus(kurus) : 0,
  });
}

export function journalBalances(lines: JournalLine[]): boolean {
  const borc = lines.reduce((sum, line) => sum + toKurus(line.borc), 0);
  const alacak = lines.reduce((sum, line) => sum + toKurus(line.alacak), 0);
  return borc === alacak;
}
