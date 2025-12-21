import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PurchaseOrdersPage extends ConsumerWidget {
  const PurchaseOrdersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: const Text('Satın Alma Siparişleri'),
        backgroundColor: const Color(0xFFF2F2F7),
        foregroundColor: const Color(0xFF000000),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              CupertinoIcons.cart_fill,
              size: 64,
              color: Color(0xFF8E8E93),
            ),
            SizedBox(height: 16),
            Text(
              'Satın Alma Siparişleri',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF8E8E93),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Yakında eklenecek',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF8E8E93),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

