import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class PaftaLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final Color? color;
  final bool showText;

  const PaftaLogo({
    super.key,
    this.width,
    this.height,
    this.color,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    // Boyut değerlerini güvenli hale getir
    final safeWidth = (width ?? 120).clamp(1.0, double.infinity);
    final safeHeight = (height ?? 40).clamp(1.0, double.infinity);
    
    return SvgPicture.asset(
      'assets/images/pafta_logo.svg',
      width: safeWidth,
      height: safeHeight,
      colorFilter: color != null 
          ? ColorFilter.mode(color!, BlendMode.srcIn)
          : null,
    );
  }
}

class PaftaIcon extends StatelessWidget {
  final double? size;
  final Color? color;

  const PaftaIcon({
    super.key,
    this.size,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    // Boyut değerlerini güvenli hale getir
    final safeSize = (size ?? 60).clamp(1.0, double.infinity);
    
    return Container(
      width: safeSize,
      height: safeSize,
      decoration: BoxDecoration(
        color: color ?? Theme.of(context).primaryColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8.0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Icon(
        Icons.build_circle,
        color: Colors.white,
        size: (safeSize * 0.5).clamp(16.0, 48.0), // Icon boyutunu container'a göre ayarla
      ),
    );
  }
}
