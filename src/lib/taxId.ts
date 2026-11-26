export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** 10 haneli vergi kimlik numarası kontrol basamağı. */
export function isValidVkn(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  let total = 0;
  for (let i = 0; i < 9; i += 1) {
    const tmp = (Number(value[i]) + (9 - i)) % 10;
    let val = (tmp * 2 ** (9 - i)) % 9;
    if (tmp !== 0 && val === 0) val = 9;
    total += val;
  }
  const check = (10 - (total % 10)) % 10;
  return check === Number(value[9]);
}

/** 11 haneli T.C. kimlik numarası kontrol basamağı. */
export function isValidTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = value.split('').map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = (d.slice(0, 10).reduce((sum, n) => sum + n, 0)) % 10;
  return d10 === d[9] && d11 === d[10];
}
