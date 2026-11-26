export function toIsoDate(input: unknown): string {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof input !== 'string') return '';
  const s = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return validYmd(iso[1], iso[2], iso[3]);
  const tr = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(s);
  if (tr) return validYmd(tr[3], tr[2].padStart(2, '0'), tr[1].padStart(2, '0'));
  return '';
}

function validYmd(y: string, m: string, d: string): string {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function toTrDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function toTime(input: unknown): string {
  if (typeof input !== 'string') return '';
  const m = /^(\d{1,2})[:.](\d{2})/.exec(input.trim());
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentMonth(now = new Date()): string {
  return todayIso(now).slice(0, 7);
}

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

export function formatMonthLabel(month: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month;
  const index = Number(m[2]) - 1;
  return `${MONTHS[index] ?? m[2]} ${m[1]}`;
}

export function shiftMonth(month: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return currentMonth();
  const date = new Date(Number(m[1]), Number(m[2]) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function documentMonth(tarih: string, createdAt: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return tarih.slice(0, 7);
  if (/^\d{4}-\d{2}/.test(createdAt)) return createdAt.slice(0, 7);
  return currentMonth();
}
