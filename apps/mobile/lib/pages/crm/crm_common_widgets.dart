import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../../models/activity.dart';
import '../../models/opportunity.dart';
import '../../models/proposal.dart';
import '../../models/order.dart';

/// CRM sayfası için ortak widget'lar ve helper fonksiyonlar

// Stat Widgets
Widget buildStatBubble(String value, String label, IconData icon) {
  return AspectRatio(
    aspectRatio: 1.0,
    child: Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 9,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    ),
  );
}

Widget buildLoadingStats() {
  return Row(
    children: List.generate(
      4,
      (index) => Expanded(
        child: AspectRatio(
          aspectRatio: 1.0,
          child: Container(
            margin: EdgeInsets.only(left: index > 0 ? 10 : 0),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 1.5,
              ),
            ),
            child: const Center(
              child: CupertinoActivityIndicator(color: Colors.white),
            ),
          ),
        ),
      ),
    ),
  );
}

// State Widgets
Widget buildEmptyState(String message, IconData icon) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 48, color: Colors.grey[400]),
          ),
          const SizedBox(height: 24),
          Text(
            message,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

Widget buildLoadingState() {
  return Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFFF2F2F7),
            shape: BoxShape.circle,
          ),
          child: const CupertinoActivityIndicator(
            radius: 16,
            color: Color(0xFF8B2F2F),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Yükleniyor...',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.grey[600],
          ),
        ),
      ],
    ),
  );
}

Widget buildErrorState(String message) {
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
                  Colors.red.shade100.withValues(alpha: 0.5),
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
              color: Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            color: const Color(0xFF8B2F2F),
            borderRadius: BorderRadius.circular(10),
            onPressed: () {
              // Refresh
            },
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

// Status Helpers
Color getActivityStatusColor(String status) {
  switch (status) {
    case 'todo':
      return const Color(0xFFEF4444);
    case 'in_progress':
      return const Color(0xFFFF9500);
    case 'completed':
      return const Color(0xFF22C55E);
    case 'cancelled':
      return const Color(0xFF8E8E93);
    default:
      return const Color(0xFF8E8E93);
  }
}

String getActivityStatusName(String status) {
  switch (status) {
    case 'todo':
      return 'Yapılacak';
    case 'in_progress':
      return 'Devam Ediyor';
    case 'completed':
      return 'Tamamlandı';
    case 'cancelled':
      return 'İptal';
    default:
      return status;
  }
}

Color getOpportunityStatusColor(String status) {
  switch (status) {
    case 'new':
      return const Color(0xFF3B82F6);
    case 'qualified':
      return const Color(0xFF9333EA);
    case 'proposal':
      return const Color(0xFFFF9500);
    case 'negotiation':
      return const Color(0xFF3B82F6);
    case 'won':
      return const Color(0xFF22C55E);
    case 'lost':
      return const Color(0xFFEF4444);
    default:
      return const Color(0xFF8E8E93);
  }
}

String getOpportunityStatusName(String status) {
  switch (status) {
    case 'new':
      return 'Yeni';
    case 'qualified':
      return 'Görüşme';
    case 'proposal':
      return 'Teklif';
    case 'negotiation':
      return 'Müzakere';
    case 'won':
      return 'Kazanılan';
    case 'lost':
      return 'Kaybedildi';
    default:
      return status;
  }
}

Color getProposalStatusColor(String status) {
  if (status == 'draft' || status == 'taslak') {
    return const Color(0xFF8E8E93);
  } else if (status == 'pending' || status == 'onay_bekliyor') {
    return const Color(0xFFFF9500);
  } else if (status == 'sent' || status == 'gonderildi') {
    return const Color(0xFF3B82F6);
  } else if (status == 'accepted' || status == 'kabul_edildi') {
    return const Color(0xFF22C55E);
  } else if (status == 'rejected' || status == 'reddedildi') {
    return const Color(0xFFEF4444);
  } else if (status == 'expired' || status == 'suresi_dolmus') {
    return const Color(0xFFFF9500);
  }
  return const Color(0xFF8E8E93);
}

String getProposalStatusName(String status) {
  if (status == 'draft' || status == 'taslak') return 'Taslak';
  if (status == 'pending' || status == 'onay_bekliyor') return 'Onay Bekliyor';
  if (status == 'sent' || status == 'gonderildi') return 'Gönderildi';
  if (status == 'accepted' || status == 'kabul_edildi') return 'Kabul Edildi';
  if (status == 'rejected' || status == 'reddedildi') return 'Reddedildi';
  if (status == 'expired' || status == 'suresi_dolmus') return 'Süresi Dolmuş';
  return status;
}

Color getOrderStatusColor(String status) {
  switch (status) {
    case 'pending':
      return const Color(0xFFFF9500);
    case 'approved':
      return const Color(0xFF3B82F6);
    case 'processing':
      return const Color(0xFF9333EA);
    case 'shipping':
      return const Color(0xFF3B82F6);
    case 'delivered':
      return const Color(0xFF22C55E);
    case 'completed':
      return const Color(0xFF22C55E);
    default:
      return const Color(0xFF8E8E93);
  }
}

String getOrderStatusName(String status) {
  switch (status) {
    case 'pending':
      return 'Bekliyor';
    case 'approved':
      return 'Onaylandı';
    case 'processing':
      return 'İşleniyor';
    case 'shipping':
      return 'Kargo';
    case 'delivered':
      return 'Teslim';
    case 'completed':
      return 'Tamamlandı';
    default:
      return status;
  }
}

// Format Helpers
String formatCurrency(double value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  } else if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(1)}K';
  }
  return value.toStringAsFixed(0);
}

String formatDate(DateTime date) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final requestDate = DateTime(date.year, date.month, date.day);

  if (requestDate == today) {
    return 'Bugün';
  } else if (requestDate == today.add(const Duration(days: 1))) {
    return 'Yarın';
  } else if (requestDate.isBefore(today)) {
    return 'Gecikti';
  } else {
    return '${date.day}/${date.month}';
  }
}

