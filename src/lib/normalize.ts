import { toIsoDate, toTime } from './dates.ts';
import { fromKurus, parseTurkishNumber, toKurus } from './money.ts';
import { digitsOnly } from './taxId.ts';
import { cleanText } from './text.ts';
import type { BelgeTuru, Confidence, DocumentFields, KdvSatiri, OdemeSekli } from './types.ts';
import { emptyFields } from './types.ts';

export function parseModelJson(text: string): unknown {
  let source = text.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(source);
  if (fence) source = fence[1].trim();
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model JSON döndürmedi.');
  return JSON.parse(source.slice(start, end + 1)) as unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function text(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return cleanText(value, 180);
}

function confidence(value: unknown): Confidence | undefined {
  const raw = String(value ?? '').toLocaleLowerCase('tr');
  if (['yuksek', 'yüksek', 'high'].includes(raw)) return 'yuksek';
  if (['orta', 'medium'].includes(raw)) return 'orta';
  if (['dusuk', 'düşük', 'low'].includes(raw)) return 'dusuk';
  return undefined;
}

function belgeTuru(value: unknown): { tur: BelgeTuru; sure: boolean } {
  const raw = String(value ?? '').toLocaleLowerCase('tr');
  if (raw.includes('fatura') || raw.includes('arşiv') || raw.includes('arsiv') || raw.includes('invoice')) {
    return { tur: 'fatura', sure: true };
  }
  if (raw.includes('fiş') || raw.includes('fis') || raw.includes('ökc') || raw.includes('okc') || raw.includes('yazar')) {
    return { tur: 'fis', sure: true };
  }
  return { tur: 'fis', sure: false };
}

function odeme(value: unknown): OdemeSekli {
  const raw = String(value ?? '').toLocaleLowerCase('tr');
  if (!raw || raw.includes('bilin') || raw === 'null') return 'bilinmiyor';
  if (raw.includes('nakit') || raw.includes('cash') || raw.includes('peşin') || raw.includes('pesin')) return 'nakit';
  if (raw.includes('kart') || raw.includes('pos') || raw.includes('kredi')) return 'kart';
  if (raw.includes('havale') || raw.includes('eft') || raw.includes('transfer')) return 'havale';
  if (raw.includes('açık') || raw.includes('acik') || raw.includes('veresiye') || raw.includes('cari')) return 'acik';
  return 'bilinmiyor';
}

function oranOf(value: unknown): number | null {
  const n = parseTurkishNumber(value);
  if (n == null) return null;
  const scaled = n > 0 && n < 1 ? Math.round(n * 100) : Math.round(n);
  if (scaled < 0 || scaled > 100) return null;
  return scaled;
}

function kdvRows(raw: unknown): KdvSatiri[] {
  const items: unknown[] = [];
  if (Array.isArray(raw)) items.push(...raw);
  const record = asRecord(raw);
  if (record) {
    for (const [key, value] of Object.entries(record)) {
      const nested = asRecord(value);
      if (nested) items.push({ oran: key, ...nested });
    }
  }

  const merged = new Map<number, { matrah: number; kdv: number }>();
  for (const item of items) {
    const row = asRecord(item);
    if (!row) continue;
    const oran = oranOf(row.oran ?? row.rate ?? row.kdvOrani ?? row.oranYuzde);
    if (oran == null) continue;
    const matrah = parseTurkishNumber(row.matrah ?? row.base ?? row.matrahTutar ?? row.kdvsiz) ?? 0;
    const kdv = parseTurkishNumber(row.kdv ?? row.kdvTutari ?? row.kdvTutar ?? row.tax) ?? 0;
    const current = merged.get(oran) ?? { matrah: 0, kdv: 0 };
    current.matrah += toKurus(matrah);
    current.kdv += toKurus(kdv);
    merged.set(oran, current);
  }

  return [...merged.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([oran, sums]) => ({
      oran,
      matrah: fromKurus(sums.matrah),
      kdv: fromKurus(sums.kdv),
    }))
    .filter((row) => row.matrah !== 0 || row.kdv !== 0);
}

export function normalizeExtraction(raw: unknown): DocumentFields {
  const record = asRecord(raw) ?? {};
  const fields = emptyFields();
  const tur = belgeTuru(record.belgeTuru ?? record.tur ?? record.type);
  fields.belgeTuru = tur.tur;
  fields.tarih = toIsoDate(record.tarih ?? record.date);
  fields.saat = toTime(record.saat ?? record.time);
  fields.saticiUnvan = text(record.saticiUnvan ?? record.unvan ?? record.satici ?? record.seller);
  fields.vknTckn = digitsOnly(text(record.vknTckn ?? record.vkn ?? record.tckn ?? record.vergiNo));
  fields.vergiDairesi = text(record.vergiDairesi ?? record.vd);
  fields.belgeNo = text(record.belgeNo ?? record.fisNo ?? record.faturaNo ?? record.evrakNo);
  fields.zNo = text(record.zNo ?? record.z ?? record.zRaporNo);
  fields.ekuNo = text(record.ekuNo ?? record.eku);
  fields.kdvSatirlari = kdvRows(record.kdv ?? record.kdvSatirlari ?? record.kdvDokumu);
  const toplam = parseTurkishNumber(record.toplam ?? record.genelToplam ?? record.total);
  fields.toplam = toplam;
  fields.odemeSekli = odeme(record.odemeSekli ?? record.odeme ?? record.payment);
  fields.aciklama = text(record.aciklama ?? record.mal ?? record.description);

  const guven = asRecord(record.guven ?? record.confidence) ?? {};
  for (const [key, value] of Object.entries(guven)) {
    const level = confidence(value);
    if (level) fields.guven[key] = level;
  }
  if (!tur.sure) fields.guven.belgeTuru = 'dusuk';
  return fields;
}
