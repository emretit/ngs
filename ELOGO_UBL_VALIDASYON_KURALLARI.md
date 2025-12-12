# e-Logo UBL Validasyon Kuralları

## Teslim Adresi (Delivery Address) Validasyon Kuralları

Bu doküman, e-Logo sisteminde e-Fatura gönderimi için teslim adresi alanlarının validasyon kurallarını içermektedir.

---

### 1. Teslim Adresi İLÇE BİLGİSİ (CitySubdivisionName)

**UBL Path:** `cac:Shipment/cac:Delivery/cac:DeliveryAddress/cbc:CitySubdivisionName`

**Alan:** Teslim adresi İLÇE BİLGİSİ (Delivery address DISTRICT INFORMATION)

**Kural:** 
- ✅ BULUNMALI VE BOŞ DEĞER İÇERMEMELİ

**Açıklama:** 
Teslim adresindeki ilçe bilgisi zorunludur ve boş bırakılamaz.

---

### 2. Teslim Adresi İL BİLGİSİ (CityName)

**UBL Path:** `cac:Shipment/cac:Delivery/cac:DeliveryAddress/cbc:CityName`

**Alan:** Teslim adresi İL BİLGİSİ (Delivery address CITY INFORMATION)

**Kural:** 
- ✅ BULUNMALI VE BOŞ DEĞER İÇERMEMELİDİR

**Açıklama:** 
Teslim adresindeki il bilgisi zorunludur ve boş bırakılamaz.

---

### 3. Teslim Adresi ÜLKE BİLGİSİ (Name)

**UBL Path:** `cac:Shipment/cac:Delivery/cac:DeliveryAddress/cbc:Name`

**Alan:** Teslim adresi ÜLKE BİLGİSİ (Delivery address COUNTRY INFORMATION)

**Kural:** 
- ✅ BULUNMALI VE BOŞ DEĞER İÇERMEMELİDİR

**Açıklama:** 
Teslim adresindeki ülke bilgisi zorunludur ve boş bırakılamaz.

---

### 4. Teslim Adresi POSTA KODU (PostalZone)

**UBL Path:** `cac:Shipment/cac:Delivery/cac:DeliveryAddress/cbc:PostalZone`

**Alan:** Teslim adresi POSTA KODU (Delivery address POSTAL CODE)

**Kural:** 
- ✅ BULUNMALI VE BOŞ DEĞER İÇERMEMELİDİR
- ✅ GEÇERLİ DEĞER İÇERMELİDİR

**POSTA KODU Kontrol Formatı:**

```
((0[1-9])|([1-7][0-9])|(8[0-1]))[0-9]{3}
```

**Format Açıklaması:**

Posta kodu 5 haneli bir sayı olmalıdır:

- **İlk 2 hane:** Türkiye il kodları (01-81 arası)
  - `01-09`: İlk 9 il (Adana, Adıyaman, vb.)
  - `10-79`: Diğer iller
  - `80-81`: Son iki il
- **Son 3 hane:** Herhangi bir sayısal değer (000-999)

**Geçerli Örnekler:**
- `34000` ✅ (İstanbul - 34)
- `06000` ✅ (Ankara - 06)
- `35000` ✅ (İzmir - 35)
- `81000` ✅ (Düzce - 81)

**Geçersiz Örnekler:**
- `82000` ❌ (82 geçersiz il kodu)
- `00000` ❌ (00 geçersiz il kodu)
- `1234` ❌ (4 haneli - eksik)
- `123456` ❌ (6 haneli - fazla)
- `ABC12` ❌ (Harf içeriyor)

---

## Özet

Tüm teslim adresi alanları **zorunludur** ve **boş bırakılamaz**. Posta kodu için ek olarak format kontrolü yapılmalıdır.

**Zorunlu Alanlar:**
1. ✅ İlçe (CitySubdivisionName)
2. ✅ İl (CityName)
3. ✅ Ülke (Name)
4. ✅ Posta Kodu (PostalZone) - Format kontrolü ile

---

**Not:** Bu validasyon kuralları e-Logo sistemine e-Fatura gönderilmeden önce kontrol edilmelidir. Geçersiz adres bilgileri ile gönderilen faturalar GİB tarafından reddedilebilir.

