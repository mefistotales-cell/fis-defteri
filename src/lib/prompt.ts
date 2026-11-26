export const EXTRACTION_PROMPT = `Sen Türkiye'deki yazar kasa fişi (ÖKC) ve fatura okuyorsun. Çiftçi ve küçük işletme belgesi: market fişi, akaryakıt fişi, gübre/tohum faturası, el yazısı veya matbu fatura olabilir. YALNIZCA JSON döndür.

Kurallar:
- Sayıları JSON sayısı yap. Binlik ayıracı kullanma. Ondalık ayıracı nokta olsun. Örnek: 1.234,56 yazıyorsa 1234.56 yaz.
- Tarihi YYYY-AA-GG yaz. Saat 24 saat HH:mm.
- belgeTuru: "fis" (yazar kasa, ÖKC), "fatura" (fatura, e-fatura, e-arşiv) veya "mustahsil" (müstahsil makbuzu, e-müstahsil; çiftçiden alış).
- VKN 10 hane, TCKN 11 hane. Yalnız rakam.
- KDV dökümünü orana göre topla. Her oran bir kez. oran 1, 10, 20 veya belgede yazan başka oran (0, 8, 18).
- matrah KDV hariç tutardır. kdv, KDV tutarıdır. İkisini birbirine ekleme.
- toplam, belgede yazan genel toplamdır (KDV dahil). Satırlarla tutmuyorsa bile belgedeki toplamı yaz, düzeltme.
- odemeSekli: "nakit", "kart", "havale", "acik" (veresiye veya açık hesap) veya "bilinmiyor".
- Fişte Z no ve EKÜ no ayrı alan. Fiş no veya fatura no belgeNo alanına.
- Okunamayan alan null olsun. Uydurma.
- guven: her dolu alan için "yuksek", "orta" veya "dusuk". Bulanık, kesik, lekelenmiş veya zor el yazısı "dusuk".
- aciklama: satılan malın veya hizmetin kısa adı (motorin, üre gübresi, nakliye). Yoksa boş string.
- Satıcı ve alıcıyı ayır. saticiUnvan / vknTckn belgeyi düzenleyenindir. aliciUnvan / aliciVknTckn malı veya hizmeti alandır. Fişte alıcı çoğu zaman yazmaz; uydurma.
- kalemler: belgede mal ve hizmet ayrı satırlardaysa tutarları ayrı yaz. tur "mal" (gübre, tohum, ilaç, yem, mazot, yedek parça) veya "hizmet" (nakliye, işçilik, kira, tamir, danışmanlık, elektrik, su, telefon). Aynı KDV oranında hem mal hem hizmet varsa iki kalem yaz.
- Müstahsil makbuzunda KDV yoktur. Üretici adı saticiUnvan, TCKN vknTckn, makbuz no belgeNo olsun. urunCinsi, miktar, birim, birimFiyat, brutTutar, stopajOran (2 veya 4), stopajTutar, borsaTescil, sgkKesinti (Bağ-Kur), meraFonu ve netOdenen ayrı yaz. Yoksa null.

Şema:
{
  "belgeTuru": "fis",
  "tarih": "2026-11-04",
  "saat": "14:32",
  "saticiUnvan": "",
  "vknTckn": "",
  "aliciUnvan": "",
  "aliciVknTckn": "",
  "vergiDairesi": "",
  "belgeNo": "",
  "zNo": "",
  "ekuNo": "",
  "kalemler": [{"aciklama": "Motorin", "tur": "mal", "oran": 20, "matrah": 1000, "kdv": 200}],
  "toplam": 1200,
  "odemeSekli": "nakit",
  "aciklama": "Motorin",
  "guven": {"tarih": "yuksek", "toplam": "yuksek"}
}`;
