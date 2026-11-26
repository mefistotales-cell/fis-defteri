export const fisModel = {
  belgeTuru: 'yazar kasa fişi',
  tarih: '04.11.2026',
  saat: '14.32',
  saticiUnvan: 'Akdeniz Akaryakıt A.Ş.',
  vknTckn: '612 345 6784',
  vergiDairesi: 'Seyhan',
  fisNo: '004218',
  zNo: '118',
  ekuNo: '0003',
  kdv: [
    { oran: '%20', matrah: '1.000,00', kdv: '200,00' },
    { oran: '20', matrah: '0', kdv: '0' },
  ],
  toplam: '1.200,00',
  odemeSekli: 'NAKİT',
  aciklama: 'Motorin',
  guven: { toplam: 'high', vknTckn: 'düşük' },
};

export const wrappedModel = `Açıklama:\n\`\`\`json\n${JSON.stringify({
  belgeTuru: 'e-fatura',
  tarih: '2026-11-18',
  saticiUnvan: 'Çukurova Gübre',
  vkn: '8450123492',
  faturaNo: 'CUK2026000000142',
  kdv: { '1': { matrah: 500, kdv: 5 }, '10': { matrah: '250,00', kdvTutari: 25 } },
  genelToplam: 782,
  odeme: 'açık hesap',
  aciklama: 'Üre',
})}\n\`\`\``;

export const eskiOranModel = {
  belgeTuru: 'fatura',
  tarih: '2022-06-01',
  saticiUnvan: 'Eski Tedarikçi',
  vknTckn: '6123456784',
  belgeNo: 'A1',
  kdv: [{ oran: 18, matrah: 100, kdv: 18 }],
  toplam: 118,
  odemeSekli: 'havale',
};

export const tutarsizModel = {
  belgeTuru: 'fis',
  tarih: '2026-11-01',
  saticiUnvan: 'Test',
  vknTckn: '111',
  belgeNo: '9',
  kdv: [{ oran: 20, matrah: 100, kdv: 10 }],
  toplam: 150,
  odemeSekli: 'kart',
};
