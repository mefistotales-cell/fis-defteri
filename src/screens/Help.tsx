export function Help() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-16">
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Fotoğraf</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[17px] leading-relaxed">
          <li>Fişi veya faturayı düz, aydınlık bir yere koyun. Gölge ve kırışıklık okumayı bozar.</li>
          <li>Dört köşe de kadrajda olsun. Fişte Z no ve EKÜ no genelde altta kalır.</li>
          <li>Birden fazla belgeyi galeriden birlikte seçebilirsiniz. Her fotoğraf ayrı belgedir.</li>
          <li>Okunan alanları kaydetmeden kontrol edin. Sarı veya kırmızı çerçeve, emin olunmayan ya da tutmayan alandır.</li>
        </ol>
      </section>
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">iPhone</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[17px] leading-relaxed">
          <li>Safari ile sayfayı açın. Chrome’da ana ekrana ekleme kamerayı her seferinde sorabilir.</li>
          <li>Paylaş düğmesine, sonra Ana Ekrana Ekle’ye basın.</li>
          <li>Fiş çek, telefonun kamerasını açar. Fotoğraf seç, galeriden bir veya daha fazla resim alır.</li>
          <li>Excel’e aktarınca Paylaş sayfası çıkarsa dosyayı Dosyalar’a veya mali müşavirin WhatsApp’ına gönderin.</li>
          <li>Ana ekran kısayolu için adresin https olması gerekir. Aynı evdeki bilgisayardan http ile de fiş çekebilirsiniz.</li>
        </ol>
      </section>
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Luca</h2>
        <h3 className="mt-3 font-semibold">Fatura ve fiş listesi</h3>
        <p className="mt-1 text-[17px] leading-relaxed">
          Menü: <strong>Muhasebe → Fiş İşlemleri → Excel Fatura Aktarımı</strong>. Luca bu ekranda CSV ister, en fazla 15 sütun ve 400 satır. Uygulamadaki “Luca fatura CSV” dosyasını yükleyin. İlk ay sütun başlığına tıklayıp kuralı bir kez tanımlayın, şablon olarak kaydedin:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Evrak Tarihi → sütun türü Evrak Tarihi</li>
          <li>Evrak No → Evrak No</li>
          <li>Açıklama → Açıklama</li>
          <li>Matrah, KDV, Toplam, Tevkifat → sütun türü Tutar</li>
          <li>VKN/TCKN → Vergi No / T.C. Kimlik No ile hesap belirleme</li>
          <li>Karşı Hesap → matrahın gideceği hesap (alış mal 153, alış hizmet 770)</li>
        </ul>
        <p className="mt-2 text-[17px] leading-relaxed">
          Nakit fişlerde fiş keserken “Nakit işlemler” kutusunu işaretleyin; toplam kasaya gider. CSV’yi Excel’de açıp yeniden kaydetmeyin, sütunlar kayabilir. Ondalık ayracı noktadır (1234.56), tarih GG.AA.YYYY’dir. Kaynak: Luca destek belgesi 01.02.11, Nisan 2021. O belgedeki örnek sütunlar %8 ve %18’dir; uygulama güncel %1, %10 ve %20 kullanır.
        </p>
        <h3 className="mt-4 font-semibold">Hazır muhasebe fişi</h3>
        <p className="mt-1 text-[17px] leading-relaxed">
          Menü: <strong>Muhasebe → Fiş İşlemleri → Excel Veri Aktarımı</strong>. Önce Luca’dan Şablon indir deyin. Zorunlu alanlar Fiş No, Fiş Tarihi, Hesap Kodu, Borç ve Alacaktır. Başlıklar uyuşmuyorsa Ayarlar’dan sırayı Luca şablonuna göre değiştirin. Aynı anda en fazla 50 fiş, mahsup fişte 400 satır. Doğrulama kodunu elle yazın. Fiş keserken tipi Mahsup seçin. Hesap kodu planda yoksa Luca “hesap kodu bulunamadı” der. Kaynak: Luca destek belgesi 01.02.09.
        </p>
      </section>
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Logo</h2>
        <p className="mt-2 text-[17px] leading-relaxed">
          Tiger ve GO’da yerleşik <strong>Araçlar → Veri Aktarımı (Excel’den)</strong> veya <strong>Uygulamalar → Aktarım İşlemleri → Excel’den Veri Aktarımı</strong> yalnız kart alır (cari, stok, hesap). Fatura almaz.
        </p>
        <p className="mt-2 text-[17px] leading-relaxed">
          Fatura ve fiş için program klasöründeki <strong>ExcelTrans</strong> kullanılır: hareket tipi Alım Faturası veya Muhasebe Fişi, Ekle, kolonları A’dan itibaren seçin. Alt çizgiyle başlayan alanlar zorunludur. Sonra bizim dosyanın başlıklarını, ExcelTrans’ın ürettiği şablonla birebir aynı yapın (Ayarlar → Sütunlar). Demo lisans 2 satırdan fazlasını aktarmaz.
        </p>
        <p className="mt-2 text-[17px] leading-relaxed">
          Muhasebe fişi açıksa satırlara kopyala-yapıştır da olur. Boş sayısal hücre 0’dır. Sütun sırası ekrandakiyle aynı olmalıdır.
        </p>
        <p className="mt-2 text-[17px] leading-relaxed">
          Logo İşbaşı’nda ExcelTrans yoktur ve herkese açık sabit bir alım faturası Excel şablonu doğrulanamadı. İşbaşı için muhasebeci özetini kullanın ya da sütunları İşbaşı’nın kendi içe alma ekranına göre yeniden adlandırın.
        </p>
        <p className="mt-2 text-sm text-muted">
          Logo fatura tipi sayısı varsayımdır: alış mal 1, alış hizmet 4, satış mal 8, satış hizmet 9, müstahsil makbuzu 26. 14 verilen fiyat farkıdır. Sayı Logo’nun fatura türü kodudur, resmi bir Excel başlığı değildir. Ayarlar’dan değişir.
        </p>
      </section>
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Ne varsayım?</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[17px] leading-relaxed">
          <li>Luca fatura sütunlarının sırası ve adları, resmi kural ekranına göre kuruldu; Luca’nın indirdiğiniz şablonuyla aynı olmayabilir.</li>
          <li>Luca fişte Evrak No, Evrak Tarihi ve Açıklama resmi zorunlu listedeki beş alanın yanına eklendi. İsterseniz kapatın.</li>
          <li>Belge türü sütunu kapalı gelir. Açarsanız fiş için FŞ, fatura için FT, müstahsil için MM yazar. Luca’nın stoklu örneği “FT-Fatura” der.</li>
          <li>Müstahsil makbuzu her zaman alıştır. Brüt 153 borç, gelir vergisi stopajı 360 alacak, Bağ-Kur/SGK 361 alacak, net ödeme nakitse 100 değilse 320 alacak. Borsa tescil ve mera fonu da varsayılan 360’tır; Ayarlar’dan ayrılır. KDV sayfalarına yazılmaz, Mustahsil sayfasındadır.</li>
          <li>%8 ve %18 sütunları kapalıdır. Eski oran, %10 veya %20 diye yazılmaz; açıklamada ve fiş satırında durur.</li>
          <li>Toplam tutmuyorsa fiş dengelenir, satırda FARK yazar. Kaydı kesmeden belgeye bakın.</li>
          <li>Tevkifat okunmaz, sütun 0 gelir.</li>
        </ul>
      </section>
    </main>
  );
}
