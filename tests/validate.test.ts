import { describe, expect, it } from 'vitest';
import { normalizeExtraction } from '../src/lib/normalize.ts';
import { moneyCheck, validateDocument } from '../src/lib/validate.ts';
import { SAMPLES } from '../src/lib/samples.ts';
import { eskiOranModel, tutarsizModel } from './fixtures/model-responses.ts';

const now = new Date('2026-11-26T12:00:00');

describe('belge kontrolü', () => {
  it('örnek fişte uyarı bırakmaz', () => {
    const warnings = validateDocument(SAMPLES[0].fields, now);
    expect(warnings).toEqual([]);
  });

  it('matrah + KDV toplama uymuyorsa farkı yazar', () => {
    const fields = SAMPLES[1].fields;
    const check = moneyCheck(fields);
    expect(check.sumKurus).toBe(78000);
    expect(check.farkKurus).toBe(200);
    const warnings = validateDocument(fields, now);
    expect(warnings.some((warning) => warning.field === 'toplam' && warning.level === 'hata')).toBe(true);
    expect(warnings.some((warning) => warning.message.includes('2,00'))).toBe(true);
    expect(warnings.some((warning) => warning.field === 'vergiDairesi')).toBe(true);
  });

  it('kısa kimlik numarasını ve KDV oran sapmasını işaretler', () => {
    const warnings = validateDocument(normalizeExtraction(tutarsizModel), now);
    expect(warnings.some((warning) => warning.field === 'vknTckn')).toBe(true);
    expect(warnings.some((warning) => warning.field === 'kdv:0')).toBe(true);
    expect(warnings.some((warning) => warning.field === 'toplam' && warning.level === 'hata')).toBe(true);
  });

  it('eski oranı hazır sütuna gizlemez', () => {
    const warnings = validateDocument(normalizeExtraction(eskiOranModel), now);
    expect(warnings.some((warning) => warning.message.includes('%18'))).toBe(true);
  });
});
