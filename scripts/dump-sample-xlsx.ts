import { mkdirSync, writeFileSync } from 'node:fs';
import { exportLucaFatura, exportOzet } from '../src/lib/exportFiles.ts';
import { SAMPLES } from '../src/lib/samples.ts';
import { defaultSettings } from '../src/lib/settings.ts';
import type { ExportDoc } from '../src/lib/types.ts';

const docs: ExportDoc[] = SAMPLES.map((sample) => ({
  id: sample.id,
  createdAt: sample.createdAt,
  fields: sample.fields,
}));
const settings = defaultSettings();
const luca = await exportLucaFatura(docs, settings, '2026-11');
const ozet = await exportOzet(docs, settings, '2026-11');
mkdirSync('/tmp/exports', { recursive: true });
for (const file of [...luca, ...ozet]) {
  const bytes = Buffer.from(await file.blob.arrayBuffer());
  writeFileSync(`/tmp/exports/${file.filename}`, bytes);
  console.log(file.filename, bytes.length);
}
