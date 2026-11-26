import { codeOr, creditAccount, kdvAccount } from './accounts.ts';
import { formatTr, fromKurus, toKurus } from './money.ts';
import { cleanText } from './text.ts';
import type { AccountSettings, DocumentFields, JournalLine } from './types.ts';
import { moneyCheck } from './validate.ts';

export interface JournalResult {
  lines: JournalLine[];
  farkKurus: number;
}

export function buildJournal(fields: DocumentFields, accounts: AccountSettings): JournalResult {
  const check = moneyCheck(fields);
  const target = check.toplamKurus ?? check.sumKurus;
  const fark = target - check.sumKurus;
  const lines: JournalLine[] = [];
  const name = cleanText(fields.saticiUnvan, 42);
  const belge = cleanText(fields.belgeNo, 32);

  const giderKurus = check.matrahKurus + fark;
  if (giderKurus !== 0) {
    const parts = [
      fark !== 0 ? `FARK ${formatTr(fromKurus(fark))}` : '',
      'MATRAH',
      name,
      belge,
    ];
    pushAmount(lines, codeOr(accounts.gider, '770'), parts, giderKurus, 'borc');
  }

  const groups = new Map<string, { kurus: number; rates: number[] }>();
  const order: string[] = [];
  const rows = fields.kdvSatirlari.slice().sort((a, b) => a.oran - b.oran);
  for (const row of rows) {
    const kurus = toKurus(row.kdv);
    if (kurus === 0) continue;
    const account = kdvAccount(accounts, row.oran);
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
    pushAmount(lines, account, [`KDV ${rates}`, name, belge], group.kurus, 'borc');
  }

  if (target !== 0) {
    const pay =
      fields.odemeSekli === 'nakit'
        ? 'KASA'
        : fields.odemeSekli === 'kart'
          ? 'POS'
          : fields.odemeSekli === 'havale'
            ? 'BANKA'
            : 'SATICI';
    pushAmount(lines, creditAccount(accounts, fields.odemeSekli), [pay, name, belge], target, 'alacak');
  }

  return { lines, farkKurus: fark };
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
