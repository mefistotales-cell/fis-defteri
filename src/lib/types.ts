export type BelgeTuru = 'fis' | 'fatura' | 'mustahsil';

export type OdemeSekli = 'nakit' | 'kart' | 'havale' | 'acik' | 'bilinmiyor';

export type Confidence = 'yuksek' | 'orta' | 'dusuk';

export type Yon = 'alis' | 'satis';

export type KalemTuru = 'mal' | 'hizmet';

export type SinifKodu = 'alis-mal' | 'alis-hizmet' | 'satis-mal' | 'satis-hizmet';

export interface KdvSatiri {
  oran: number;
  matrah: number;
  kdv: number;
  tur: KalemTuru;
  aciklama: string;
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
  aliciUnvan: string;
  aliciVknTckn: string;
  yon: Yon;
  kdvSatirlari: KdvSatiri[];
  toplam: number | null;
  odemeSekli: OdemeSekli;
  aciklama: string;
  urunCinsi: string;
  miktar: number | null;
  birim: string;
  birimFiyat: number | null;
  brutTutar: number | null;
  stopajOran: number | null;
  stopajTutar: number | null;
  borsaTescil: number | null;
  sgkKesinti: number | null;
  meraFonu: number | null;
  netOdenen: number | null;
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
  kdvSatis: Record<string, string>;
  sinif: Record<SinifKodu, string>;
  logoTip: Record<SinifKodu, number>;
  saticilar: string;
  alicilar: string;
  kasa: string;
  kart: string;
  havale: string;
  karsiHesap: string;
  mustahsilMal: string;
  mustahsilStopaj: string;
  mustahsilSgk: string;
  mustahsilBorsa: string;
  mustahsilMera: string;
  mustahsilLogoTip: number;
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
  firmaUnvan: string;
  firmaVkn: string;
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
  if (tur === 'mustahsil') return 'Müstahsil';
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
    aliciUnvan: '',
    aliciVknTckn: '',
    yon: 'alis',
    kdvSatirlari: [],
    toplam: null,
    odemeSekli: 'bilinmiyor',
    aciklama: '',
    urunCinsi: '',
    miktar: null,
    birim: '',
    birimFiyat: null,
    brutTutar: null,
    stopajOran: null,
    stopajTutar: null,
    borsaTescil: null,
    sgkKesinti: null,
    meraFonu: null,
    netOdenen: null,
    guven: {},
  };
}
