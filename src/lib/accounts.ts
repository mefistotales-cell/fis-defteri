import type { AccountSettings, OdemeSekli } from './types.ts';

export const DEFAULT_ACCOUNTS: AccountSettings = {
  gider: '770',
  kdv: {
    '1': '191.01',
    '8': '191.08',
    '10': '191.10',
    '18': '191.18',
    '20': '191.20',
    diger: '191',
  },
  saticilar: '320',
  kasa: '100',
  kart: '108',
  havale: '102',
  karsiHesap: '770',
};

export function mergeAccounts(value: unknown): AccountSettings {
  const raw = value && typeof value === 'object' ? (value as Partial<AccountSettings>) : {};
  const kdvRaw = raw.kdv && typeof raw.kdv === 'object' ? raw.kdv : {};
  return {
    gider: text(raw.gider, DEFAULT_ACCOUNTS.gider),
    kdv: { ...DEFAULT_ACCOUNTS.kdv, ...stringRecord(kdvRaw) },
    saticilar: text(raw.saticilar, DEFAULT_ACCOUNTS.saticilar),
    kasa: text(raw.kasa, DEFAULT_ACCOUNTS.kasa),
    kart: text(raw.kart, DEFAULT_ACCOUNTS.kart),
    havale: text(raw.havale, DEFAULT_ACCOUNTS.havale),
    karsiHesap: text(raw.karsiHesap, DEFAULT_ACCOUNTS.karsiHesap),
  };
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function stringRecord(value: object): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && item.trim()) out[key] = item.trim();
  }
  return out;
}

export function codeOr(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function kdvAccount(accounts: AccountSettings, oran: number): string {
  return accounts.kdv[String(oran)]?.trim() || accounts.kdv.diger?.trim() || '191';
}

export function creditAccount(accounts: AccountSettings, odeme: OdemeSekli): string {
  if (odeme === 'nakit') return codeOr(accounts.kasa, '100');
  if (odeme === 'kart') return codeOr(accounts.kart, '108');
  if (odeme === 'havale') return codeOr(accounts.havale, '102');
  return codeOr(accounts.saticilar, '320');
}
