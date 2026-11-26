# Fiş Defteri

Haskara Tarım (Adana) için fiş ve fatura defteri. Telefonda yazar kasa fişinin veya faturanın fotoğrafını çekersiniz; uygulama satıcı, tarih, VKN, KDV dökümü ve toplamı çıkarır. Kaydettikten sonra ayın belgelerini mali müşavirin **Luca** ve **Logo** programına yükleyebileceği Excel dosyasına çevirir.

Fotoğraflar ve API anahtarı telefonda kalır. Arada bir sunucu yoktur. Okuma, sizin girdiğiniz anahtarla seçtiğiniz modele doğrudan gider.

## Bilgisayarda çalıştırma

Node.js 22 yeter.

```bash
npm install
npm run dev
```

Tarayıcıda [http://127.0.0.1:47321/fis-defteri/](http://127.0.0.1:47321/fis-defteri/) adresini açın. Uygulama bu alt yolda çalışır; kök adres boş kalır. Ana sayfadaki **Örnek fiş ve faturayı yükle** ile anahtarsız da ekranı ve Excel’i deneyebilirsiniz.

```bash
npm test          # sayı, kontrol ve Excel testleri
npm run build     # dist/ klasörü, statik site
npm run preview   # derlenmiş siteyi 47321 portunda açar
```

## API anahtarı

Ayarlar sayfasına kendi anahtarınızı yazın. Anahtar `localStorage` içindedir, depoya yazılmaz.

| Servis | Ne zaman | Anahtar |
| --- | --- | --- |
| Google Gemini | Telefonda en sorunsuz seçenek. Varsayılan model `gemini-flash-latest`. Yoğunlukta `gemini-flash-lite-latest` deneyin. | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI | Model `gpt-4o-mini`. | [OpenAI](https://platform.openai.com/api-keys) |
| OpenRouter | Tek anahtarla başka modeller. | [OpenRouter](https://openrouter.ai/keys) |
| OpenAI uyumlu adres | Adres `/v1` ile bitsin. | Kendi adresiniz |

**Anahtarı dene** düğmesi küçük bir yazı gönderir, fotoğraf göndermez. Sağlayıcının sitesinde harcama limiti koyun. Telefonu başkası kullanıyorsa anahtarı Ayarlar’dan silin.

## iPhone

1. Sayfayı **Safari** ile açın.
2. Paylaş → **Ana Ekrana Ekle**. Kısayolun çalışması için adresin `https` olması gerekir. Yayın adresi `https://mefistotales-cell.github.io/fis-defteri/` olacak. Aynı ev ağında `http://bilgisayar-ip:47321/fis-defteri/` ile de fiş çekebilirsiniz; kamera, dosya seçiciden açılır.
3. **Fiş çek** arka kamerayı açar. **Fotoğraf seç** galeriden bir veya daha fazla resim alır. Her fotoğraf ayrı belgedir. Çok sayfalı faturayı tek karede çekin.
4. Alanları kontrol edip kaydedin. Sarı çerçeve bulanık veya şüpheli, kırmızı çerçeve tutmayan alandır. Matrah + KDV, belgedeki toplamla kuruşu kuruşuna karşılaştırılır.
5. Ay sonunda **Excel’e aktar**. iPhone paylaşım sayfası açılırsa dosyayı Dosyalar’a veya mali müşavirin WhatsApp’ına gönderin.

Fişi düz ve gölgesiz çekin. Z no ile EKÜ no genelde fişin altındadır; kesilirse uyarı çıkar.

## Ücretsiz yayınlama

Derleme `base` olarak `/fis-defteri/` kullanır. GitHub Pages proje sitesi budur: `https://mefistotales-cell.github.io/fis-defteri/`. `main` dalına push, `.github/workflows/pages.yml` ile `npm ci && npm run build` çalıştırır ve `dist/` klasörünü GitHub Pages’e koyar. Sayfalar adresin `#` sonrasındadır; sunucu yönlendirmesi gerekmez.

Başka bir kök adreste (alan adının kendisinde) yayınlamak için `vite.config.ts` içindeki `base` değerini `/` yapmak gerekir.

## Ayı dışa aktarma

Seçili aydaki belgeler, belge tarihine göre eskiden yeniye sıralanır. Tarihi olmayan belge, kaydedildiği aya düşer.

| Dosya | Kime |
| --- | --- |
| `Haskara-Luca-Fatura-YYYY-AA.csv` | Luca Excel Fatura Aktarımı. Bunu yükleyin. |
| `Haskara-Luca-Fatura-YYYY-AA.xlsx` | Aynı listenin kontrol kopyası. Luca’ya bunu değil CSV’yi verin. |
| `Haskara-Luca-Fis-YYYY-AA.xlsx` | Luca Excel Veri Aktarımı (hazır yevmiye). |
| `Haskara-Logo-Alim-YYYY-AA.xlsx` | Logo ExcelTrans alım faturası taslağı. |
| `Haskara-Logo-Fis-YYYY-AA.xlsx` | Logo muhasebe fişi satırları. |
| `Haskara-Muhasebeci-Ozet-YYYY-AA.xlsx` | Programa yüklenmez. Fotoğraftan okunan her alan, aylık toplam ve kısa not. |

Luca bir fatura dosyasında en çok 400 satır, bir fiş yüklemesinde en çok 50 fiş kabul eder. Ay bunu aşarsa dosya `-1`, `-2` diye bölünür. CSV’yi Excel’de açıp yeniden kaydedmeyin; sütunlar kayar. Kontrol için xlsx’i açın.

Tutar satırlarla tutmuyorsa fiş yine borç/alacak denk gelir ve satırda `FARK` yazar. Özet dosyasında uyarı durur. Kaydı kesmeden fişe bakın.

## Luca’ya yükleme

Kaynaklar: [Excel Fatura Aktarımı (01.02.11, Nisan 2021)](https://lucayazilim.freshdesk.com/support/solutions/articles/67000271379-01-02-11-excel-fatura-aktar-m-) ve [Excel Veri Aktarımı (01.02.09)](https://lucayazilim.freshdesk.com/support/solutions/articles/67000267580-01-02-09-excel-veri-aktar-m-).

### Fatura / fiş listesi

**Muhasebe → Fiş İşlemleri → Excel Fatura Aktarımı**

CSV’yi seçin. İlk ayda her sütun başlığına tıklayıp kuralı bir kez tanımlayın ve şablon olarak kaydedin:

- Evrak Tarihi → Evrak Tarihi
- Evrak No → Evrak No
- Açıklama → Açıklama
- Matrah, KDV, Toplam, Tevkifat KDV → Tutar
- VKN/TCKN → Vergi no / T.C. kimlik no ile hesap belirleme
- Karşı Hesap → matrah hesabı (varsayılan `770`)

Nakit fişlerde fiş kesme ekranındaki **Nakit işlemler** kutusunu işaretleyin. Resmi sınır: 15 sütun, 400 satır. Tarih `GG.AA.YYYY`, ondalık `1234.56` (nokta), dosya Windows-1254.

2021’deki Luca örneği `MATRAH8` / `KDV18` kullanır. O oranlar kalktı. Varsayılan dosya `%0`, `%1`, `%10`, `%20` sütunlarını açar. `%8` ve `%18` Ayarlar’da kapalı durur; eski bir belgede çıkar ve açıklamaya yazılır, `%10` veya `%20` diye dağıtılmaz.

### Hazır muhasebe fişi

**Muhasebe → Fiş İşlemleri → Excel Veri Aktarımı**

Önce Luca’dan **Şablon indir**. Zorunlu alanlar resmi belgede şunlardır: **Fiş No, Fiş Tarihi, Hesap Kodu, Borç, Alacak**. Uygulama bunların yanına Evrak No, Evrak Tarihi ve Açıklama ekler. Şablonunuzda yoksa Ayarlar’dan kapatın veya sırayı Luca dosyasındakiyle aynı yapın. Doğrulama kodunu elle yazın. Fiş keserken tip **Mahsup**. Hesap planda yoksa Luca “hesap kodu bulunamadı” der; kodu Ayarlar’dan büronun alt hesabına çevirin.

Aynı fiş numarası bir belgenin satırlarını bir arada tutar. Borç toplamı alacak toplamına eşittir.

## Logo’ya yükleme

Logo’nun yerleşik **Araçlar → Veri Aktarımı (Excel’den)** veya **Uygulamalar → Aktarım İşlemleri → Excel’den Veri Aktarımı** yolu kart alır (cari, stok, hesap). Fatura almaz.

**Tiger / GO:** program klasöründeki **ExcelTrans** → hareket tipi **Alım Faturası** veya **Muhasebe Fişi** → Ekle → kolonları A’dan seçin. Alt çizgiyle başlayan alanlar zorunludur. ExcelTrans’ın ürettiği başlıklarla uygulamadaki başlıklar birebir aynı olmalıdır; Ayarlar → Sütunlar’dan değiştirin. Demo lisans 2 satırdan fazlasını aktarmaz.

Muhasebe fişi açıksa `Logo-Fis` satırlarını yapıştırabilirsiniz. Sayısal boşluk `0`’dır. Sütun sırası ekrandaki sırayla aynı olmalıdır.

**İşbaşı:** ExcelTrans yoktur. Herkese açık, sabit bir alım faturası Excel şablonu bulunamadı. İşbaşı için **muhasebeci özetini** kullanın veya sütunları İşbaşı’nın kendi içe alma ekranına göre yeniden adlandırın.

Logo fatura tipi sayısı varsayımdır, resmi bir Excel başlığı değildir: fiş `4` (alınan hizmet), fatura `1` (mal alım). Ayarlar’dan değişir.

## Varsayılan sütunlar

| Düzen | Dayanak | Sizin yapmanız gereken |
| --- | --- | --- |
| Luca fatura, 15 açık sütun | Luca’nın kural ekranı ve 15 sütun sınırı. Oranlar 2026’ya göre. Başlık adları Luca’nın indirdiği bir dosyadan kopyalanmadı. | İlk ay kuralı şablon diye kaydedin. Başlık farklıysa Ayarlar’dan yazın. |
| Luca fiş | Zorunlu beş alan resmi. Evrak No, Evrak Tarihi, Açıklama ek. Belge Türü, Miktar, Para Birimi, Hesap Adı kapalı. | Şablon indir ile karşılaştırın. |
| Belge türü `FŞ` / `FT` | Luca stoklu örneği “FT-Fatura” der. `FŞ` yaygın bir kısaltmadır, resmi başlık değildir. | Sütun kapalıdır. Açmadan önce Luca’daki kodu doğrulayın. |
| Logo alım ve Logo fiş | ExcelTrans kolonları kullanıcıya aittir. Sabit resmi şablon yoktur. | Başlık ve sırayı ExcelTrans şablonuna eşleyin. |
| Muhasebeci özeti | Bu uygulamanın kendi sayfası. `Belgeler`, `Toplamlar`, `Okuma`. | Programa yüklemeyin. |

Tevkifat okunmaz; sütun `0` gelir. Sınıf, satıcıyı Ayarlar’daki kendi unvan ve VKN ile karşılaştırır: satıcı sizseniz satış, değilseniz alış. ÖKC fişi alış kalır. Mal (gübre, tohum, mazot…) ve hizmet (nakliye, kira, elektrik…) satır satır ayrılır. Varsayılan hesaplar: alış mal `153`, alış hizmet `770`, satış mal ve hizmet `600`. Açık hesapta satış `120` borç, alış `320` alacak. KDV alışta `191`, satışta `391`. Logo tipi: mal alım `1`, alınan hizmet `4`, satış `8`, verilen hizmet `9`. Nakit `100`, kart `108`, havale `102`. Excel’de dört sayfa vardır: Alis Mal, Alis Hizmet, Satis Mal, Satis Hizmet. Müstahsil makbuzu ayrı türdür ve her zaman alıştır: brüt `153` borç, stopaj `360` alacak, Bağ-Kur/SGK `361` alacak, net ödeme nakitse `100` değilse `320` alacak. Borsa tescil ve mera fonu varsayılan olarak `360` altındadır; Ayarlar’dan ayrılır. Logo tipi 26’dır (14 verilen fiyat farkıdır). Kodu mali müşavir söyler; Ayarlar’dan değiştirin.

## Testler

`tests/` sayı biçimini (`1.234,56`), VKN/TCKN kontrol basamağını, model JSON’unu, tutarsız toplamı, eski `%18` oranının `%20` sütununa yazılmamasını ve Excel/CSV çıktısını dener. Örnek görseller `public/ornek-fis.png` ve `public/ornek-fatura.png` dosyalarıdır; ikisi de sentetiktir, mali değeri yoktur. Yeniden üretmek için `npm run fixtures`.
