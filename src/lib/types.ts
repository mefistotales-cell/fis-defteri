export type BelgeTuru = 'fis' | 'fatura';

export type OdemeSekli = 'nakit' | 'kart' | 'havale' | 'acik' | 'bilinmiyor';

export type Confidence = 'yuksek' | 'orta' | 'dusuk';

export interface KdvSatiri {
  oran: number;
  matrah: number;
  kdv: number;
}

export interface DocumentFields {
  belgeTuru: BelgeTuru;
  tarih: string;
  saat: string;
  saticiUnvan: string;
  vknTckn: string;
  vergiDairesi: string;
  belgeNo: string;
  zNo: string;
  ekuNo: string;
  kdvSatirlari: KdvSatiri[];
  toplam: number | null;
  odemeSekli: OdemeSekli;
  aciklama: string;
  guven: Partial<Record<string, Confidence>>;
}

export interface SavedDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  image: Blob | null;
  fields: DocumentFields;
}

export interface ExportDoc {
  id: string;
  createdAt: string;
  fields: DocumentFields;
}

export interface FieldWarning {
  field: string;
  level: 'uyari' | 'hata';
  message: string;
}

export type ColumnKind = 'text' | 'money' | 'int';

export interface ColumnSpec {
  key: string;
  header: string;
  enabled: boolean;
  kind: ColumnKind;
}

export interface AccountSettings {
  gider: string;
  kdv: Record<string, string>;
  saticilar: string;
  kasa: string;
  kart: string;
  havale: string;
  karsiHesap: string;
}

export type ProviderId = 'gemini' | 'openai' | 'openrouter' | 'custom';

export interface ColumnMaps {
  lucaFatura: ColumnSpec[];
  lucaFis: ColumnSpec[];
  logoAlim: ColumnSpec[];
  logoFis: ColumnSpec[];
  ozet: ColumnSpec[];
}

export interface AppSettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  dosyaOneki: string;
  csvAyrac: ',' | ';';
  fisLogoTip: number;
  faturaLogoTip: number;
  hesaplar: AccountSettings;
  sutunlar: ColumnMaps;
}

export interface JournalLine {
  hesapKodu: string;
  aciklama: string;
  borc: number;
  alacak: number;
}

export function belgeLabel(tur: BelgeTuru): string {
  return tur === 'fis' ? 'Fiş' : 'Fatura';
}

export const ODEME_LABEL: Record<OdemeSekli, string> = {
  nakit: 'Nakit',
  kart: 'Kart',
  havale: 'Havale/EFT',
  acik: 'Açık hesap',
  bilinmiyor: 'Belirtilmemiş',
};

export function emptyFields(): DocumentFields {
  return {
    belgeTuru: 'fis',
    tarih: '',
    saat: '',
    saticiUnvan: '',
    vknTckn: '',
    vergiDairesi: '',
    belgeNo: '',
    zNo: '',
    ekuNo: '',
    kdvSatirlari: [],
    toplam: null,
    odemeSekli: 'bilinmiyor',
    aciklama: '',
    guven: {},
  };
}
