/// Cache Service - TTL (Time To Live) ile önbellekleme mekanizması
/// API çağrılarını azaltmak ve performansı artırmak için kullanılır
class CacheService {
  static final Map<String, CacheEntry> _cache = {};

  /// Cache'den veri getir
  /// TTL süresi dolmuşsa null döner ve cache'den siler
  static T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null || entry.isExpired) {
      if (entry != null) {
        _cache.remove(key);
      }
      return null;
    }
    return entry.data as T;
  }

  /// Cache'e veri kaydet
  /// [ttl] varsayılan olarak 5 dakika
  static void set<T>(String key, T data, {Duration ttl = const Duration(minutes: 5)}) {
    _cache[key] = CacheEntry(data, DateTime.now().add(ttl));
  }

  /// Belirli bir pattern'e uyan cache key'lerini temizle
  /// Örnek: invalidate('activities_') -> 'activities_company1', 'activities_company2' gibi tüm key'leri siler
  static void invalidate(String keyPattern) {
    _cache.removeWhere((key, _) => key.contains(keyPattern));
  }

  /// Belirli bir key'i cache'den sil
  static void remove(String key) {
    _cache.remove(key);
  }

  /// Tüm cache'i temizle
  static void clear() {
    _cache.clear();
  }

  /// Cache'deki toplam entry sayısını döndür
  static int get size => _cache.length;

  /// Cache'deki expired entry'leri temizle (manuel cleanup)
  static void cleanupExpired() {
    _cache.removeWhere((_, entry) => entry.isExpired);
  }
}

/// Cache entry - veri ve expire zamanını tutar
class CacheEntry {
  final dynamic data;
  final DateTime expiresAt;

  CacheEntry(this.data, this.expiresAt);

  /// Entry'nin süresi dolmuş mu?
  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

