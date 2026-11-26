import exceljs from 'exceljs';
import type { TableSheet } from './rows.ts';

const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function sheetsToBlob(sheets: TableSheet[]): Promise<Blob> {
  const workbook = new exceljs.Workbook();
  workbook.creator = 'Fiş Defteri';
  workbook.created = new Date();
  for (const sheet of sheets) addSheet(workbook, sheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([toArrayBuffer(buffer)], { type: MIME });
}

function addSheet(workbook: exceljs.Workbook, sheet: TableSheet): void {
  const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31) || 'Sayfa');
  for (const row of sheet.rows) worksheet.addRow(row);
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFF4EFE4' }, size: 12 };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF24301F' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 22;

  sheet.rows[0]?.forEach((title, index) => {
    const column = worksheet.getColumn(index + 1);
    const kind = sheet.kinds[index] ?? 'text';
    const titleText = String(title);
    let columnWidth = Math.max(kind === 'money' || kind === 'int' ? 14 : 16, titleText.length + 2);
    if (/açıklama|uyarı|unvan|satıcı|cari/i.test(titleText)) columnWidth = 36;
    column.width = Math.min(42, columnWidth);
    if (kind === 'money') column.numFmt = '#,##0.00';
    if (kind === 'int') column.numFmt = '0';
  });

  worksheet.pageSetup = { orientation: 'landscape', paperSize: 9 };
  const width = sheet.rows[0]?.length ?? 1;
  if (width > 0 && sheet.rows.length > 1) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: width },
    };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  } else if (sheet.name === 'Okuma') {
    worksheet.getColumn(1).width = 110;
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rowNumber % 2 === 0 && sheet.name !== 'Okuma') {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F3EA' } };
    }
    sheet.kinds.forEach((kind, index) => {
      const cell = row.getCell(index + 1);
      if (typeof cell.value === 'number') {
        cell.numFmt = kind === 'int' ? '0' : kind === 'money' ? '#,##0.00' : cell.numFmt;
      }
    });
  });
}

function toArrayBuffer(buffer: ArrayBuffer | Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(copy);
  view.set(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
  return copy;
}
