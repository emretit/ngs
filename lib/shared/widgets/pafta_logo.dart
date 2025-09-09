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
    return SvgPicture.asset(
      'assets/images/pafta_logo.svg',
      width: width ?? 120,
      height: height ?? 40,
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
    return Container(
      width: size ?? 60,
      height: size ?? 60,
      decoration: BoxDecoration(
        color: color ?? Theme.of(context).primaryColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Icon(
        Icons.build_circle,
        color: Colors.white,
        size: 30,
      ),
    );
  }
}
