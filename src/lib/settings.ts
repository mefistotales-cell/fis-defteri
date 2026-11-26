import { DEFAULT_ACCOUNTS, mergeAccounts } from './accounts.ts';
import { cloneColumns, DEFAULT_COLUMNS, mergeColumnMaps } from './columns.ts';
import type { AppSettings, ProviderId } from './types.ts';

export const SETTINGS_KEY = 'haskara.fis-defteri.settings.v1';
export const VIEW_MONTH_KEY = 'haskara.fis-defteri.month';

const RETIRED_MODELS: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-flash-latest',
  'google/gemini-2.5-flash': 'google/gemini-flash-latest',
};

export const PROVIDERS: Record<ProviderId, { label: string; model: string; baseUrl: string; hint: string }> = {
  gemini: {
    label: 'Google Gemini',
    model: 'gemini-flash-latest',
    baseUrl: '',
    hint: 'Telefonda doğrudan çalışır ve fiş okumada yeterlidir. Anahtar: aistudio.google.com/apikey',
  },
  openai: {
    label: 'OpenAI',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    hint: 'Anahtar: platform.openai.com/api-keys',
  },
  openrouter: {
    label: 'OpenRouter',
    model: 'google/gemini-flash-latest',
    baseUrl: 'https://openrouter.ai/api/v1',
    hint: 'Tek anahtarla birçok model. Anahtar: openrouter.ai/keys',
  },
  custom: {
    label: 'OpenAI uyumlu adres',
    model: '',
    baseUrl: '',
    hint: 'Adres /v1 ile bitsin. Örnek: https://api.openai.com/v1',
  },
};

export function defaultSettings(): AppSettings {
  return {
    provider: 'gemini',
    apiKey: '',
    model: PROVIDERS.gemini.model,
    baseUrl: '',
    dosyaOneki: 'Haskara',
    csvAyrac: ',',
    fisLogoTip: 4,
    faturaLogoTip: 1,
    firmaUnvan: 'Haskara Tarım',
    firmaVkn: '',
    hesaplar: structuredClone(DEFAULT_ACCOUNTS),
    sutunlar: {
      lucaFatura: cloneColumns(DEFAULT_COLUMNS.lucaFatura),
      lucaFis: cloneColumns(DEFAULT_COLUMNS.lucaFis),
      logoAlim: cloneColumns(DEFAULT_COLUMNS.logoAlim),
      logoFis: cloneColumns(DEFAULT_COLUMNS.logoFis),
      ozet: cloneColumns(DEFAULT_COLUMNS.ozet),
    },
  };
}

export function mergeSettings(value: unknown): AppSettings {
  const base = defaultSettings();
  const raw = value && typeof value === 'object' ? (value as Partial<AppSettings>) : {};
  const provider = isProvider(raw.provider) ? raw.provider : base.provider;
  return {
    provider,
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
    model: resolveStoredModel(raw.model, provider),
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : PROVIDERS[provider].baseUrl,
    dosyaOneki: typeof raw.dosyaOneki === 'string' && raw.dosyaOneki.trim() ? raw.dosyaOneki.trim() : 'Haskara',
    csvAyrac: raw.csvAyrac === ';' ? ';' : ',',
    fisLogoTip: numberOr(raw.fisLogoTip, 4),
    faturaLogoTip: numberOr(raw.faturaLogoTip, 1),
    firmaUnvan: typeof raw.firmaUnvan === 'string' && raw.firmaUnvan.trim() ? raw.firmaUnvan.trim() : 'Haskara Tarım',
    firmaVkn: typeof raw.firmaVkn === 'string' ? raw.firmaVkn.trim() : '',
    hesaplar: mergeAccounts(raw.hesaplar),
    sutunlar: mergeColumnMaps(raw.sutunlar),
  };
}

export function loadSettings(): AppSettings {
  if (typeof localStorage === 'undefined') return defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return mergeSettings(JSON.parse(raw) as unknown);
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resolvedModel(settings: AppSettings): string {
  return settings.model.trim() || PROVIDERS[settings.provider].model;
}

export function resolvedBaseUrl(settings: AppSettings): string {
  return settings.baseUrl.trim() || PROVIDERS[settings.provider].baseUrl;
}

function resolveStoredModel(value: unknown, provider: ProviderId): string {
  const fallback = PROVIDERS[provider].model;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return RETIRED_MODELS[value.trim()] ?? value.trim();
}

function isProvider(value: unknown): value is ProviderId {
  return value === 'gemini' || value === 'openai' || value === 'openrouter' || value === 'custom';
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
