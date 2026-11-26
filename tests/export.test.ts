import exceljs from 'exceljs';
import { describe, expect, it } from 'vitest';
import { enabledColumns, LUCA_FATURA_COLUMN_LIMIT } from '../src/lib/columns.ts';
import { encodeWindows1254 } from '../src/lib/csv.ts';
import { exportLucaFatura, exportOzet, fileName } from '../src/lib/exportFiles.ts';
import { buildJournal, journalBalances } from '../src/lib/journal.ts';
import { buildLogoFis, buildLucaFatura, buildLucaFis } from '../src/lib/rows.ts';
import { SAMPLES } from '../src/lib/samples.ts';
import { defaultSettings } from '../src/lib/settings.ts';
import { normalizeExtraction } from '../src/lib/normalize.ts';
import { toKurus } from '../src/lib/money.ts';
import type { ExportDoc } from '../src/lib/types.ts';
import { eskiOranModel } from './fixtures/model-responses.ts';

const settings = defaultSettings();
const docs: ExportDoc[] = SAMPLES.map((sample) => ({
  id: sample.id,
  createdAt: sample.createdAt,
  fields: sample.fields,
}));

describe('Excel satırları', () => {
  it('Luca fatura listesini 15 sütun ve güncel KDV oranlarıyla kurar', () => {
    expect(enabledColumns(settings.sutunlar.lucaFatura)).toHaveLength(LUCA_FATURA_COLUMN_LIMIT);
    const sheet = buildLucaFatura(docs, settings);
    expect(sheet.rows[0]).toEqual([
      'Evrak Tarihi',
      'Evrak No',
      'VKN/TCKN',
      'Unvan',
      'Açıklama',
      'Matrah %0',
      'Matrah %1',
      'Matrah %10',
      'Matrah %20',
      'KDV %1',
      'KDV %10',
      'KDV %20',
      'Toplam',
      'Tevkifat KDV',
      'Karşı Hesap',
    ]);
    const fis = sheet.rows[1];
    expect(fis[0]).toBe('04.11.2026');
    expect(fis[1]).toBe('004218');
    expect(fis[2]).toBe('6123456784');
    expect(String(fis[4])).toContain('NAKIT');
    expect(String(fis[4])).toContain('Z:118');
    expect(fis[11]).toBe(200);
    expect(fis[12]).toBe(1200);
    expect(fis[14]).toBe('770');
    const fatura = sheet.rows[2];
    expect(fatura[0]).toBe('18.11.2026');
    expect(fatura[6]).toBe(500);
    expect(fatura[7]).toBe(250);
    expect(fatura[9]).toBe(5);
    expect(fatura[10]).toBe(25);
    expect(fatura[12]).toBe(782);
    expect(String(fatura[4])).toContain('KONTROL');
  });

  it('sütun başlığı değişince ve kapanınca dosyaya yansır', () => {
    const custom = defaultSettings();
    const tarih = custom.sutunlar.lucaFatura.find((column) => column.key === 'evrakTarihi');
    const tevkifat = custom.sutunlar.lucaFatura.find((column) => column.key === 'tevkifat');
    if (!tarih || !tevkifat) throw new Error('sütun yok');
    tarih.header = 'TARIH';
    tevkifat.enabled = false;
    const sheet = buildLucaFatura(docs, custom);
    expect(sheet.rows[0][0]).toBe('TARIH');
    expect(sheet.rows[0]).not.toContain('Tevkifat KDV');
    expect(sheet.rows[0]).toHaveLength(14);
  });

  it('Luca fişini dengeler ve nakit tahsilatı kasaya yazar', () => {
    const sheet = buildLucaFis(docs, settings);
    expect(sheet.rows[0].slice(0, 3)).toEqual(['Fiş No', 'Fiş Tarihi', 'Hesap Kodu']);
    expect(sheet.rows[0]).toContain('Borç');
    expect(sheet.rows[0]).toContain('Alacak');
    const fisLines = sheet.rows.filter((row) => row[0] === '1');
    expect(fisLines.map((row) => row[2])).toEqual(['770', '191.20', '100']);
    expect(sumColumn(fisLines, borcIndex(sheet.rows[0]))).toBe(120000);
    expect(sumColumn(fisLines, alacakIndex(sheet.rows[0]))).toBe(120000);
    const faturaLines = sheet.rows.filter((row) => row[0] === '2');
    expect(faturaLines.some((row) => String(row[5]).includes('FARK'))).toBe(true);
    expect(sumColumn(faturaLines, borcIndex(sheet.rows[0]))).toBe(sumColumn(faturaLines, alacakIndex(sheet.rows[0])));
  });

  it('eski %18 tutarını %20 sütununa koymaz, fişte 191.18 kullanır', () => {
    const doc: ExportDoc = {
      id: 'eski',
      createdAt: '2022-06-01T00:00:00.000Z',
      fields: normalizeExtraction(eskiOranModel),
    };
    const fatura = buildLucaFatura([doc], settings);
    const row = fatura.rows[1];
    expect(row[8]).toBe(0);
    expect(row[11]).toBe(0);
    expect(String(row[4])).toContain('%18');
    const fis = buildLucaFis([doc], settings);
    expect(fis.rows.some((line) => line[2] === '191.18')).toBe(true);
    expect(journalBalances(buildJournal(doc.fields, settings.hesaplar).lines)).toBe(true);
  });

  it('Logo fişinde borç ve alacak sıfır dahil sayıdır', () => {
    const sheet = buildLogoFis(docs, settings);
    const line = sheet.rows[1];
    expect(typeof line[5]).toBe('number');
    expect(typeof line[6]).toBe('number');
    expect(line[5] === 0 || line[6] === 0).toBe(true);
  });
});

describe('dosya', () => {
  it('Luca CSV’sini Windows-1254 ve noktalı ondalıkla yazar, satır sınırında böler', async () => {
    const files = await exportLucaFatura(docs, settings, '2026-11', 1);
    const csvFiles = files.filter((file) => file.filename.endsWith('.csv'));
    expect(csvFiles.map((file) => file.filename)).toEqual([
      'Haskara-Luca-Fatura-2026-11-1.csv',
      'Haskara-Luca-Fatura-2026-11-2.csv',
    ]);
    const bytes = new Uint8Array(await csvFiles[0].blob.arrayBuffer());
    const decoded = decode1254(bytes);
    expect(decoded).toContain('1000.00');
    expect(decoded).toContain('1200.00');
    expect(decoded).not.toContain('1.200,00');
    expect(bytes).toContain(0xde);
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(await files[0].blob.arrayBuffer());
    const worksheet = workbook.getWorksheet('Fatura');
    expect(worksheet?.getCell('A1').value).toBe('Evrak Tarihi');
    expect(worksheet?.getCell('M2').value).toBe(1200);
  });

  it('muhasebeci özetinde Z no ve uyarı vardır', async () => {
    const [file] = await exportOzet(docs, settings, '2026-11');
    expect(file.filename).toBe('Haskara-Muhasebeci-Ozet-2026-11.xlsx');
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(await file.blob.arrayBuffer());
    const belgeler = workbook.getWorksheet('Belgeler');
    const header = belgeler?.getRow(1).values;
    expect(header).toEqual(expect.arrayContaining(['Z No', 'EKÜ No', 'Uyarılar']));
    const text = JSON.stringify(belgeler?.getSheetValues());
    expect(text).toContain('118');
    expect(text).toContain('0003');
    expect(text).toContain('2,00');
    expect(workbook.getWorksheet('Toplamlar')?.getCell('A2').value).toBe('Belge sayısı');
    expect(workbook.getWorksheet('Okuma')).toBeTruthy();
  });

  it('dosya adındaki ay ve parçayı yazar', () => {
    expect(fileName('Haskara', 'Luca-Fis', '2026-11', 'xlsx')).toBe('Haskara-Luca-Fis-2026-11.xlsx');
    expect(fileName('Ha/ska', 'Logo-Fis', '2026-11', 'xlsx', 2, 2)).toBe('Haska-Logo-Fis-2026-11-2.xlsx');
  });
});

function borcIndex(header: (string | number)[]): number {
  return header.indexOf('Borç');
}

function alacakIndex(header: (string | number)[]): number {
  return header.indexOf('Alacak');
}

function sumColumn(rows: (string | number)[][], index: number): number {
  return rows.reduce((sum, row) => sum + toKurus(Number(row[index])), 0);
}

function decode1254(bytes: Uint8Array): string {
  const map: Record<number, string> = { 0xd0: 'Ğ', 0xdd: 'İ', 0xde: 'Ş', 0xf0: 'ğ', 0xfd: 'ı', 0xfe: 'ş' };
  let out = '';
  for (const byte of bytes) out += map[byte] ?? String.fromCharCode(byte);
  return out;
}

describe('kod sayfası', () => {
  it('Türkçe harfleri Windows-1254 baytına çevirir', () => {
    const bytes = encodeWindows1254('ÇĞİÖŞÜ çğıöşü ı');
    expect(bytes[1]).toBe(0xd0);
    expect(bytes[2]).toBe(0xdd);
    expect(bytes[4]).toBe(0xde);
    expect([...bytes]).toContain(0xfd);
  });
});
