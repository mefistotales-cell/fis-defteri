/** Türk fişlerindeki 1.234,56 biçimini ve modelin döndürdüğü 1234.56 biçimini sayıya çevirir. */
export function parseTurkishNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;

  let s = input.trim().replace(/[\s\u00a0\u202f]/g, '').replace(/[₺*]/g, '');
  s = s.replace(/tl|try/gi, '').replace(/%/g, '');
  if (!s) return null;

  let neg = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    neg = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-') || s.startsWith('−')) {
    neg = true;
    s = s.slice(1);
  }
  if (s.endsWith('-')) {
    neg = true;
    s = s.slice(0, -1);
  }
  if (!s) return null;

  const comma = s.lastIndexOf(',');
  const dot = s.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (comma >= 0) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    s = `${parts[0].replace(/\./g, '')}.${parts[1]}`;
  } else if (dot >= 0) {
    const parts = s.split('.');
    if (parts.length > 2) {
      s = parts.join('');
    } else if (parts[1].length === 3) {
      s = parts.join('');
    }
  }

  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function toKurus(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  const [whole, frac = '00'] = Math.abs(n).toFixed(2).split('.');
  return sign * (Number(whole) * 100 + Number(frac));
}

export function fromKurus(k: number): number {
  const sign = k < 0 ? -1 : 1;
  const abs = Math.abs(Math.trunc(k));
  const whole = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return sign * Number(`${whole}.${frac}`);
}

export function formatTr(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(toKurus(n));
  const whole = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped},${frac}`;
}

export function formatDot(n: number): string {
  return fromKurus(toKurus(n)).toFixed(2);
}
