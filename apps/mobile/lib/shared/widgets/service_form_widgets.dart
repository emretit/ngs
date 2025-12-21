import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

/// Servis sayfalarında kullanılan ortak UI sabitleri
class ServiceFormStyles {
  // Ana renkler
  static const Color primaryColor = Color(0xFFB73D3D);
  static const Color primaryGradientStart = Color(0xFFB73D3D);
  static const Color primaryGradientEnd = Color(0xFF8B2F2F);
  static const Color backgroundColor = Color(0xFFF2F2F7);
  static const Color cardColor = Colors.white;
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF8E8E93);
  static const Color inputBackground = Color(0xFFF2F2F7);
  
  // Durum renkleri
  static const Color successColor = Color(0xFF10B981);
  static const Color warningColor = Color(0xFFFF9500);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color infoColor = Color(0xFF3B82F6);
  static const Color purpleColor = Color(0xFF8B5CF6);
  
  // Border radius
  static const double cardRadius = 16.0;
  static const double inputRadius = 12.0;
  static const double buttonRadius = 12.0;
  static const double badgeRadius = 8.0;
  
  // Spacing
  static const double sectionSpacing = 16.0;
  static const double itemSpacing = 12.0;
  static const double cardPadding = 16.0;
  
  // Font sizes
  static const double titleSize = 15.0;
  static const double bodySize = 14.0;
  static const double labelSize = 12.0;
  static const double captionSize = 11.0;
}

/// Section kart widget'ı - tüm formlarda kullanılır
class ServiceFormSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final List<Widget> children;
  final Widget? trailing;

  const ServiceFormSection({
    super.key,
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.children,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ServiceFormStyles.cardColor,
        borderRadius: BorderRadius.circular(ServiceFormStyles.cardRadius),
        border: Border.all(
          color: Colors.grey.withOpacity(0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 1),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    icon,
                    color: iconColor,
                    size: 13,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: ServiceFormStyles.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }
}

/// Modern text field widget'ı
class ServiceFormTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData icon;
  final int maxLines;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final bool readOnly;
  final VoidCallback? onTap;

  const ServiceFormTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    required this.icon,
    this.maxLines = 1,
    this.keyboardType,
    this.validator,
    this.readOnly = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ServiceFormStyles.inputBackground,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: validator,
        readOnly: readOnly,
        onTap: onTap,
        style: const TextStyle(
          fontSize: ServiceFormStyles.bodySize,
          color: ServiceFormStyles.textPrimary,
        ),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: const TextStyle(
            fontSize: ServiceFormStyles.labelSize,
            color: ServiceFormStyles.textSecondary,
            fontWeight: FontWeight.w500,
          ),
          hintStyle: TextStyle(
            fontSize: ServiceFormStyles.bodySize,
            color: ServiceFormStyles.textSecondary.withOpacity(0.7),
          ),
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 12, right: 8),
            child: Icon(
              icon,
              color: ServiceFormStyles.primaryColor,
              size: 20,
            ),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 44),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}

/// Modern dropdown widget'ı
class ServiceFormDropdown<T> extends StatelessWidget {
  final T? value;
  final String label;
  final IconData icon;
  final List<DropdownMenuItem<T>> items;
  final void Function(T?)? onChanged;
  final String? hint;

  const ServiceFormDropdown({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    required this.items,
    required this.onChanged,
    this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ServiceFormStyles.inputBackground,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: DropdownButtonFormField<T>(
        value: value,
        onChanged: onChanged,
        style: const TextStyle(
          fontSize: ServiceFormStyles.bodySize,
          color: ServiceFormStyles.textPrimary,
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(
            fontSize: ServiceFormStyles.labelSize,
            color: ServiceFormStyles.textSecondary,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 12, right: 8),
            child: Icon(
              icon,
              color: ServiceFormStyles.primaryColor,
              size: 20,
            ),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 44),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
        hint: hint != null
            ? Text(
                hint!,
                style: TextStyle(
                  fontSize: ServiceFormStyles.bodySize,
                  color: ServiceFormStyles.textSecondary.withOpacity(0.7),
                ),
              )
            : null,
        items: items,
        isExpanded: true,
        icon: const Icon(
          CupertinoIcons.chevron_down,
          size: 16,
          color: ServiceFormStyles.textSecondary,
        ),
      ),
    );
  }
}

/// Tarih seçici widget'ı
class ServiceFormDateSelector extends StatelessWidget {
  final String label;
  final DateTime? date;
  final VoidCallback onTap;
  final IconData icon;
  final bool isOptional;

  const ServiceFormDateSelector({
    super.key,
    required this.label,
    required this.date,
    required this.onTap,
    required this.icon,
    this.isOptional = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: ServiceFormStyles.inputBackground,
          borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
          border: Border.all(
            color: Colors.grey.withOpacity(0.1),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Row(
          children: [
            Icon(
              icon,
              color: ServiceFormStyles.primaryColor,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: ServiceFormStyles.labelSize,
                      color: ServiceFormStyles.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    date != null
                        ? '${date!.day.toString().padLeft(2, '0')}.${date!.month.toString().padLeft(2, '0')}.${date!.year}'
                        : isOptional
                            ? 'Opsiyonel'
                            : 'Tarih seçin',
                    style: TextStyle(
                      fontSize: ServiceFormStyles.bodySize,
                      color: date != null
                          ? ServiceFormStyles.textPrimary
                          : ServiceFormStyles.textSecondary.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              CupertinoIcons.chevron_right,
              size: 16,
              color: ServiceFormStyles.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

/// Saat seçici widget'ı
class ServiceFormTimeSelector extends StatelessWidget {
  final String label;
  final TimeOfDay? time;
  final VoidCallback onTap;
  final IconData icon;
  final bool enabled;

  const ServiceFormTimeSelector({
    super.key,
    required this.label,
    required this.time,
    required this.onTap,
    required this.icon,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          decoration: BoxDecoration(
            color: ServiceFormStyles.inputBackground,
            borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
            border: Border.all(
              color: Colors.grey.withOpacity(0.1),
              width: 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          child: Row(
            children: [
              Icon(
                icon,
                color: ServiceFormStyles.primaryColor,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: ServiceFormStyles.labelSize,
                        color: ServiceFormStyles.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      time != null
                          ? '${time!.hour.toString().padLeft(2, '0')}:${time!.minute.toString().padLeft(2, '0')}'
                          : 'Saat seçin',
                      style: TextStyle(
                        fontSize: ServiceFormStyles.bodySize,
                        color: time != null
                            ? ServiceFormStyles.textPrimary
                            : ServiceFormStyles.textSecondary.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                CupertinoIcons.chevron_right,
                size: 16,
                color: ServiceFormStyles.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Durum badge widget'ı
class ServiceStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final bool showDot;

  const ServiceStatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.showDot = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 4,
              height: 4,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Öncelik badge widget'ı
class ServicePriorityBadge extends StatelessWidget {
  final String label;
  final Color color;

  const ServicePriorityBadge({
    super.key,
    required this.label,
    required this.color,
  });

  String get _emoji {
    switch (label) {
      case 'Acil':
        return '🔴';
      case 'Yüksek':
        return '🟠';
      case 'Normal':
        return '🟡';
      case 'Düşük':
        return '🟢';
      default:
        return '⚪';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_emoji, style: const TextStyle(fontSize: 9)),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Birincil buton
class ServicePrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? color;

  const ServicePrimaryButton({
    super.key,
    required this.label,
    this.icon,
    required this.onPressed,
    this.isLoading = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: CupertinoButton(
        onPressed: isLoading ? null : onPressed,
        color: color ?? ServiceFormStyles.primaryColor,
        borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: isLoading
            ? const CupertinoActivityIndicator(color: Colors.white)
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: ServiceFormStyles.titleSize,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// İkincil buton
class ServiceSecondaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? color;

  const ServiceSecondaryButton({
    super.key,
    required this.label,
    this.icon,
    required this.onPressed,
    this.isLoading = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final buttonColor = color ?? Colors.grey;
    return SizedBox(
      width: double.infinity,
      child: CupertinoButton(
        onPressed: isLoading ? null : onPressed,
        color: buttonColor,
        borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: isLoading
            ? const CupertinoActivityIndicator(color: Colors.white)
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: ServiceFormStyles.titleSize,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Bilgi satırı widget'ı
class ServiceInfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final IconData? icon;

  const ServiceInfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 16,
              color: ServiceFormStyles.textSecondary,
            ),
            const SizedBox(width: 8),
          ],
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: ServiceFormStyles.labelSize,
                color: ServiceFormStyles.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: valueColor ?? ServiceFormStyles.textPrimary,
                fontWeight: valueColor != null ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Boş durum widget'ı
class ServiceEmptyState extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final Color? iconColor;
  final String? buttonLabel;
  final VoidCallback? onButtonPressed;

  const ServiceEmptyState({
    super.key,
    required this.title,
    this.subtitle,
    required this.icon,
    this.iconColor,
    this.buttonLabel,
    this.onButtonPressed,
  });

  @override
  Widget build(BuildContext context) {
    final color = iconColor ?? ServiceFormStyles.primaryColor;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(40),
              ),
              child: Icon(
                icon,
                size: 40,
                color: color,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: ServiceFormStyles.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: const TextStyle(
                  fontSize: ServiceFormStyles.bodySize,
                  color: ServiceFormStyles.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (buttonLabel != null && onButtonPressed != null) ...[
              const SizedBox(height: 24),
              CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                color: color,
                borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
                onPressed: onButtonPressed,
                child: Text(
                  buttonLabel!,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Hata durumu widget'ı
class ServiceErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const ServiceErrorState({
    super.key,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.red.shade50,
                    Colors.red.shade100.withOpacity(0.5),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                CupertinoIcons.exclamationmark_triangle,
                size: 48,
                color: Colors.red[600],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Bir hata oluştu',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: ServiceFormStyles.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CupertinoButton(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              color: ServiceFormStyles.primaryColor,
              borderRadius: BorderRadius.circular(ServiceFormStyles.buttonRadius),
              onPressed: onRetry,
              child: const Text(
                'Tekrar Dene',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Not öğesi widget'ı
class ServiceNoteItem extends StatelessWidget {
  final String note;
  final VoidCallback? onDelete;

  const ServiceNoteItem({
    super.key,
    required this.note,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ServiceFormStyles.inputBackground,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            CupertinoIcons.doc_text,
            size: 16,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              note,
              style: const TextStyle(
                fontSize: ServiceFormStyles.bodySize,
                color: ServiceFormStyles.textPrimary,
                height: 1.4,
              ),
            ),
          ),
          if (onDelete != null)
            GestureDetector(
              onTap: onDelete,
              child: Icon(
                CupertinoIcons.xmark_circle_fill,
                size: 18,
                color: Colors.grey[400],
              ),
            ),
        ],
      ),
    );
  }
}

/// Ürün öğesi widget'ı
class ServiceProductItem extends StatelessWidget {
  final String name;
  final String? description;
  final double quantity;
  final String unit;
  final double? price;
  final VoidCallback? onDelete;

  const ServiceProductItem({
    super.key,
    required this.name,
    this.description,
    required this.quantity,
    required this.unit,
    this.price,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(ServiceFormStyles.inputRadius),
        border: Border.all(
          color: Colors.grey.withOpacity(0.15),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: ServiceFormStyles.successColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              CupertinoIcons.cube_box,
              color: ServiceFormStyles.successColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: ServiceFormStyles.titleSize,
                    color: ServiceFormStyles.textPrimary,
                  ),
                ),
                if (description != null && description!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    description!,
                    style: const TextStyle(
                      fontSize: ServiceFormStyles.captionSize,
                      color: ServiceFormStyles.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: ServiceFormStyles.infoColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$quantity $unit',
                        style: const TextStyle(
                          fontSize: ServiceFormStyles.captionSize,
                          fontWeight: FontWeight.w600,
                          color: ServiceFormStyles.infoColor,
                        ),
                      ),
                    ),
                    if (price != null && price! > 0) ...[
                      const SizedBox(width: 8),
                      Text(
                        '${price!.toStringAsFixed(2)} ₺',
                        style: const TextStyle(
                          fontSize: ServiceFormStyles.labelSize,
                          fontWeight: FontWeight.w600,
                          color: ServiceFormStyles.successColor,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (onDelete != null)
            CupertinoButton(
              padding: EdgeInsets.zero,
              minSize: 0,
              onPressed: onDelete,
              child: const Icon(
                CupertinoIcons.delete,
                color: ServiceFormStyles.errorColor,
                size: 20,
              ),
            ),
        ],
      ),
    );
  }
}

/// Bölüm başlığı widget'ı
class ServiceSectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const ServiceSectionHeader({
    super.key,
    required this.title,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: ServiceFormStyles.bodySize,
              fontWeight: FontWeight.w600,
              color: ServiceFormStyles.textPrimary,
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Divider widget'ı
class ServiceDivider extends StatelessWidget {
  final double height;

  const ServiceDivider({super.key, this.height = 24});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: height / 2),
      child: const Divider(height: 1, color: Color(0xFFE5E5EA)),
    );
  }
}
