import { LUCA_FATURA_COLUMN_LIMIT, LUCA_FIS_DOC_LIMIT, LUCA_LINE_LIMIT } from './columns.ts';
import { csvBlob } from './csv.ts';
import {
  buildLogoAlim,
  buildLogoFis,
  buildLucaFatura,
  buildLucaFis,
  buildOzet,
  buildReadmeSheet,
  buildTotals,
  sortDocs,
} from './rows.ts';
import type { TableSheet } from './rows.ts';
import type { AppSettings, ExportDoc } from './types.ts';
import { sheetsToBlob } from './workbook.ts';

export interface DownloadFile {
  filename: string;
  blob: Blob;
  note?: string;
}

export async function exportLucaFatura(
  docs: ExportDoc[],
  settings: AppSettings,
  month: string,
  maxRows = LUCA_LINE_LIMIT,
): Promise<DownloadFile[]> {
  return paired(sortDocs(docs), settings, month, 'Luca-Fatura', maxRows, (part) => buildLucaFatura(part, settings));
}

export async function exportLucaFis(docs: ExportDoc[], settings: AppSettings, month: string): Promise<DownloadFile[]> {
  const groups = chunkDocs(sortDocs(docs), LUCA_FIS_DOC_LIMIT, LUCA_LINE_LIMIT, (part) => buildLucaFis(part, settings).rows.length - 1);
  const files: DownloadFile[] = [];
  for (let index = 0; index < groups.length; index += 1) {
    const sheet = buildLucaFis(groups[index], settings);
    files.push({
      filename: fileName(settings.dosyaOneki, 'Luca-Fis', month, 'xlsx', index + 1, groups.length),
      blob: await sheetsToBlob([sheet]),
      note: sheet.skipped.length ? `Tutarı olmayan belgeler yazılmadı: ${sheet.skipped.join(', ')}` : undefined,
    });
  }
  return files;
}

export async function exportLogoAlim(docs: ExportDoc[], settings: AppSettings, month: string): Promise<DownloadFile[]> {
  const sheet = buildLogoAlim(sortDocs(docs), settings);
  return [{ filename: fileName(settings.dosyaOneki, 'Logo-Alim', month, 'xlsx'), blob: await sheetsToBlob([sheet]) }];
}

export async function exportLogoFis(docs: ExportDoc[], settings: AppSettings, month: string): Promise<DownloadFile[]> {
  const sheet = buildLogoFis(sortDocs(docs), settings);
  return [
    {
      filename: fileName(settings.dosyaOneki, 'Logo-Fis', month, 'xlsx'),
      blob: await sheetsToBlob([sheet]),
      note: sheet.skipped.length ? `Tutarı olmayan belgeler yazılmadı: ${sheet.skipped.join(', ')}` : undefined,
    },
  ];
}

export async function exportOzet(docs: ExportDoc[], settings: AppSettings, month: string): Promise<DownloadFile[]> {
  const sorted = sortDocs(docs);
  const blob = await sheetsToBlob([buildOzet(sorted, settings), buildTotals(sorted), buildReadmeSheet(settings)]);
  return [{ filename: fileName(settings.dosyaOneki, 'Muhasebeci-Ozet', month, 'xlsx'), blob }];
}

async function paired(
  docs: ExportDoc[],
  settings: AppSettings,
  month: string,
  label: string,
  maxRows: number,
  build: (part: ExportDoc[]) => TableSheet,
): Promise<DownloadFile[]> {
  const groups = chunkDocs(docs, maxRows, maxRows, () => 1);
  const files: DownloadFile[] = [];
  for (let index = 0; index < groups.length; index += 1) {
    const sheet = build(groups[index]);
    const part = index + 1;
    const parts = groups.length;
    const xlsxName = fileName(settings.dosyaOneki, label, month, 'xlsx', part, parts);
    const csvName = fileName(settings.dosyaOneki, label, month, 'csv', part, parts);
    files.push({ filename: xlsxName, blob: await sheetsToBlob([sheet]) });
    files.push({
      filename: csvName,
      blob: csvBlob(sheet.rows, settings.csvAyrac),
      note:
        enabledCount(settings) > LUCA_FATURA_COLUMN_LIMIT
          ? `Luca en fazla ${LUCA_FATURA_COLUMN_LIMIT} sütun alır. Şu an daha fazlası açık.`
          : undefined,
    });
  }
  return files;
}

function enabledCount(settings: AppSettings): number {
  return settings.sutunlar.lucaFatura.filter((column) => column.enabled).length;
}

function chunkDocs(docs: ExportDoc[], maxDocs: number, maxLines: number, linesOf: (part: ExportDoc[]) => number): ExportDoc[][] {
  if (docs.length === 0) return [[]];
  const groups: ExportDoc[][] = [];
  let current: ExportDoc[] = [];
  for (const doc of docs) {
    const next = current.concat(doc);
    const tooManyDocs = current.length >= maxDocs;
    const tooManyLines = current.length > 0 && linesOf(next) > maxLines;
    if (tooManyDocs || tooManyLines) {
      groups.push(current);
      current = [doc];
    } else {
      current = next;
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

export function fileName(prefix: string, label: string, month: string, ext: string, part = 1, parts = 1): string {
  const safe = prefix.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Haskara';
  const suffix = parts > 1 ? `-${part}` : '';
  return `${safe}-${label}-${month}${suffix}.${ext}`;
}
