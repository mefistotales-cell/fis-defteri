import { describe, expect, it } from 'vitest';
import { formatDot, formatTr, parseTurkishNumber, toKurus } from '../src/lib/money.ts';
import { isValidTckn, isValidVkn } from '../src/lib/taxId.ts';

describe('Türk sayı biçimi', () => {
  it('fişteki binlik noktayı ve ondalık virgülü okur', () => {
    expect(parseTurkishNumber('1.234,56')).toBe(1234.56);
    expect(parseTurkishNumber('1.234,5')).toBe(1234.5);
    expect(parseTurkishNumber('₺ 1.200,00')).toBe(1200);
    expect(parseTurkishNumber('*1.200,00')).toBe(1200);
    expect(parseTurkishNumber('1.234.567,89')).toBe(1234567.89);
    expect(parseTurkishNumber('1.234')).toBe(1234);
    expect(parseTurkishNumber('12.500')).toBe(12500);
  });

  it('modelin noktalı ondalığını ve düz sayıyı da okur', () => {
    expect(parseTurkishNumber(1234.56)).toBe(1234.56);
    expect(parseTurkishNumber('1234,56')).toBe(1234.56);
    expect(parseTurkishNumber('12.50')).toBe(12.5);
    expect(parseTurkishNumber('12.5')).toBe(12.5);
    expect(parseTurkishNumber('0,08')).toBe(0.08);
    expect(parseTurkishNumber('1,234.56')).toBe(1234.56);
    expect(parseTurkishNumber('20%')).toBe(20);
    expect(parseTurkishNumber('')).toBeNull();
    expect(parseTurkishNumber('yok')).toBeNull();
    expect(parseTurkishNumber('-15,50')).toBe(-15.5);
  });

  it('geri yazınca Türkçe ve Luca CSV biçimini korur', () => {
    expect(formatTr(1234.56)).toBe('1.234,56');
    expect(formatTr(1200)).toBe('1.200,00');
    expect(formatDot(1234.5)).toBe('1234.50');
    expect(toKurus(10.29)).toBe(1029);
  });
});

describe('VKN ve TCKN', () => {
  it('kontrol basamağını doğrular', () => {
    expect(isValidVkn('6123456784')).toBe(true);
    expect(isValidVkn('8450123492')).toBe(true);
    expect(isValidVkn('6123456780')).toBe(false);
    expect(isValidTckn('10000000146')).toBe(true);
    expect(isValidTckn('10000000140')).toBe(false);
  });
});
