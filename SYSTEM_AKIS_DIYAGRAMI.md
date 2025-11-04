# PAFTA Kullanıcı-Çalışan Eşleştirme Mantığı

## 🔄 Akış Diyagramı

### Senaryo 1: Normal Signup → Sonra Çalışan Ekleme

```
1. Kullanıcı Signup Yapar
   └─> auth.users oluşur
   └─> handle_new_user trigger çalışır
       ├─> invited_by_company_id? → YOK
       ├─> Email ile çalışan var mı? → YOK
       └─> YENİ COMPANY OLUŞTUR
           └─> Profile: owner rolü ile

2. Admin Çalışan Ekler (Aynı Email)
   └─> employees tablosuna kayıt (user_id = NULL)
   └─> invite-user fonksiyonu çağrılır
       └─> Davet emaili gönderilir

3. Kullanıcı Davet Linkine Tıklar
   └─> handle_new_user trigger çalışır
       ├─> invited_by_company_id? → EVET
       ├─> Email ile çalışan var mı? → EVET ✅
       └─> OTOMATIK EŞLEŞTİRME
           ├─> employees.user_id = user.id
           ├─> profiles.employee_id = employee.id
           └─> user_roles: admin rolü
```

### Senaryo 2: Çalışan Eklendikten Sonra Signup

```
1. Admin Çalışan Ekler
   └─> employees tablosuna kayıt (user_id = NULL)

2. Çalışan Signup Yapar (Aynı Email)
   └─> auth.users oluşur
   └─> handle_new_user trigger çalışır
       ├─> invited_by_company_id? → YOK
       ├─> Email ile çalışan var mı? → EVET ✅
       └─> OTOMATIK EŞLEŞTİRME
           ├─> Çalışanın company_id kullanılır
           ├─> employees.user_id = user.id
           ├─> profiles.employee_id = employee.id
           └─> user_roles: admin rolü
```

### Senaryo 3: Davet Edilen Kullanıcı

```
1. Admin Kullanıcı Davet Eder
   └─> invite-user fonksiyonu çağrılır
       └─> invited_by_company_id metadata eklenir

2. Kullanıcı Davet Linkine Tıklar
   └─> handle_new_user trigger çalışır
       ├─> invited_by_company_id? → EVET
       ├─> Email ile çalışan var mı?
       │   ├─> YOK → Davet eden company kullanılır
       │   └─> EVET ✅ → Çalışanın company_id kullanılır
       └─> EŞLEŞTİRME
           ├─> employees.user_id = user.id (varsa)
           ├─> profiles.employee_id = employee.id (varsa)
           └─> user_roles: admin rolü
```

## 🎯 Önemli Noktalar

1. **Email Eşleştirmesi**: Email üzerinden otomatik eşleştirme yapılır
2. **Çalışan Önceliği**: Eğer email ile eşleşen çalışan varsa, çalışanın company_id'si kullanılır
3. **Davet Önceliği**: Davet edilen kullanıcılar admin rolü alır
4. **Normal Signup**: Yeni company oluşturur ve owner rolü verir
5. **Otomatik Eşleştirme**: `handle_new_user` fonksiyonu tüm mantığı yönetir

## 📋 handle_new_user Fonksiyonu Mantığı

```
IF email ile eşleşen çalışan VAR VE user_id NULL İSE:
    ├─> Çalışanın company_id'sini kullan
    ├─> employees.user_id = user.id güncelle
    ├─> profiles.employee_id = employee.id set et
    └─> user_roles: admin rolü ver

ELSE IF invited_by_company_id VAR İSE:
    ├─> Davet eden company_id kullan
    └─> user_roles: admin rolü ver

ELSE (Normal Signup):
    ├─> Yeni company oluştur
    └─> user_roles: owner rolü ver
```

