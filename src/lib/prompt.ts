export const EXTRACTION_PROMPT = `Sen Türkiye'deki yazar kasa fişi (ÖKC) ve fatura okuyorsun. Çiftçi ve küçük işletme belgesi: market fişi, akaryakıt fişi, gübre/tohum faturası, el yazısı veya matbu fatura olabilir. YALNIZCA JSON döndür.

Kurallar:
- Sayıları JSON sayısı yap. Binlik ayıracı kullanma. Ondalık ayıracı nokta olsun. Örnek: 1.234,56 yazıyorsa 1234.56 yaz.
- Tarihi YYYY-AA-GG yaz. Saat 24 saat HH:mm.
- belgeTuru: "fis" (yazar kasa, ÖKC, perakende fiş) veya "fatura" (fatura, e-fatura, e-arşiv, irsaliyeli fatura, el yazısı fatura).
- VKN 10 hane, TCKN 11 hane. Yalnız rakam.
- KDV dökümünü orana göre topla. Her oran bir kez. oran 1, 10, 20 veya belgede yazan başka oran (0, 8, 18).
- matrah KDV hariç tutardır. kdv, KDV tutarıdır. İkisini birbirine ekleme.
- toplam, belgede yazan genel toplamdır (KDV dahil). Satırlarla tutmuyorsa bile belgedeki toplamı yaz, düzeltme.
- odemeSekli: "nakit", "kart", "havale", "acik" (veresiye veya açık hesap) veya "bilinmiyor".
- Fişte Z no ve EKÜ no ayrı alan. Fiş no veya fatura no belgeNo alanına.
- Okunamayan alan null olsun. Uydurma.
- guven: her dolu alan için "yuksek", "orta" veya "dusuk". Bulanık, kesik, lekelenmiş veya zor el yazısı "dusuk".
- aciklama: satılan malın kısa adı (motorin, üre gübresi). Yoksa boş string.

Şema:
{
  "belgeTuru": "fis",
  "tarih": "2026-11-04",
  "saat": "14:32",
  "saticiUnvan": "",
  "vknTckn": "",
  "vergiDairesi": "",
  "belgeNo": "",
  "zNo": "",
  "ekuNo": "",
  "kdv": [{"oran": 20, "matrah": 1000, "kdv": 200}],
  "toplam": 1200,
  "odemeSekli": "nakit",
  "aciklama": "Motorin",
  "guven": {"tarih": "yuksek", "toplam": "yuksek"}
}`;
