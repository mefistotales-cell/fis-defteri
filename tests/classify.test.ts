import { describe, expect, it } from 'vitest';
import { matrahAccount, logoTipFor } from '../src/lib/accounts.ts';
import { applyFirma, classifyTur, classifyYon, sinifOzeti } from '../src/lib/classify.ts';
import { buildJournal, journalBalances } from '../src/lib/journal.ts';
import { buildClassSheets } from '../src/lib/rows.ts';
import { defaultSettings } from '../src/lib/settings.ts';
import { emptyFields } from '../src/lib/types.ts';
import type { DocumentFields, ExportDoc } from '../src/lib/types.ts';

const firma = { unvan: 'Haskara Tarım', vkn: '1111111111' };
const settings = defaultSettings();

function doc(partial: Partial<DocumentFields>): DocumentFields {
  return { ...emptyFields(), ...partial, kdvSatirlari: partial.kdvSatirlari ?? [] };
}

describe('yön', () => {
  it('satıcı kendi firmaysa satış der', () => {
    expect(classifyYon(doc({ saticiUnvan: 'Haskara Tarım Ltd. Şti.', vknTckn: '1111111111' }), firma)).toBe('satis');
    expect(classifyYon(doc({ saticiUnvan: 'HASKARA TARIM GIDA' }), firma)).toBe('satis');
  });

  it('alıcı kendi firmaysa veya fiş başkasına aitse alış der', () => {
    expect(
      classifyYon(
        doc({ belgeTuru: 'fatura', saticiUnvan: 'Akdeniz Akaryakıt', vknTckn: '6123456784', aliciVknTckn: '1111111111' }),
        firma,
      ),
    ).toBe('alis');
    expect(classifyYon(doc({ belgeTuru: 'fis', saticiUnvan: 'Akdeniz Akaryakıt A.Ş.' }), firma)).toBe('alis');
  });
});

describe('mal ve hizmet', () => {
  it('anahtar kelimeleri ayırır', () => {
    expect(classifyTur('Üre gübresi ve mazot')).toBe('mal');
    expect(classifyTur('Nakliye ve tamir')).toBe('hizmet');
    expect(classifyTur('Yaprak gübresi nakliyesi')).toBe(null);
  });

  it('karma belgede tutarı iki hesaba böler', () => {
    const fields = applyFirma(
      doc({
        belgeTuru: 'fatura',
        saticiUnvan: 'Çukurova Gübre',
        vknTckn: '8450123492',
        odemeSekli: 'acik',
        toplam: 625,
        aciklama: 'gübre ve nakliye',
        kdvSatirlari: [
          { oran: 1, matrah: 500, kdv: 5, tur: 'mal', aciklama: 'Üre gübresi' },
          { oran: 20, matrah: 100, kdv: 20, tur: 'hizmet', aciklama: 'Nakliye' },
        ],
      }),
      firma,
    );
    expect(fields.yon).toBe('alis');
    expect(sinifOzeti(fields)).toBe('Alış · Karma');
    const lines = buildJournal(fields, settings.hesaplar).lines;
    expect(journalBalances(lines)).toBe(true);
    expect(lines.map((line) => line.hesapKodu)).toEqual(['153', '770', '191.01', '191.20', '320']);
    const exportDoc: ExportDoc = { id: 'karma', createdAt: '2026-11-01T00:00:00.000Z', fields };
    const sheets = buildClassSheets([exportDoc], settings, 'luca');
    const mal = sheets.find((sheet) => sheet.name === 'Alis Mal');
    const hizmet = sheets.find((sheet) => sheet.name === 'Alis Hizmet');
    expect(mal?.rows).toHaveLength(2);
    expect(hizmet?.rows).toHaveLength(2);
    expect(matrahAccount(settings.hesaplar, 'satis-mal')).toBe('600');
    expect(logoTipFor(settings.hesaplar, 'satis-hizmet')).toBe(9);
    expect(logoTipFor(settings.hesaplar, 'alis-mal')).toBe(1);
  });

  it('satışta 600 ve 391 kullanır, açık hesap 120 borçlanır', () => {
    const fields = doc({
      yon: 'satis',
      saticiUnvan: 'Haskara Tarım',
      vknTckn: '1111111111',
      odemeSekli: 'acik',
      toplam: 101,
      aciklama: 'Buğday',
      kdvSatirlari: [{ oran: 1, matrah: 100, kdv: 1, tur: 'mal', aciklama: 'Buğday' }],
    });
    const lines = buildJournal(fields, settings.hesaplar).lines;
    expect(lines.map((line) => [line.hesapKodu, line.borc, line.alacak])).toEqual([
      ['600', 0, 100],
      ['391.01', 0, 1],
      ['120', 101, 0],
    ]);
    expect(journalBalances(lines)).toBe(true);
  });
});
