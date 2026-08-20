// frontend/src/whoQuestions.js

export const WHO_QUESTIONS = {
  // --- ARKADAŞ GRUBU (3+ Kişi) ---
  GROUP: [
    // --- Klasik Başlangıç Soruları ---
    { text: "Aramızda en çok kim dağınık yaşar ve odasını asla toplamaz?", category: "Ev & Yaşam" },
    { text: "Zombi istilası çıksa ilk kim panik yapıp elenir?", category: "Kaos" },
    { text: "Ortamda hiç alakası olmayan bir konuda bile uzmanmış gibi en çok kim konuşur?", category: "Karakter" },
    { text: "Grupta flörtüne en hızlı ve en çok bağlanan (love bombing kurbanı) kim?", category: "İlişkiler" },
    { text: "Bir kafede gelen yanlış siparişi 'boşver ya ayıp olmasın' diyip en çok kim kabullenir?", category: "Sosyal" },
    { text: "Sabah uyanamayıp buluşmalara her seferinde en çok kim geç kalır?", category: "Zaman" },
    { text: "Gizli bir stalker gibi herkesin geçmişini dakikalar içinde en iyi kim bulur?", category: "Dedektif" },
    { text: "Parasını en saçma ve gereksiz şeylere hiç düşünmeden kim harcar?", category: "Finans" },
    { text: "Ortam gerilince şakayla durumu kurtarmaya çalışırken en çok kim batırır?", category: "Mizah" },
    { text: "Gruptan biri hapse düşse onu kurtarmaya gelecek ilk kişi kim olur?", category: "Dostluk" },

    // --- YENİ EKLENEN GRUP SORULARI (Eğlence ve Karakter) ---
    { text: "Yanlışlıkla grubun en büyük sırrını başkasına ağzından kaçırma potansiyeli en yüksek kim?", category: "Güven" },
    { text: "Restoranda hesap gelince 'benim şuyum vardı, senin buyun' diye ince hesap yapıp herkesi darlayan?", category: "Finans" },
    { text: "Ortada fol yok yumurta yokken gruptan biriyle kavga edip trip atma potansiyeli en yüksek kim?", category: "Dram" },
    { text: "Bir korku filmi izlerken en çok korkup herkesin tadını kaçıran?", category: "Eğlence" },
    { text: "Grupta flört ettiği kişiyi bir hafta içinde 'evleneceğim kişi' ilan eden?", category: "İlişkiler" },
    { text: "Kendi hatası olsa bile üste çıkıp herkesi haksız çıkarma konusunda usta olan?", category: "Karakter" },
    { text: "Yanında nakit para olmayıp her seferinde 'kanka sen ver, ben atarım' diyip unutan?", category: "Finans" },
    { text: "Grupta en son trendleri takip edip herkesi 'demode' ilan eden?", category: "Moda" },
    { text: "Gruptan biri ağlarken teselli etmek yerine onunla birlikte ağlamaya başlayan?", category: "Duygu" },
    { text: "Birlikte tatile gidilse en çok şikayet edip herkesin burnundan getirecek olan?", category: "Ev & Yaşam" },
    { text: "Grupta 'sadece bir tane içeceğim' diyip gecenin sonunda sızıp kalan?", category: "Kaos" },
    { text: "Yurtdışına gitse en çok Türk yemeği arayıp 'buranın yemekleri yenmez' diye darlayan?", category: "Yaşam Tarzı" },
    { text: "Grupta en çok 'ben demiştim' diyip herkesi gıcık eden?", category: "Karakter" },
    { text: "Gizli bir estetik operasyon yaptırıp herkesten saklama potansiyeli en yüksek kim?", category: "Güzellik" },
    { text: "Grupta biriyle flört etmeye başlasa bunu herkesten en uzun süre saklayacak olan?", category: "Sır" },
    { text: "Bir oyun oynarken yenilince çirkefleşip oyunun tadını kaçıran?", category: "Oyun" },
    { text: "Grupta en çok 'işim var' diyip aslında evde boş boş oturan?", category: "Sosyal" },
    { text: "Gruptan biriyle iş kursa batırma potansiyeli en yüksek olan?", category: "Finans" },
    { text: "Kendi doğum gününde bile geç kalıp herkesi bekleten?", category: "Zaman" },
    { text: "Yanlışlıkla grubun WhatsApp grubuna atılmaması gereken bir şeyi atan?", category: "Kaos" }
  ],

  // --- ÇİFTLER / İKİLİ MOD (Sen mi Ben mi) ---
  COUPLE: [
    // --- Klasik İlişki Soruları ---
    { text: "İlişkide tartışma çıkınca haklı olsa bile ortam sakinleşsin diye ilk kim alttan alır?", category: "Tartışma" },
    { text: "Dışarı çıkarken hazırlanması saatler süren ve en çok bekleten kim?", category: "Hazırlık" },
    { text: "İlişkide daha kıskanç ve gizli kontrolcü olan taraf kim?", category: "Kıskançlık" },
    { text: "Gereksiz alışveriş yapıp sonra 'ama buna ihtiyacım vardı' diyen kim?", category: "Harcama" },
    { text: "Özel günleri (yıldönümü, doğum günü vb.) unutma potansiyeli en yüksek kim?", category: "Hafıza" },
    { text: "Hasta olunca dünyanın sonu gelmiş gibi en çok naz yapan kim?", category: "Naz & İlgi" },
    { text: "Arabada / Yolda giderken yolu şaşırıp navigasyonla kavga eden kim?", category: "Yolculuk" },
    { text: "İlk adımı atan veya 'seni seviyorum' diyen taraf kimdi / kim olur?", category: "Romantizm" },

    // --- YENİ EKLENEN ÇİFT SORULARI (İlişki Dinamiği) ---
    { text: "Eski sevgilisini sosyal medyadan gizlice stalklama potansiyeli daha yüksek olan?", category: "Sır" },
    { text: "Bir tartışma anında en saçma ve alakasız eski konuları açıp tartışmayı büyüten?", category: "Tartışma" },
    { text: "Birlikte izlenecek filme karar verirken en çok zorlayıp kendi istediğini yaptıran?", category: "Sosyal" },
    { text: "Yanlışlıkla partnerinin en utanç verici anını arkadaşlarının yanında anlatan?", category: "Karakter" },
    { text: "İlişkide 'Ben daha çok seviyorum' diye iddialaşan taraf?", category: "Romantizm" },
    { text: "Partnerinin telefonunu gizlice kurcalama potansiyeli daha yüksek olan?", category: "Kıskançlık" },
    { text: "Eski bir tartışmayı unutup 'Sen o zaman böyle demiştin' diyip tekrar başlatan?", category: "Tartışma" },
    { text: "Birlikte tatile gidilse en çok fotoğraf çektirip partnerini darlayan?", category: "Sosyal" },
    { text: "İlişkide daha 'dominant' (baskın) ve kararları veren taraf kim?", category: "Güç" },
    { text: "Partnerinin giydiği kıyafeti beğenmeyip 'Değiştir onu' diye darlayan?", category: "Karakter" },
    { text: "Bir buluşmaya geç kalıp 'Trafik vardı' diye partnerine yalan söyleyen?", category: "Zaman" },
    { text: "İlişkide ilk 'evlenelim mi?' konusunu açacak olan?", category: "Gelecek" },
    { text: "İlişkide daha çok 'tatlı sert' (bickering) tartışmayı başlatan?", category: "Çatışma" },
    { text: "Partnerinin bir sırrını yanlışlıkla ailesine ağzından kaçıran?", category: "Dram" },
    { text: "Eski sevgilisiyle hala arkadaş kalma konusunda daha 'açık fikirli' olan?", category: "Karakter" },
    { text: "Partnerine sürpriz yapacağım diyip her şeyi batıran?", category: "Romantizm" },
    { text: "İlişkide daha çok 'ev kuşu' olup partnerini evde tutmaya çalışan?", category: "Ev & Yaşam" },
    { text: "Birlikte oynanan bir oyunda yenilince partnerine trip atan?", category: "Oyun" },
    { text: "Eski bir hatayı unutup tekrar yapma potansiyeli daha yüksek olan?", category: "Duygu" },
    { text: "Partnerinin 'En iyi arkadaşı' mı yoksa 'Sevgilisi' mi olduğu konusunda daha kararsız olan?", category: "Karakter" }
  ]
};