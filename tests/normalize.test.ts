import { describe, expect, it } from 'vitest';
import { normalizeExtraction, parseModelJson } from '../src/lib/normalize.ts';
import { eskiOranModel, fisModel, tutarsizModel, wrappedModel } from './fixtures/model-responses.ts';

describe('model yanıtı', () => {
  it('fiş JSON’undaki Türkçe tutarları ve türü düzeltir', () => {
    const fields = normalizeExtraction(fisModel);
    expect(fields.belgeTuru).toBe('fis');
    expect(fields.tarih).toBe('2026-11-04');
    expect(fields.saat).toBe('14:32');
    expect(fields.vknTckn).toBe('6123456784');
    expect(fields.belgeNo).toBe('004218');
    expect(fields.zNo).toBe('118');
    expect(fields.kdvSatirlari).toEqual([{ oran: 20, matrah: 1000, kdv: 200, tur: 'mal', aciklama: '' }]);
    expect(fields.yon).toBe('alis');
    expect(fields.toplam).toBe(1200);
    expect(fields.odemeSekli).toBe('nakit');
    expect(fields.guven.toplam).toBe('yuksek');
    expect(fields.guven.vknTckn).toBe('dusuk');
  });

  it('markdown içindeki faturayı ve oran sözlüğünü okur', () => {
    const fields = normalizeExtraction(parseModelJson(wrappedModel));
    expect(fields.belgeTuru).toBe('fatura');
    expect(fields.odemeSekli).toBe('acik');
    expect(fields.kdvSatirlari).toEqual([
      { oran: 1, matrah: 500, kdv: 5, tur: 'mal', aciklama: '' },
      { oran: 10, matrah: 250, kdv: 25, tur: 'mal', aciklama: '' },
    ]);
    expect(fields.toplam).toBe(782);
  });

  it('eski %18 oranını %20 sanmaz', () => {
    const fields = normalizeExtraction(eskiOranModel);
    expect(fields.kdvSatirlari[0]?.oran).toBe(18);
  });

  it('bozuk JSON’da hata verir', () => {
    expect(() => parseModelJson('fiş okunamadı')).toThrow(/JSON/);
  });

  it('tutarsız modeli alanlara indirger', () => {
    const fields = normalizeExtraction(tutarsizModel);
    expect(fields.odemeSekli).toBe('kart');
    expect(fields.vknTckn).toBe('111');
  });
});
