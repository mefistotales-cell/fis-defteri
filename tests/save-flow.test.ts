import { describe, expect, it } from 'vitest';
import { saveErrorMessage } from '../src/lib/db.ts';
import { documentMonth, listMonthAfterSave, saveSuccessMessage } from '../src/lib/dates.ts';
import { defaultSettings, mergeSettings } from '../src/lib/settings.ts';
import { GEMINI_RETRY_DELAYS_MS, requestWith503Retry, visionFailure } from '../src/lib/vision.ts';

describe('kayıt ayı', () => {
  it('başka aydaki fişi o ayın listesine alır', () => {
    expect(documentMonth('2026-08-15', '2026-11-26T10:00:00.000Z')).toBe('2026-08');
    expect(listMonthAfterSave('2026-11', '2026-08-15', '2026-11-26T10:00:00.000Z')).toBe('2026-08');
    expect(saveSuccessMessage('2026-11', '2026-08-15', '2026-11-26T10:00:00.000Z')).toEqual({
      month: '2026-08',
      text: 'Kaydedildi. Ağustos 2026 listesine alındı.',
    });
  });

  it('aynı aydaki fişte ay değiştirmez', () => {
    expect(saveSuccessMessage('2026-11', '2026-11-04', '2026-11-26T10:00:00.000Z')).toEqual({
      month: '2026-11',
      text: 'Kaydedildi.',
    });
  });

  it('tarih yoksa kayıt zamanının ayını kullanır', () => {
    expect(listMonthAfterSave('2026-10', '', '2026-11-26T10:00:00.000Z')).toBe('2026-11');
  });
});

describe('kayıt hatası', () => {
  it('dolu depoyu Türkçe söyler', () => {
    const error = new DOMException('quota', 'QuotaExceededError');
    expect(saveErrorMessage(error)).toMatch(/sığmadı/);
  });

  it('diğer saklama hatalarında gizli sekmeyi söyler', () => {
    expect(saveErrorMessage(new Error('IDBDatabase'))).toMatch(/Gizli sekme/);
  });
});

describe('Gemini modeli', () => {
  it('varsayılan model gemini-flash-latest olur', () => {
    expect(defaultSettings().model).toBe('gemini-flash-latest');
  });

  it('kayıtlı gemini-2.5-flash değerini çalışan modele çevirir', () => {
    const settings = mergeSettings({ provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'anahtar' });
    expect(settings.model).toBe('gemini-flash-latest');
    expect(settings.apiKey).toBe('anahtar');
  });

  it('elle seçilmiş başka modeli olduğu gibi bırakır', () => {
    expect(mergeSettings({ provider: 'openai', model: 'gpt-4o' }).model).toBe('gpt-4o');
  });
});

describe('Gemini 503', () => {
  it('503 sonrası bekleyip yeniden dener', async () => {
    const sleeps: number[] = [];
    let calls = 0;
    const response = await requestWith503Retry(async () => {
      calls += 1;
      return new Response('busy', { status: calls < 3 ? 503 : 200 });
    }, async (ms) => {
      sleeps.push(ms);
    });
    expect(calls).toBe(3);
    expect(sleeps).toEqual(GEMINI_RETRY_DELAYS_MS.slice(0, 2));
    expect(response.status).toBe(200);
  });

  it('sürekli 503 olursa lite modeli önerir', async () => {
    const response = await requestWith503Retry(async () => new Response('no', { status: 503 }), async () => undefined);
    expect(response.status).toBe(503);
    expect(visionFailure(503, '')).toContain('gemini-flash-lite-latest');
  });
});
