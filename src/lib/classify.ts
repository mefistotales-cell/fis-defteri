import { digitsOnly } from './taxId.ts';
import type { BelgeTuru, DocumentFields, KalemTuru, SinifKodu, Yon } from './types.ts';

export interface FirmaKimlik {
  unvan: string;
  vkn: string;
}

const MAL_WORDS = ['gübre', 'gubre', 'tohum', 'ilaç', 'ilac', 'mazot', 'motorin', 'benzin', 'yedek parça', 'yedek parca', 'üre', 'ure'];
const HIZMET_WORDS = ['nakliye', 'işçilik', 'iscilik', 'kira', 'tamir', 'danışmanlık', 'danismanlik', 'elektrik', 'telefon'];
const SHORT_WORDS = ['yem', 'su'];

export const SINIF_LABEL: Record<SinifKodu, string> = {
  'alis-mal': 'Alış mal',
  'alis-hizmet': 'Alış hizmet',
  'satis-mal': 'Satış mal',
  'satis-hizmet': 'Satış hizmet',
};

export function sinifKodu(yon: Yon, tur: KalemTuru): SinifKodu {
  return `${yon}-${tur}`;
}

export function foldName(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(anonim|sirketi|limited|ltd|sti|as|ticaret|sanayi|ve|gida)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(left: string, right: string): boolean {
  const a = foldName(left);
  const b = foldName(right);
  if (a.length < 3 || b.length < 3) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function classifyYon(
  fields: Pick<DocumentFields, 'belgeTuru' | 'saticiUnvan' | 'vknTckn' | 'aliciUnvan' | 'aliciVknTckn'>,
  firma: FirmaKimlik,
): Yon {
  const ownVkn = digitsOnly(firma.vkn);
  const sellerVkn = digitsOnly(fields.vknTckn);
  const buyerVkn = digitsOnly(fields.aliciVknTckn);
  if (fields.belgeTuru === 'mustahsil') return 'alis';
  if (ownVkn && sellerVkn && ownVkn === sellerVkn) return 'satis';
  if (ownVkn && buyerVkn && ownVkn === buyerVkn) return 'alis';
  if (namesMatch(firma.unvan, fields.saticiUnvan)) return 'satis';
  if (namesMatch(firma.unvan, fields.aliciUnvan)) return 'alis';
  return 'alis';
}

export function classifyTur(text: string): KalemTuru | null {
  const folded = foldName(text);
  if (!folded) return null;
  const words = new Set(folded.split(' '));
  const mal = MAL_WORDS.some((word) => folded.includes(foldName(word))) || SHORT_WORDS.some((word) => words.has(word) && word === 'yem');
  const hizmet =
    HIZMET_WORDS.some((word) => folded.includes(foldName(word))) || words.has('su');
  if (mal && !hizmet) return 'mal';
  if (hizmet && !mal) return 'hizmet';
  return null;
}

export function lineTur(aciklama: string, hinted: unknown, belgeTuru: BelgeTuru): KalemTuru {
  const fromKeyword = classifyTur(aciklama);
  if (fromKeyword) return fromKeyword;
  const hint = String(hinted ?? '').toLocaleLowerCase('tr');
  if (hint.includes('hizmet') || hint.includes('service')) return 'hizmet';
  if (hint.includes('mal') || hint.includes('stok') || hint.includes('goods')) return 'mal';
  return belgeTuru === 'fis' ? 'mal' : 'mal';
}

export function completeFields(fields: Partial<DocumentFields>, firma: FirmaKimlik = { unvan: '', vkn: '' }): DocumentFields {
  const aciklama = fields.aciklama ?? '';
  const belgeTuru = fields.belgeTuru === 'fatura' ? 'fatura' : fields.belgeTuru === 'mustahsil' ? 'mustahsil' : 'fis';
  const lines = (fields.kdvSatirlari ?? []).map((row) => {
    const lineText = row.aciklama || aciklama;
    const tur = row.tur === 'hizmet' || row.tur === 'mal' ? row.tur : lineTur(lineText, row.tur, belgeTuru);
    return {
      oran: row.oran,
      matrah: row.matrah,
      kdv: row.kdv,
      aciklama: row.aciklama ?? '',
      tur,
    };
  });
  const draft: DocumentFields = {
    belgeTuru,
    tarih: fields.tarih ?? '',
    saat: fields.saat ?? '',
    saticiUnvan: fields.saticiUnvan ?? '',
    vknTckn: fields.vknTckn ?? '',
    vergiDairesi: fields.vergiDairesi ?? '',
    belgeNo: fields.belgeNo ?? '',
    zNo: fields.zNo ?? '',
    ekuNo: fields.ekuNo ?? '',
    aliciUnvan: fields.aliciUnvan ?? '',
    aliciVknTckn: fields.aliciVknTckn ?? '',
    yon: 'alis',
    kdvSatirlari: lines,
    toplam: fields.toplam ?? null,
    odemeSekli: fields.odemeSekli ?? 'bilinmiyor',
    aciklama,
    urunCinsi: fields.urunCinsi ?? '',
    miktar: fields.miktar ?? null,
    birim: fields.birim ?? '',
    birimFiyat: fields.birimFiyat ?? null,
    brutTutar: fields.brutTutar ?? null,
    stopajOran: fields.stopajOran ?? null,
    stopajTutar: fields.stopajTutar ?? null,
    borsaTescil: fields.borsaTescil ?? null,
    sgkKesinti: fields.sgkKesinti ?? null,
    meraFonu: fields.meraFonu ?? null,
    netOdenen: fields.netOdenen ?? null,
    guven: fields.guven ?? {},
  };
  draft.yon = belgeTuru === 'mustahsil' ? 'alis' : fields.yon === 'satis' || fields.yon === 'alis' ? fields.yon : classifyYon(draft, firma);
  return draft;
}

export function applyFirma(fields: DocumentFields, firma: FirmaKimlik): DocumentFields {
  const completed = completeFields(fields, firma);
  if (completed.belgeTuru === 'mustahsil') return { ...completed, yon: 'alis' };
  return { ...completed, yon: classifyYon(completed, firma) };
}

export function classesIn(fields: DocumentFields): SinifKodu[] {
  const ready = completeFields(fields);
  const found = new Set<SinifKodu>();
  for (const row of ready.kdvSatirlari) found.add(sinifKodu(ready.yon, row.tur));
  if (found.size === 0) found.add(sinifKodu(ready.yon, 'mal'));
  return [...found];
}

export function sinifOzeti(fields: DocumentFields): string {
  const ready = completeFields(fields);
  if (ready.belgeTuru === 'mustahsil') return 'Müstahsil';
  const yon = ready.yon === 'satis' ? 'Satış' : 'Alış';
  const kinds = new Set(ready.kdvSatirlari.map((row) => row.tur));
  if (kinds.size > 1) return `${yon} · Karma`;
  if (kinds.has('hizmet')) return `${yon} · Hizmet`;
  return `${yon} · Mal`;
}

export function parseKalemTuru(value: unknown): KalemTuru | null {
  const hint = String(value ?? '').toLocaleLowerCase('tr');
  if (!hint) return null;
  if (hint.includes('hizmet') || hint === 'service') return 'hizmet';
  if (hint.includes('mal') || hint.includes('stok')) return 'mal';
  return null;
}
