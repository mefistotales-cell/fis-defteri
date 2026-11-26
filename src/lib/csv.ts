import { formatDot } from './money.ts';

const CP1254: Record<string, number> = {
  '€': 0x80,
  Ğ: 0xd0,
  İ: 0xdd,
  Ş: 0xde,
  ğ: 0xf0,
  ı: 0xfd,
  ş: 0xfe,
};

/** Luca fatura aktarımının istediği Windows-1254 CSV. Ondalık ayracı noktadır. */
export function encodeWindows1254(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const ch of text) {
    const mapped = CP1254[ch];
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }
    const code = ch.codePointAt(0) ?? 0x3f;
    bytes.push(code >= 0 && code <= 0xff ? code : 0x3f);
  }
  return Uint8Array.from(bytes);
}

export function toCsv(rows: (string | number)[][], separator: ',' | ';'): string {
  return `${rows.map((row) => row.map((cell) => csvCell(cell, separator)).join(separator)).join('\r\n')}\r\n`;
}

function csvCell(cell: string | number, separator: string): string {
  const value = typeof cell === 'number' ? formatDot(cell) : cell;
  if (value.includes('"') || value.includes(separator) || /[\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvBlob(rows: (string | number)[][], separator: ',' | ';'): Blob {
  const bytes = encodeWindows1254(toCsv(rows, separator));
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: 'text/csv' });
}
