import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    
    ref.listen<AuthState>(authStateProvider, (previous, next) {
      if (next.isAuthenticated) {
        context.go('/home');
      }
      if (next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.errorMessage!)),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            // Ana içerik
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 60), // Home butonu için boşluk
                      
                      // Logo
                      _buildLogo(context),
                      const SizedBox(height: 32),
                      
                      // Başlık ve Açıklama (kartın dışında)
                      Text(
                        'Hesabınıza Giriş Yapın',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF000000),
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      Text(
                        'PAFTA platformuna hoş geldiniz',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFF8E8E93),
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Form Kartı - Sadece input alanları ve buton
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFFE5E5EA),
                            width: 1,
                          ),
                        ),
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Email Field
                            _buildEmailField(context),
                            const SizedBox(height: 20),
                            
                            // Password Field
                            _buildPasswordField(context),
                            const SizedBox(height: 24),
                            
                            // Login Button
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: authState.isLoading ? null : _signIn,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF8B2F2F), // Giriş butonu rengi
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: authState.isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'Giriş Yap',
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 16,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Icon(
                                            CupertinoIcons.arrow_right,
                                            color: Colors.white,
                                            size: 18,
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Kayıt ol linki
                      Center(
                        child: Column(
                          children: [
                            RichText(
                              text: TextSpan(
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF8E8E93),
                                  fontSize: 14,
                                ),
                                children: [
                                  const TextSpan(text: 'Henüz bir hesabınız yok mu? '),
                                  WidgetSpan(
                                    child: GestureDetector(
                                      onTap: () {
                                        // TODO: Kayıt sayfasına yönlendir
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Kayıt özelliği yakında eklenecek'),
                                          ),
                                        );
                                      },
                                      child: Text(
                                        'Hemen Kaydolun',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: const Color(0xFF8B2F2F),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            RichText(
                              text: TextSpan(
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF8E8E93),
                                  fontSize: 14,
                                ),
                                children: [
                                  const TextSpan(text: 'Şifremi Unuttum? '),
                                  WidgetSpan(
                                    child: GestureDetector(
                                      onTap: () {
                                        // TODO: Şifre sıfırlama sayfasına yönlendir
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Şifre sıfırlama özelliği yakında eklenecek'),
                                          ),
                                        );
                                      },
                                      child: Text(
                                        'Şifreyi Sıfırla',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: const Color(0xFF8B2F2F),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Üst sol köşe home butonu
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFFE5E5EA),
                    width: 1,
                  ),
                ),
                child: IconButton(
                  icon: const Icon(
                    CupertinoIcons.house,
                    color: Color(0xFF8E8E93),
                    size: 20,
                  ),
                  onPressed: () {
                    // TODO: Ana sayfaya yönlendir veya geri git
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _signIn() {
    if (_formKey.currentState!.validate()) {
      ref.read(authStateProvider.notifier).signIn(
            _emailController.text,
            _passwordController.text,
          );
    }
  }

  // Logo widget'ı - Web uygulamasındaki gibi (PAFTA yazısı + kırmızı nokta)
  Widget _buildLogo(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'PAFTA',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF8B2F2F), // Logo rengi
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 12,
            height: 12,
            decoration: const BoxDecoration(
              color: Color(0xFF8B2F2F), // Logo nokta rengi
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  // Email Field - Görüntüdeki gibi beyaz kutu, açık gri border
  Widget _buildEmailField(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFE5E5EA),
          width: 1,
        ),
      ),
      child: TextFormField(
        controller: _emailController,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        decoration: InputDecoration(
          hintText: 'E-posta',
          hintStyle: const TextStyle(
            color: Color(0xFF8E8E93),
            fontSize: 15,
          ),
          prefixIcon: const Icon(
            CupertinoIcons.mail,
            color: Color(0xFF8E8E93),
            size: 22,
          ),
          filled: true,
          fillColor: Colors.transparent,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 18,
          ),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Email adresi gereklidir';
          }
          if (!value.contains('@') || !value.contains('.')) {
            return 'Geçerli bir email adresi giriniz';
          }
          return null;
        },
      ),
    );
  }

  // Password Field - Görüntüdeki gibi beyaz kutu, açık gri border
  Widget _buildPasswordField(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFE5E5EA),
          width: 1,
        ),
      ),
      child: TextFormField(
        controller: _passwordController,
        obscureText: _obscurePassword,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) => _signIn(),
        decoration: InputDecoration(
          hintText: 'Şifreniz (en az 8 karakter)',
          hintStyle: const TextStyle(
            color: Color(0xFF8E8E93),
            fontSize: 15,
          ),
          prefixIcon: const Icon(
            CupertinoIcons.lock,
            color: Color(0xFF8E8E93),
            size: 22,
          ),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword 
                  ? CupertinoIcons.eye_slash 
                  : CupertinoIcons.eye,
              color: const Color(0xFF8E8E93),
              size: 20,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
          filled: true,
          fillColor: Colors.transparent,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 18,
          ),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Şifre gereklidir';
          }
          if (value.length < 8) {
            return 'Şifre en az 8 karakter olmalıdır';
          }
          return null;
        },
      ),
    );
  }

}
