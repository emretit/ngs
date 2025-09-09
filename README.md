# PAFTA - İş Yönetim Sistemi

Vite + React + TypeScript + Tailwind + shadcn/ui + Supabase ile geliştirilmiş kapsamlı iş yönetim sistemi.

## PDF Export ve Şablon Sistemi

Bu proje React-PDF tabanlı quote/teklif export sistemi içerir.

### Gerekli Ortam Değişkenleri

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Kurulumu

1. **Storage Bucket**: `documents` adında public bir bucket oluşturun
2. **Veritabanı**: `pdf_templates` tablosu otomatik olarak migration ile oluşturulur

### PDF Şablonları

#### İlk Şablon Oluşturma

1. Uygulamaya giriş yapın
2. **Satış Yönetimi > PDF Şablonları** menüsüne gidin
3. Şablon düzenleyiciyi kullanarak özelleştirin
4. "Kaydet" ve "Varsayılan Yap" butonlarını kullanın

#### Şablon Ayarları

- **Sayfa Ayarları**: A4, padding, font boyutu
- **Header**: Logo, başlık, geçerlilik tarihi
- **Müşteri Bloğu**: Gösterilecek alanları seçin
- **Tablo Kolonları**: Her kolonu ayrı ayrı göster/gizle ve etiketleri düzenle
- **Toplamlar**: Brüt, indirim, vergi, net toplamları göster/gizle
- **Notlar**: Giriş ve alt notlar

#### Kullanım

1. **Teklifler** sayfasında bir teklif seçin
2. Sağ panelde **PDF Şablonu** dropdown'undan şablon seçin
3. **PDF İndir** ile dosyayı indirin
4. **Storage'a Yükle** ile Supabase storage'a kaydedin

### Project info

**URL**: https://pafta.app

## How can you edit this code?

There are several ways of editing your application.

**Use GPT Engineer**

Simply visit the GPT Engineer project at [GPT Engineer](https://gptengineer.app/projects/7e753aa5-e867-4890-ab18-f97d53f001e8/improve) and start prompting.

Changes made via gptengineer.app will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in the GPT Engineer UI.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

All GPT Engineer projects can be deployed directly via the GPT Engineer app.

Simply visit your project at [GPT Engineer](https://gptengineer.app/projects/7e753aa5-e867-4890-ab18-f97d53f001e8/improve) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.gptengineer.app/tips-tricks/custom-domain/)
