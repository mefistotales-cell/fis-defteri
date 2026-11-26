import type { DocumentFields } from './types.ts';

export interface SampleSpec {
  id: string;
  image: string;
  createdAt: string;
  fields: DocumentFields;
}

export const SAMPLES: SampleSpec[] = [
  {
    id: 'ornek-fis-adana',
    image: `${import.meta.env.BASE_URL}ornek-fis.png`,
    createdAt: '2026-11-04T08:00:00.000Z',
    fields: {
      belgeTuru: 'fis',
      tarih: '2026-11-04',
      saat: '14:32',
      saticiUnvan: 'Akdeniz Akaryakıt A.Ş.',
      vknTckn: '6123456784',
      vergiDairesi: 'Seyhan',
      belgeNo: '004218',
      zNo: '118',
      ekuNo: '0003',
      kdvSatirlari: [{ oran: 20, matrah: 1000, kdv: 200 }],
      toplam: 1200,
      odemeSekli: 'nakit',
      aciklama: 'Motorin',
      guven: { toplam: 'yuksek', tarih: 'yuksek' },
    },
  },
  {
    id: 'ornek-fatura-gubre',
    image: `${import.meta.env.BASE_URL}ornek-fatura.png`,
    createdAt: '2026-11-18T08:00:00.000Z',
    fields: {
      belgeTuru: 'fatura',
      tarih: '2026-11-18',
      saat: '',
      saticiUnvan: 'Çukurova Gübre Tarım Ltd. Şti.',
      vknTckn: '8450123492',
      vergiDairesi: 'Yüreğir',
      belgeNo: 'CUK2026000000142',
      zNo: '',
      ekuNo: '',
      kdvSatirlari: [
        { oran: 1, matrah: 500, kdv: 5 },
        { oran: 10, matrah: 250, kdv: 25 },
      ],
      toplam: 782,
      odemeSekli: 'acik',
      aciklama: 'Üre ve yaprak gübresi',
      guven: { vergiDairesi: 'dusuk', toplam: 'orta' },
    },
  },
];
