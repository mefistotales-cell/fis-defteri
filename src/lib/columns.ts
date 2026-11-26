import type { ColumnMaps, ColumnSpec } from './types.ts';

/**
 * Luca fatura aktarımı sabit bir xlsx şablonu yayınlamaz. Resmi ekran
 * (01.02.11, Nisan 2021) en fazla 15 sütun kabul eder ve her sütuna kural
 * bağlanır: Evrak Tarihi, Evrak No, Açıklama, Tutar, VKN ile hesap.
 * 2021 örneğindeki %8/%18 sütunları güncel oranlara (%1/%10/%20) çevrildi.
 * Başlıklar Ayarlar'dan Luca'da kayıtlı şablonunuza göre değiştirilir.
 *
 * Luca fiş aktarımında zorunlu alanlar resmi belgede (01.02.09) şunlardır:
 * Fiş No, Fiş Tarihi, Hesap Kodu, Borç, Alacak. Diğer sütunlar kapatılabilir.
 *
 * Logo Tiger/GO fatura Excel'i ExcelTrans'ta kullanıcı tanımlıdır; yerleşik
 * "Excel'den Veri Aktarımı" fatura almaz. Logo sütunları bu yüzden varsayımdır.
 */
export const DEFAULT_COLUMNS: ColumnMaps = {
  lucaFatura: [
    col('evrakTarihi', 'Evrak Tarihi', true, 'text'),
    col('evrakNo', 'Evrak No', true, 'text'),
    col('vkn', 'VKN/TCKN', true, 'text'),
    col('unvan', 'Unvan', true, 'text'),
    col('aciklama', 'Açıklama', true, 'text'),
    col('matrah0', 'Matrah %0', true, 'money'),
    col('matrah1', 'Matrah %1', true, 'money'),
    col('matrah10', 'Matrah %10', true, 'money'),
    col('matrah20', 'Matrah %20', true, 'money'),
    col('kdv1', 'KDV %1', true, 'money'),
    col('kdv10', 'KDV %10', true, 'money'),
    col('kdv20', 'KDV %20', true, 'money'),
    col('toplam', 'Toplam', true, 'money'),
    col('tevkifat', 'Tevkifat KDV', true, 'money'),
    col('karsiHesap', 'Karşı Hesap', true, 'text'),
    col('sinif', 'Sınıf', false, 'text'),
    col('matrah8', 'Matrah %8', false, 'money'),
    col('kdv8', 'KDV %8', false, 'money'),
    col('matrah18', 'Matrah %18', false, 'money'),
    col('kdv18', 'KDV %18', false, 'money'),
  ],
  lucaFis: [
    col('fisNo', 'Fiş No', true, 'text'),
    col('fisTarihi', 'Fiş Tarihi', true, 'text'),
    col('hesapKodu', 'Hesap Kodu', true, 'text'),
    col('evrakNo', 'Evrak No', true, 'text'),
    col('evrakTarihi', 'Evrak Tarihi', true, 'text'),
    col('aciklama', 'Açıklama', true, 'text'),
    col('borc', 'Borç', true, 'money'),
    col('alacak', 'Alacak', true, 'money'),
    col('belgeTuru', 'Belge Türü', false, 'text'),
    col('miktar', 'Miktar', false, 'text'),
    col('paraBirimi', 'Para Birimi', false, 'text'),
    col('hesapAdi', 'Hesap Adı', false, 'text'),
  ],
  logoAlim: [
    col('faturaTarihi', 'Fatura Tarihi', true, 'text'),
    col('faturaNo', 'Fatura No', true, 'text'),
    col('belgeTuru', 'Belge Türü', true, 'text'),
    col('logoTip', 'Logo Fatura Tipi', true, 'int'),
    col('cariUnvan', 'Cari Ünvan', true, 'text'),
    col('vkn', 'VKN/TCKN', true, 'text'),
    col('vergiDairesi', 'Vergi Dairesi', true, 'text'),
    col('aciklama', 'Açıklama', true, 'text'),
    col('matrah1', 'Matrah %1', true, 'money'),
    col('kdv1', 'KDV %1', true, 'money'),
    col('matrah10', 'Matrah %10', true, 'money'),
    col('kdv10', 'KDV %10', true, 'money'),
    col('matrah20', 'Matrah %20', true, 'money'),
    col('kdv20', 'KDV %20', true, 'money'),
    col('toplam', 'Toplam', true, 'money'),
    col('odeme', 'Ödeme', true, 'text'),
    col('karsiHesap', 'Karşı Hesap Kodu', true, 'text'),
    col('sinif', 'Sınıf', false, 'text'),
    col('matrah8', 'Matrah %8', false, 'money'),
    col('kdv8', 'KDV %8', false, 'money'),
    col('matrah18', 'Matrah %18', false, 'money'),
    col('kdv18', 'KDV %18', false, 'money'),
  ],
  logoFis: [
    col('fisTarihi', 'Fiş Tarihi', true, 'text'),
    col('fisNo', 'Fiş No', true, 'text'),
    col('belgeNo', 'Belge No', true, 'text'),
    col('hesapKodu', 'Hesap Kodu', true, 'text'),
    col('aciklama', 'Açıklama', true, 'text'),
    col('borc', 'Borç', true, 'money'),
    col('alacak', 'Alacak', true, 'money'),
  ],
  ozet: [
    col('tarih', 'Tarih', true, 'text'),
    col('saat', 'Saat', true, 'text'),
    col('tur', 'Belge Türü', true, 'text'),
    col('satici', 'Satıcı', true, 'text'),
    col('vkn', 'VKN/TCKN', true, 'text'),
    col('vergiDairesi', 'Vergi Dairesi', true, 'text'),
    col('belgeNo', 'Belge No', true, 'text'),
    col('zNo', 'Z No', true, 'text'),
    col('ekuNo', 'EKÜ No', true, 'text'),
    col('matrah1', 'Matrah %1', true, 'money'),
    col('kdv1', 'KDV %1', true, 'money'),
    col('matrah10', 'Matrah %10', true, 'money'),
    col('kdv10', 'KDV %10', true, 'money'),
    col('matrah20', 'Matrah %20', true, 'money'),
    col('kdv20', 'KDV %20', true, 'money'),
    col('digerMatrah', 'Diğer Matrah', true, 'money'),
    col('digerKdv', 'Diğer KDV', true, 'money'),
    col('toplam', 'Toplam', true, 'money'),
    col('odeme', 'Ödeme', true, 'text'),
    col('sinif', 'Sınıf', true, 'text'),
    col('aciklama', 'Açıklama', true, 'text'),
    col('uyarilar', 'Uyarılar', true, 'text'),
  ],
};

export const LUCA_FATURA_COLUMN_LIMIT = 15;
export const LUCA_FIS_DOC_LIMIT = 50;
export const LUCA_LINE_LIMIT = 400;

const RATE_BY_KEY: Record<string, number> = {
  matrah0: 0,
  matrah1: 1,
  kdv1: 1,
  matrah8: 8,
  kdv8: 8,
  matrah10: 10,
  kdv10: 10,
  matrah18: 18,
  kdv18: 18,
  matrah20: 20,
  kdv20: 20,
};

function col(key: string, header: string, enabled: boolean, kind: ColumnSpec['kind']): ColumnSpec {
  return { key, header, enabled, kind };
}

export function cloneColumns(columns: ColumnSpec[]): ColumnSpec[] {
  return columns.map((column) => ({ ...column }));
}

export function enabledColumns(columns: ColumnSpec[]): ColumnSpec[] {
  return columns.filter((column) => column.enabled);
}

export function handledRates(columns: ColumnSpec[]): number[] {
  const rates = new Set<number>();
  for (const column of columns) {
    if (!column.enabled) continue;
    const rate = RATE_BY_KEY[column.key];
    if (rate !== undefined && column.key.startsWith('matrah')) rates.add(rate);
  }
  return [...rates];
}

export function mergeColumnList(saved: unknown, defaults: ColumnSpec[]): ColumnSpec[] {
  if (!Array.isArray(saved)) return cloneColumns(defaults);
  const byKey = new Map(defaults.map((column) => [column.key, column]));
  const used = new Set<string>();
  const merged: ColumnSpec[] = [];
  for (const item of saved) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<ColumnSpec>;
    if (typeof raw.key !== 'string') continue;
    const base = byKey.get(raw.key);
    if (!base || used.has(raw.key)) continue;
    used.add(raw.key);
    merged.push({
      key: base.key,
      header: typeof raw.header === 'string' && raw.header.trim() ? raw.header.trim() : base.header,
      enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
      kind: base.kind,
    });
  }
  for (const column of defaults) {
    if (!used.has(column.key)) merged.push({ ...column });
  }
  return merged;
}

export function mergeColumnMaps(saved: unknown): ColumnMaps {
  const raw = saved && typeof saved === 'object' ? (saved as Partial<ColumnMaps>) : {};
  return {
    lucaFatura: mergeColumnList(raw.lucaFatura, DEFAULT_COLUMNS.lucaFatura),
    lucaFis: mergeColumnList(raw.lucaFis, DEFAULT_COLUMNS.lucaFis),
    logoAlim: mergeColumnList(raw.logoAlim, DEFAULT_COLUMNS.logoAlim),
    logoFis: mergeColumnList(raw.logoFis, DEFAULT_COLUMNS.logoFis),
    ozet: mergeColumnList(raw.ozet, DEFAULT_COLUMNS.ozet),
  };
}
