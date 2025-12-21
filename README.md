# Pafta Monorepo

Bu proje bir monorepo yapısında organize edilmiştir.

## Yapı

```
pafta/
├── [web dosyaları root'ta]  # React web uygulaması (npm only) - Lovable root olarak görür
├── apps/
│   └── mobile/              # Flutter mobil uygulaması (flutter CLI only)
└── [docs ve diğer dosyalar]
```

## Kurallar

- **Root** → React web uygulaması (npm only) - Lovable direkt root'u kullanır
- **apps/mobile** → Flutter mobil uygulaması (flutter CLI only)
- Lovable ve Netlify root dizini kullanır
- Root'tan flutter komutları çalıştırılmaz
- `apps/mobile` içinde npm komutları çalıştırılmaz
- Web ve mobile tamamen izole edilmiştir

## Web Uygulaması (Root)

```bash
# Root dizininde
npm install
npm run dev
npm run build
```

## Mobil Uygulama (apps/mobile)

```bash
cd apps/mobile
flutter pub get
flutter run
flutter build
```

## Notlar

- Web uygulaması root dizinindedir (Lovable için)
- Mobile uygulaması `apps/mobile` klasöründedir
- Her app kendi bağımlılıklarını yönetir
- Her app kendi Supabase yapılandırmasına sahiptir
