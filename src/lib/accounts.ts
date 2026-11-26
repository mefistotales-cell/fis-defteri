import type { AccountSettings, OdemeSekli, SinifKodu, Yon } from './types.ts';

export const DEFAULT_KDV_ALIS: Record<string, string> = {
  '1': '191.01',
  '8': '191.08',
  '10': '191.10',
  '18': '191.18',
  '20': '191.20',
  diger: '191',
};

export const DEFAULT_KDV_SATIS: Record<string, string> = {
  '1': '391.01',
  '8': '391.08',
  '10': '391.10',
  '18': '391.18',
  '20': '391.20',
  diger: '391',
};

export const DEFAULT_SINIF: Record<SinifKodu, string> = {
  'alis-mal': '153',
  'alis-hizmet': '770',
  'satis-mal': '600',
  'satis-hizmet': '600',
};

export const DEFAULT_LOGO_TIP: Record<SinifKodu, number> = {
  'alis-mal': 1,
  'alis-hizmet': 4,
  'satis-mal': 8,
  'satis-hizmet': 9,
};

export const DEFAULT_ACCOUNTS: AccountSettings = {
  gider: '770',
  kdv: { ...DEFAULT_KDV_ALIS },
  kdvSatis: { ...DEFAULT_KDV_SATIS },
  sinif: { ...DEFAULT_SINIF },
  logoTip: { ...DEFAULT_LOGO_TIP },
  saticilar: '320',
  alicilar: '120',
  kasa: '100',
  kart: '108',
  havale: '102',
  karsiHesap: '153',
  mustahsilMal: '153',
  mustahsilStopaj: '360',
  mustahsilSgk: '361',
  mustahsilBorsa: '360',
  mustahsilMera: '360',
  mustahsilLogoTip: 26,
};

export function mergeAccounts(value: unknown): AccountSettings {
  const raw = value && typeof value === 'object' ? (value as Partial<AccountSettings>) : {};
  const kdvRaw = raw.kdv && typeof raw.kdv === 'object' ? raw.kdv : {};
  const kdvSatisRaw = raw.kdvSatis && typeof raw.kdvSatis === 'object' ? raw.kdvSatis : {};
  const sinifRaw = raw.sinif && typeof raw.sinif === 'object' ? raw.sinif : {};
  const logoRaw = raw.logoTip && typeof raw.logoTip === 'object' ? raw.logoTip : {};
  return {
    gider: text(raw.gider, DEFAULT_ACCOUNTS.gider),
    kdv: { ...DEFAULT_ACCOUNTS.kdv, ...stringRecord(kdvRaw) },
    kdvSatis: { ...DEFAULT_ACCOUNTS.kdvSatis, ...stringRecord(kdvSatisRaw) },
    sinif: { ...DEFAULT_ACCOUNTS.sinif, ...stringRecord(sinifRaw) },
    logoTip: { ...DEFAULT_ACCOUNTS.logoTip, ...numberRecord(logoRaw) },
    saticilar: text(raw.saticilar, DEFAULT_ACCOUNTS.saticilar),
    alicilar: text(raw.alicilar, DEFAULT_ACCOUNTS.alicilar),
    kasa: text(raw.kasa, DEFAULT_ACCOUNTS.kasa),
    kart: text(raw.kart, DEFAULT_ACCOUNTS.kart),
    havale: text(raw.havale, DEFAULT_ACCOUNTS.havale),
    karsiHesap: text(raw.karsiHesap, DEFAULT_ACCOUNTS.karsiHesap),
    mustahsilMal: text(raw.mustahsilMal, DEFAULT_ACCOUNTS.mustahsilMal),
    mustahsilStopaj: text(raw.mustahsilStopaj, DEFAULT_ACCOUNTS.mustahsilStopaj),
    mustahsilSgk: text(raw.mustahsilSgk, DEFAULT_ACCOUNTS.mustahsilSgk),
    mustahsilBorsa: text(raw.mustahsilBorsa, DEFAULT_ACCOUNTS.mustahsilBorsa),
    mustahsilMera: text(raw.mustahsilMera, DEFAULT_ACCOUNTS.mustahsilMera),
    mustahsilLogoTip: typeof raw.mustahsilLogoTip === 'number' && Number.isFinite(raw.mustahsilLogoTip) ? raw.mustahsilLogoTip : DEFAULT_ACCOUNTS.mustahsilLogoTip,
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

function numberRecord(value: object): Partial<Record<SinifKodu, number>> {
  const out: Partial<Record<SinifKodu, number>> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && Number.isFinite(item)) out[key as SinifKodu] = item;
  }
  return out;
}

export function codeOr(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function kdvAccount(accounts: AccountSettings, oran: number, yon: Yon = 'alis'): string {
  const table = yon === 'satis' ? accounts.kdvSatis : accounts.kdv;
  return table[String(oran)]?.trim() || table.diger?.trim() || (yon === 'satis' ? '391' : '191');
}

export function matrahAccount(accounts: AccountSettings, sinif: SinifKodu): string {
  return codeOr(accounts.sinif[sinif], DEFAULT_SINIF[sinif]);
}

export function logoTipFor(accounts: AccountSettings, sinif: SinifKodu): number {
  const value = accounts.logoTip[sinif];
  return Number.isFinite(value) ? value : DEFAULT_LOGO_TIP[sinif];
}

export function counterAccount(accounts: AccountSettings, odeme: OdemeSekli, yon: Yon): string {
  if (odeme === 'nakit') return codeOr(accounts.kasa, '100');
  if (odeme === 'kart') return codeOr(accounts.kart, '108');
  if (odeme === 'havale') return codeOr(accounts.havale, '102');
  return yon === 'satis' ? codeOr(accounts.alicilar, '120') : codeOr(accounts.saticilar, '320');
}

export function creditAccount(accounts: AccountSettings, odeme: OdemeSekli): string {
  return counterAccount(accounts, odeme, 'alis');
}
