import { normalizeExtraction, parseModelJson } from './normalize.ts';
import { EXTRACTION_PROMPT } from './prompt.ts';
import { resolvedBaseUrl, resolvedModel } from './settings.ts';
import type { AppSettings, DocumentFields } from './types.ts';

export class VisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionError';
  }
}

export const GEMINI_RETRY_DELAYS_MS = [1000, 2000, 4000];

export function visionFailure(status: number, body: string): string {
  if (status === 401 || status === 403) return 'API anahtarı kabul edilmedi. Ayarlardan kontrol edin.';
  if (status === 429) return 'Kota veya hız sınırı doldu. Biraz bekleyip yeniden deneyin.';
  if (status === 404) return 'Model bulunamadı. Ayarlardaki model adını kontrol edin.';
  if (status === 503) {
    return 'Gemini şu an yoğun (503). Biraz sonra yeniden deneyin veya Ayarlar’da modeli gemini-flash-lite-latest yapın.';
  }
  const detail = body.replace(/\s+/g, ' ').trim().slice(0, 180);
  return detail ? `Okuma servisi ${status} döndü. ${detail}` : `Okuma servisi ${status} döndü.`;
}

export async function requestWith503Retry(
  run: () => Promise<Response>,
  sleep: (ms: number) => Promise<void> = delay,
): Promise<Response> {
  let response: Response | null = null;
  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
    response = await run();
    if (response.status !== 503 || attempt === GEMINI_RETRY_DELAYS_MS.length) return response;
    await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
  }
  return response ?? new Response('', { status: 503 });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function extractFromImage(settings: AppSettings, image: Blob): Promise<DocumentFields> {
  const key = settings.apiKey.trim();
  if (!key) throw new VisionError('API anahtarı yok. Ayarlar’dan kendi anahtarınızı girin.');
  const model = resolvedModel(settings);
  if (!model) throw new VisionError('Model adı boş.');
  const base64 = await blobToBase64(image);
  const text =
    settings.provider === 'gemini'
      ? await gemini(model, key, base64)
      : await openAiCompatible(settings, model, key, base64);
  try {
    return normalizeExtraction(parseModelJson(text));
  } catch {
    throw new VisionError('Modelin yanıtı okunamadı. Yeniden deneyin.');
  }
}

export async function testApiKey(settings: AppSettings): Promise<void> {
  const key = settings.apiKey.trim();
  if (!key) throw new VisionError('Önce API anahtarını yazın.');
  const model = resolvedModel(settings);
  if (settings.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await requestWith503Retry(() =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Yanıt olarak yalnızca TAMAM yaz.' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 20 },
        }),
        signal: AbortSignal.timeout(45000),
      }),
    );
    if (!response.ok) throw new VisionError(visionFailure(response.status, await response.text()));
    return;
  }
  const base = resolvedBaseUrl(settings).replace(/\/$/, '');
  if (!base) throw new VisionError('API adresi boş.');
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: openAiHeaders(settings, key),
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Yanıt olarak yalnızca TAMAM yaz.' }],
    }),
  });
  if (!response.ok) throw new VisionError(visionFailure(response.status, await response.text()));
}

async function gemini(model: string, key: string, base64: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  let response: Response;
  try {
    response = await requestWith503Retry(() =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: EXTRACTION_PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }],
            },
          ],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(45000),
      }),
    );
  } catch {
    throw new VisionError('Gemini’ye bağlanılamadı. İnterneti kontrol edin.');
  }
  if (!response.ok) throw new VisionError(visionFailure(response.status, await response.text()));
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  if (!text.trim()) throw new VisionError('Gemini boş yanıt verdi.');
  return text;
}

async function openAiCompatible(settings: AppSettings, model: string, key: string, base64: string): Promise<string> {
  const base = resolvedBaseUrl(settings).replace(/\/$/, '');
  if (!base) throw new VisionError('API adresi boş.');
  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: openAiHeaders(settings, key),
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new VisionError('Okuma servisine bağlanılamadı. Adres, anahtar ve interneti kontrol edin.');
  }
  if (!response.ok) throw new VisionError(visionFailure(response.status, await response.text()));
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new VisionError('Model boş yanıt verdi.');
  return text;
}

function openAiHeaders(settings: AppSettings, key: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = typeof location === 'undefined' ? 'https://fis-defteri.local' : location.origin;
    headers['X-Title'] = 'Fis Defteri';
  }
  return headers;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new VisionError('Fotoğraf okunamadı.'));
    reader.readAsDataURL(blob);
  });
}
