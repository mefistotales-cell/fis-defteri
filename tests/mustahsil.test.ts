import { describe, expect, it } from 'vitest';
import { classifyYon, sinifOzeti } from '../src/lib/classify.ts';
import { buildJournal, journalBalances } from '../src/lib/journal.ts';
import { buildMustahsilSheet } from '../src/lib/rows.ts';
import { normalizeExtraction } from '../src/lib/normalize.ts';
import { defaultSettings } from '../src/lib/settings.ts';
import { validateDocument } from '../src/lib/validate.ts';
import { emptyFields } from '../src/lib/types.ts';
import type { DocumentFields } from '../src/lib/types.ts';

const settings = defaultSettings();
const now = new Date('2026-11-26T12:00:00');

function makbuz(partial: Partial<DocumentFields> = {}): DocumentFields {
  return {
    ...emptyFields(),
    belgeTuru: 'mustahsil',
    tarih: '2026-09-12',
    saticiUnvan: 'Ayşe Yılmaz',
    vknTckn: '10000000146',
    belgeNo: 'MM-18',
    urunCinsi: 'Pamuk',
    miktar: 2,
    birim: 'ton',
    birimFiyat: 500,
    brutTutar: 1000,
    stopajOran: 4,
    stopajTutar: 40,
    borsaTescil: 10,
    sgkKesinti: 50,
    meraFonu: 0,
    netOdenen: 900,
    toplam: 900,
    odemeSekli: 'nakit',
    ...partial,
  };
}

describe('müstahsil makbuzu', () => {
  it('alış sayılır ve listede kendi türüyle görünür', () => {
    const fields = makbuz({ saticiUnvan: 'Haskara Tarım' });
    expect(classifyYon(fields, { unvan: 'Haskara Tarım', vkn: '1111111111' })).toBe('alis');
    expect(sinifOzeti(fields)).toBe('Müstahsil');
  });

  it('brüt eksi kesintiler nete eşit değilse uyarır', () => {
    const ok = validateDocument(makbuz(), now);
    expect(ok.some((warning) => warning.field === 'netOdenen')).toBe(false);
    const bad = validateDocument(makbuz({ netOdenen: 800, toplam: 800 }), now);
    expect(bad.some((warning) => warning.level === 'hata' && warning.message.includes('100,00'))).toBe(true);
  });

  it('fişi 153, 360, 361 ve kasaya dengeler', () => {
    const lines = buildJournal(makbuz(), settings.hesaplar).lines;
    expect(journalBalances(lines)).toBe(true);
    expect(lines.map((line) => [line.hesapKodu, line.borc, line.alacak])).toEqual([
      ['153', 1000, 0],
      ['360', 0, 40],
      ['360', 0, 10],
      ['361', 0, 50],
      ['100', 0, 900],
    ]);
  });

  it('Logo tipi 26 ve makbuz sayfası ayrıdır', () => {
    expect(settings.hesaplar.mustahsilLogoTip).toBe(26);
    const sheet = buildMustahsilSheet(
      [{ id: 'mm', createdAt: '2026-09-12T00:00:00.000Z', fields: makbuz({ odemeSekli: 'acik' }) }],
      settings,
    );
    expect(sheet.name).toBe('Mustahsil');
    expect(sheet.rows[1]?.[1]).toBe('MM-18');
    expect(sheet.rows[1]?.[4]).toBe('Pamuk');
    expect(sheet.rows[1]?.[19]).toBe('320');
    expect(sheet.rows[1]?.[20]).toBe(26);
  });

  it('okunan e-müstahsil alanlarını doldurur', () => {
    const fields = normalizeExtraction({
      belgeTuru: 'e-müstahsil',
      tarih: '12.09.2026',
      uretici: 'Ayşe Yılmaz',
      tckn: '10000000146',
      makbuzNo: 'MM-18',
      urunCinsi: 'Pamuk',
      miktar: '2',
      birim: 'ton',
      birimFiyat: '500,00',
      brut: '1.000,00',
      stopajOran: 4,
      stopaj: '40,00',
      borsaTescil: 10,
      bagkur: 50,
      netOdenen: 900,
      odemeSekli: 'nakit',
    });
    expect(fields.belgeTuru).toBe('mustahsil');
    expect(fields.yon).toBe('alis');
    expect(fields.saticiUnvan).toBe('Ayşe Yılmaz');
    expect(fields.vknTckn).toBe('10000000146');
    expect(fields.belgeNo).toBe('MM-18');
    expect(fields.brutTutar).toBe(1000);
    expect(fields.stopajTutar).toBe(40);
    expect(fields.sgkKesinti).toBe(50);
    expect(fields.toplam).toBe(900);
  });
});
