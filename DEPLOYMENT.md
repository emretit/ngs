# Production Deployment Rehberi

## Environment Variables (Ortam Değişkenleri)

Bu proje production'da çalışması için aşağıdaki environment variable'ların ayarlanması gerekir.

### Gerekli Environment Variables

```env
VITE_SUPABASE_URL=https://vwhwufnckpqirxptwncw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROQ_API_KEY=gsk_...
```

## Deployment Platformları

### 1. Vercel

1. **Projeyi Vercel'e bağlayın:**
   - https://vercel.com adresine gidin
   - GitHub repository'nizi import edin

2. **Environment Variables ekleyin:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Aşağıdaki değişkenleri ekleyin:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GROQ_API_KEY`

3. **Deploy:**
   - Vercel otomatik olarak deploy eder
   - Her push'ta otomatik deploy yapılır

### 2. Netlify

1. **Projeyi Netlify'e bağlayın:**
   - https://netlify.com adresine gidin
   - GitHub repository'nizi import edin

2. **Build ayarları:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables ekleyin:**
   - Netlify Dashboard → Site settings → Environment variables
   - Aşağıdaki değişkenleri ekleyin:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GROQ_API_KEY`

### 3. Cloudflare Pages

1. **Projeyi Cloudflare'e bağlayın:**
   - Cloudflare Dashboard → Pages → Create a project

2. **Build ayarları:**
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **Environment Variables ekleyin:**
   - Project Settings → Environment variables
   - Aşağıdaki değişkenleri ekleyin:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GROQ_API_KEY`

### 4. Supabase Edge Functions (Backend)

Edge Functions için ayrı environment variable'lar gerekir:

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **Edge Functions Environment Variables:**
   - Project Settings → Edge Functions → Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` ekleyin (zaten mevcut olmalı)

## Önemli Notlar

### ⚠️ Güvenlik

- `.env` dosyası **ASLA** Git'e commit edilmemeli (zaten `.gitignore`'da)
- Production'da environment variable'lar platform üzerinden ayarlanmalı
- `VITE_` prefix'i olan değişkenler **client-side**'da görünür (bundle'a dahil edilir)
- `SUPABASE_SERVICE_ROLE_KEY` sadece Edge Functions'da kullanılmalı, frontend'de ASLA kullanılmamalı

### 🔄 Build Process

Vite build sırasında environment variable'ları bundle'a dahil eder:

```bash
# Development
npm run dev

# Production build
npm run build
```

Build sonrası `dist/` klasöründe production-ready dosyalar oluşur.

### 📝 Environment Variable Naming

Vite'da environment variable'lar `VITE_` prefix'i ile başlamalı:

- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_GROQ_API_KEY`
- ❌ `SUPABASE_URL` (Vite tarafından okunmaz)

### 🚀 Deployment Checklist

- [ ] Environment variable'lar platform'da ayarlandı
- [ ] Build başarılı (`npm run build`)
- [ ] Production URL'de test edildi
- [ ] Supabase bağlantısı çalışıyor
- [ ] Groq API çalışıyor
- [ ] Edge Functions environment variable'ları ayarlandı

## Sorun Giderme

### Environment Variable'lar çalışmıyor

1. Variable isminin `VITE_` ile başladığından emin olun
2. Build'i yeniden yapın (`npm run build`)
3. Development server'ı yeniden başlatın (`npm run dev`)

### Production'da Supabase bağlantı hatası

1. `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ayarlandığından emin olun
2. Supabase Dashboard'da RLS (Row Level Security) politikalarını kontrol edin
3. CORS ayarlarını kontrol edin

### Groq API çalışmıyor

1. `VITE_GROQ_API_KEY` ayarlandığından emin olun
2. Groq Console'da API key'in aktif olduğunu kontrol edin
3. Rate limit'i kontrol edin (ücretsiz tier: 30 istek/dakika)

