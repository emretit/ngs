import 'package:flutter/material.dart';

/// Responsive tasarım için yardımcı sınıf
/// iPad ve farklı ekran boyutları için uyarlanabilir değerler sağlar
class Responsive {
  /// Ekran boyutunu kontrol eder ve cihaz tipini belirler
  static bool isTablet(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final diagonal = _calculateDiagonal(size.width, size.height);
    // 7 inç ve üzeri ekranlar tablet olarak kabul edilir
    return diagonal >= 7.0;
  }

  static bool isPhone(BuildContext context) {
    return !isTablet(context);
  }

  /// Ekran genişliğine göre maksimum içerik genişliği döndürür
  static double getMaxContentWidth(BuildContext context) {
    if (isTablet(context)) {
      // Tablet için içerik maksimum 900px genişliğinde olsun
      return 900;
    }
    // Telefon için tam genişlik
    return double.infinity;
  }

  /// Responsive padding değeri döndürür
  /// Telefon: 16, Tablet: 24-32
  static double getPadding(BuildContext context) {
    return isTablet(context) ? 32.0 : 16.0;
  }

  /// Responsive horizontal padding
  static double getHorizontalPadding(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (isTablet(context)) {
      // Tablet için ekran genişliğine göre dinamik padding
      if (width > 1024) {
        return 64.0; // Çok geniş ekranlar
      }
      return 48.0; // Normal tablet
    }
    return 24.0; // Telefon
  }

  /// Card padding için responsive değer
  static double getCardPadding(BuildContext context) {
    return isTablet(context) ? 24.0 : 16.0;
  }

  /// Grid için kolon sayısı
  /// Telefon: 2, Tablet: 3-4
  static int getGridColumns(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1024) return 4;
    if (width > 768) return 3;
    return 2;
  }

  /// Liste için responsive spacing
  static double getListSpacing(BuildContext context) {
    return isTablet(context) ? 16.0 : 12.0;
  }

  /// Başlık font boyutu
  static double getTitleFontSize(BuildContext context) {
    return isTablet(context) ? 32.0 : 28.0;
  }

  /// Body font boyutu
  static double getBodyFontSize(BuildContext context) {
    return isTablet(context) ? 17.0 : 15.0;
  }

  /// İkon boyutu
  static double getIconSize(BuildContext context) {
    return isTablet(context) ? 28.0 : 24.0;
  }

  /// Buton yüksekliği
  static double getButtonHeight(BuildContext context) {
    return isTablet(context) ? 56.0 : 48.0;
  }

  /// Form field yüksekliği
  static double getFormFieldHeight(BuildContext context) {
    return isTablet(context) ? 56.0 : 48.0;
  }

  /// Responsive widget builder
  /// Telefon ve tablet için farklı widget'lar döndürebilir
  static Widget builder({
    required BuildContext context,
    required Widget phone,
    Widget? tablet,
  }) {
    if (isTablet(context) && tablet != null) {
      return tablet;
    }
    return phone;
  }

  /// Ekran diagonal uzunluğunu hesaplar (inç cinsinden, yaklaşık)
  static double _calculateDiagonal(double width, double height) {
    // PPI (pixels per inch) için ortalama değer kullanıyoruz
    const pixelsPerInch = 160.0; // Android'in baseline density'si
    final widthInches = width / pixelsPerInch;
    final heightInches = height / pixelsPerInch;
    // Pisagor teoremi ile diagonal hesapla
    return (widthInches * widthInches + heightInches * heightInches).abs().clamp(0, double.infinity);
  }

  /// SafeArea padding'i hesaba katarak maksimum genişlik döndürür
  static EdgeInsets getResponsivePadding(BuildContext context) {
    final horizontal = getHorizontalPadding(context);
    return EdgeInsets.symmetric(horizontal: horizontal, vertical: 16.0);
  }

  /// İki kolonlu layout için kullanılır
  /// Tablet: yan yana, Telefon: alt alta
  static Widget adaptiveRow({
    required BuildContext context,
    required Widget child1,
    required Widget child2,
    double spacing = 16.0,
  }) {
    if (isTablet(context)) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: child1),
          SizedBox(width: spacing),
          Expanded(child: child2),
        ],
      );
    }
    return Column(
      children: [
        child1,
        SizedBox(height: spacing),
        child2,
      ],
    );
  }

  /// Center ve max-width constraint birleşimi
  /// Tablet'te içeriği ortalar ve maksimum genişlik sınırı koyar
  static Widget centeredConstrainedBox({
    required BuildContext context,
    required Widget child,
    double? maxWidth,
  }) {
    final width = maxWidth ?? getMaxContentWidth(context);

    if (isTablet(context)) {
      return Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: width),
          child: child,
        ),
      );
    }

    return child;
  }
}
