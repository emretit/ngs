# Versiyonlama Planı

## Genel Bilgi
- **Başlangıç Tarihi:** 10 Kasım 2025
- **Başlangıç Versiyonu:** 0.1.0
- **Hedef Tarih:** 1 Ocak 2026
- **Hedef Versiyon:** 1.0.0
- **Toplam Gün:** 52 gün

## Versiyonlama Stratejisi

### Her Gün Versiyon Artışı
- Her gün patch version (3. rakam) artacak
- Her 5 günde bir minor version (2. rakam) artacak
- 31 Aralık 2025'te: **0.9.9**
- 1 Ocak 2026'da: **1.0.0**

### Detaylı Plan

#### 0.1.x Serisi (5 gün)
- Gün 1 (10 Kasım): 0.1.0
- Gün 2 (11 Kasım): 0.1.1
- Gün 3 (12 Kasım): 0.1.2
- Gün 4 (13 Kasım): 0.1.3
- Gün 5 (14 Kasım): 0.1.4

#### 0.2.x Serisi (5 gün)
- Gün 6 (15 Kasım): 0.2.0
- Gün 7 (16 Kasım): 0.2.1
- Gün 8 (17 Kasım): 0.2.2
- Gün 9 (18 Kasım): 0.2.3
- Gün 10 (19 Kasım): 0.2.4

#### 0.3.x Serisi (5 gün)
- Gün 11 (20 Kasım): 0.3.0
- Gün 12 (21 Kasım): 0.3.1
- Gün 13 (22 Kasım): 0.3.2
- Gün 14 (23 Kasım): 0.3.3
- Gün 15 (24 Kasım): 0.3.4

#### 0.4.x Serisi (5 gün)
- Gün 16 (25 Kasım): 0.4.0
- Gün 17 (26 Kasım): 0.4.1
- Gün 18 (27 Kasım): 0.4.2
- Gün 19 (28 Kasım): 0.4.3
- Gün 20 (29 Kasım): 0.4.4

#### 0.5.x Serisi (5 gün)
- Gün 21 (30 Kasım): 0.5.0
- Gün 22 (1 Aralık): 0.5.1
- Gün 23 (2 Aralık): 0.5.2
- Gün 24 (3 Aralık): 0.5.3
- Gün 25 (4 Aralık): 0.5.4

#### 0.6.x Serisi (5 gün)
- Gün 26 (5 Aralık): 0.6.0
- Gün 27 (6 Aralık): 0.6.1
- Gün 28 (7 Aralık): 0.6.2
- Gün 29 (8 Aralık): 0.6.3
- Gün 30 (9 Aralık): 0.6.4

#### 0.7.x Serisi (5 gün)
- Gün 31 (10 Aralık): 0.7.0
- Gün 32 (11 Aralık): 0.7.1
- Gün 33 (12 Aralık): 0.7.2
- Gün 34 (13 Aralık): 0.7.3
- Gün 35 (14 Aralık): 0.7.4

#### 0.8.x Serisi (5 gün)
- Gün 36 (15 Aralık): 0.8.0
- Gün 37 (16 Aralık): 0.8.1
- Gün 38 (17 Aralık): 0.8.2
- Gün 39 (18 Aralık): 0.8.3
- Gün 40 (19 Aralık): 0.8.4

#### 0.9.x Serisi (12 gün)
- Gün 41 (20 Aralık): 0.9.0
- Gün 42 (21 Aralık): 0.9.1
- Gün 43 (22 Aralık): 0.9.2
- Gün 44 (23 Aralık): 0.9.3
- Gün 45 (24 Aralık): 0.9.4
- Gün 46 (25 Aralık): 0.9.5
- Gün 47 (26 Aralık): 0.9.6
- Gün 48 (27 Aralık): 0.9.7
- Gün 49 (28 Aralık): 0.9.8
- Gün 50 (29 Aralık): 0.9.9
- Gün 51 (30 Aralık): 0.9.9 (değişiklik yok)
- Gün 52 (31 Aralık): 0.9.9 (değişiklik yok)

#### Yılbaşı
- **1 Ocak 2026:** 1.0.0 🎉

## Versiyon Güncelleme Adımları

Her gün aşağıdaki adımları takip edin:

1. `package.json` dosyasındaki `version` alanını güncelleyin
2. Değişiklikleri commit edin: `git commit -m "chore: bump version to X.X.X"`
3. Push edin: `git push`

## Notlar

- Her gün mutlaka versiyon güncellenmelidir
- 31 Aralık'ta 0.9.9'da kalınacak (son 2 gün değişiklik yok)
- 1 Ocak'ta 1.0.0'a geçilecek
- Bu plan 52 günlük süreç için hazırlanmıştır

## Hızlı Referans

```bash
# Bugünün versiyonunu öğrenmek için:
cat package.json | grep version

# Versiyonu güncellemek için:
# package.json içinde "version": "X.X.X" değerini değiştirin
```

