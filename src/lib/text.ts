/** Excel formül enjeksiyonunu ve satır sonlarını temizler. */
export function cleanText(value: string, max = 240): string {
  const flat = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const safe = /^[=+\-@]/.test(flat) ? `'${flat}` : flat;
  return safe.length > max ? safe.slice(0, max).trim() : safe;
}
