/**
 * Alt kategorileri belirli sıraya göre sıralar
 * @param subcategories - Sıralanacak alt kategoriler
 * @param categoryName - Ana kategori adı
 * @returns Sıralanmış alt kategoriler
 */
export function sortSubcategoriesByOrder<T extends { name: string; is_default?: boolean }>(
  subcategories: T[],
  categoryName: string
): T[] {
  // Alt kategori sıralama mapping
  const subcategoryOrderMap: Record<string, string[]> = {
    'Ürün Satış Gelirleri': [
      'Donanım Satışı',
      'Yazılım / Lisans Satışı',
      'Yedek Parça Satışı',
      'Paket / Bundle Satışı',
      'Diğer Ürün Satışları'
    ],
    'Hizmet Gelirleri': [
      'Kurulum & Montaj',
      'Teknik Servis',
      'Danışmanlık',
      'Eğitim',
      'Destek Hizmeti'
    ],
    'Proje Gelirleri': [
      'Anahtar Teslim Proje',
      'Hakediş Geliri',
      'Ek İşler',
      'Revizyon / Değişiklik',
      'Proje Danışmanlığı'
    ],
    'Sözleşme & Abonelik Gelirleri': [
      'Bakım Sözleşmesi',
      'Destek Sözleşmesi',
      'Abonelik Geliri',
      'Lisans Yenileme',
      'SLA / Hizmet Paketi'
    ],
    'Varlık Kaynaklı Gelirler': [
      'Gayrimenkul Kira Geliri',
      'Araç / Ekipman Kiralama',
      'Marka / Lisans Kullanımı',
      'Alt Kiralama',
      'Diğer Varlık Gelirleri'
    ],
    'Finansal & Diğer Gelirler': [
      'Faiz Gelirleri',
      'Kur Farkı Geliri',
      'Teşvik / Destek',
      'Tazminat & Sigorta',
      'Hurda / Diğer Gelirler'
    ],
    'Personel Giderleri': [
      'Maaşlar',
      'SGK & Vergiler',
      'Yemek',
      'Yol',
      'Prim & Bonus',
      'Fazla Mesai',
      'Eğitim & Sertifikasyon'
    ],
    'Ofis & Genel Yönetim Giderleri': [
      'Ofis Kirası',
      'Elektrik / Su / Doğalgaz',
      'İnternet & Telefon',
      'Temizlik',
      'Kırtasiye',
      'Güvenlik',
      'Ortak Giderler'
    ],
    'Araç & Lojistik Giderleri': [
      'Yakıt',
      'Araç Bakım & Onarım',
      'Araç Sigortası (Kasko / Trafik)',
      'Motorlu Taşıtlar Vergisi (MTV)',
      'Muayene (TÜVTÜRK)',
      'OGS / HGS / Otopark',
      'Lastik & Sarf Giderleri',
      'Araç Kiralama'
    ],
    'Operasyon & Saha Giderleri': [
      'Montaj Malzemeleri',
      'Sarf Malzemeleri',
      'Taşeron Hizmetleri',
      'Saha Ekipmanları',
      'İş Güvenliği Giderleri'
    ],
    'Pazarlama & Satış Giderleri': [
      'Dijital Reklam',
      'Baskı & Matbaa',
      'Fuar & Etkinlik',
      'Satış Komisyonları',
      'CRM & Satış Araçları',
      'Tanıtım & Sponsorluk'
    ],
    'Bilgi Teknolojileri & Yazılım Giderleri': [
      'Yazılım Abonelikleri',
      'Lisans Ücretleri',
      'Sunucu & Bulut',
      'Alan Adı & Hosting',
      'Donanım Bakım',
      'Siber Güvenlik'
    ],
    'Finansman Giderleri': [
      'Kredi Faizleri',
      'Banka Masrafları',
      'Kur Farkı Giderleri',
      'Komisyonlar',
      'Leasing Giderleri'
    ],
    'Vergi & Resmi Yükümlülükler': [
      'KDV',
      'Stopaj',
      'Damga Vergisi',
      'Harçlar',
      'Ruhsat & İzinler'
    ],
    'Bakım, Onarım & Destek Giderleri': [
      'Cihaz Bakım',
      'Yedek Parça',
      'Teknik Destek',
      'Sözleşmeli Bakım',
      'Kalibrasyon'
    ],
    'Yatırım (CAPEX) Giderleri': [
      'Makine & Ekipman Alımı',
      'Araç Satın Alma',
      'Yazılım Geliştirme',
      'Ofis Tadilatı',
      'Mobilya & Demirbaş',
      'Altyapı Yatırımları'
    ]
  };

  const order = subcategoryOrderMap[categoryName];
  if (!order) {
    // Eğer kategori için sıralama tanımlı değilse, default kategorileri önce, sonra ekleme sırasına göre
    const defaultSubs = subcategories.filter(s => s.is_default === true);
    const userSubs = subcategories.filter(s => !s.is_default || s.is_default === false)
      .sort((a, b) => {
        // created_at varsa ona göre, yoksa id'ye göre sırala
        if ('created_at' in a && 'created_at' in b) {
          return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime();
        }
        return 0;
      });
    return [...defaultSubs, ...userSubs];
  }

  // Default alt kategorileri belirli sıraya göre sırala
  const defaultSubs = subcategories.filter(s => s.is_default === true);
  // Kullanıcı eklediği alt kategorileri ekleme sırasına göre sırala (en alta)
  const userSubs = subcategories.filter(s => !s.is_default || s.is_default === false)
    .sort((a, b) => {
      // created_at varsa ona göre, yoksa id'ye göre sırala
      if ('created_at' in a && 'created_at' in b) {
        return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime();
      }
      return 0;
    });

  defaultSubs.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name, 'tr');
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return [...defaultSubs, ...userSubs];
}

/**
 * Kategorileri belirli sıraya göre sıralar
 * @param categories - Sıralanacak kategoriler
 * @param type - Kategori tipi ('income' | 'expense')
 * @returns Sıralanmış kategoriler
 */
export function sortCategoriesByOrder<T extends { name: string; is_default?: boolean }>(
  categories: T[],
  type: 'income' | 'expense'
): T[] {
  const defaultCats = categories.filter(cat => cat.is_default === true);
  // Kullanıcı eklediği kategorileri ekleme sırasına göre sırala (en alta)
  const userCats = categories.filter(cat => !cat.is_default || cat.is_default === false)
    .sort((a, b) => {
      // created_at varsa ona göre, yoksa id'ye göre sırala
      if ('created_at' in a && 'created_at' in b) {
        return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime();
      }
      return 0;
    });
  
  // Default kategorileri belirli sıraya göre sırala
  if (type === 'income') {
    const incomeOrder = [
      'Ürün Satış Gelirleri',
      'Hizmet Gelirleri',
      'Proje Gelirleri',
      'Sözleşme & Abonelik Gelirleri',
      'Varlık Kaynaklı Gelirler',
      'Finansal & Diğer Gelirler'
    ];
    defaultCats.sort((a, b) => {
      const indexA = incomeOrder.indexOf(a.name);
      const indexB = incomeOrder.indexOf(b.name);
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name, 'tr');
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else if (type === 'expense') {
    const expenseOrder = [
      'Personel Giderleri',
      'Ofis & Genel Yönetim Giderleri',
      'Araç & Lojistik Giderleri',
      'Operasyon & Saha Giderleri',
      'Pazarlama & Satış Giderleri',
      'Bilgi Teknolojileri & Yazılım Giderleri',
      'Finansman Giderleri',
      'Vergi & Resmi Yükümlülükler',
      'Bakım, Onarım & Destek Giderleri',
      'Yatırım (CAPEX) Giderleri'
    ];
    defaultCats.sort((a, b) => {
      const indexA = expenseOrder.indexOf(a.name);
      const indexB = expenseOrder.indexOf(b.name);
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name, 'tr');
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else {
    // Fallback: alfabetik sıralama
    defaultCats.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }
  
  return [...defaultCats, ...userCats];
}

