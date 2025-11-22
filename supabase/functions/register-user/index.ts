import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-project-id, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, company_name } = await req.json();

    if (!email || !password || !company_name) {
      return new Response(
        JSON.stringify({ error: 'Email, şifre ve şirket adı gereklidir' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }


    // Supabase client'ı service role ile oluştur
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Supabase Auth üzerinde kullanıcıyı oluştur (email_confirm = false, manual confirmation)
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { 
        full_name, 
        company_name,
        bypass_invite_check: true // Allow admin-created users to bypass invite check
      }
    });

    if (createUserError) {
      console.error('Auth user oluşturma hatası:', createUserError);
      
      // Kullanıcı dostu hata mesajları
      let userMessage = 'Kullanıcı oluşturulamadı';
      if (createUserError.message?.includes('already been registered') || createUserError.message?.includes('already registered')) {
        userMessage = 'Bu e-posta adresi zaten kayıtlı.';
      } else if (createUserError.message?.includes('Invalid email')) {
        userMessage = 'Geçersiz e-posta adresi.';
      }
      
      return new Response(
        JSON.stringify({ error: userMessage, details: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // E-posta onayı için Supabase linkini üret ve gönder
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');

      if (resendApiKey) {
        // Supabase'den "signup" onay linkini üret (Supabase default davranış: doğrulama + session)
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email,
          password,
          options: {
            data: { full_name, company_name },
            redirectTo: `${Deno.env.get('APP_URL') || 'https://pafta.app'}/signin`
          },
        } as any);

        if (linkError) {
          console.warn('Onay linki üretilemedi, Supabase email resend kullanılacak:', linkError);
        }

        const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link;

        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'PAFTA.APP <noreply@pafta.app>',
          to: [email],
          subject: 'PAFTA.APP - Hesap Onayınızı Tamamlayın',
          html: `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>PAFTA.APP - Hesap Onayı</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px;
                }
                .email-card {
                  background: #ffffff;
                  border-radius: 16px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
                  border: 1px solid rgba(211, 47, 47, 0.1);
                }
                .header {
                  background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
                  color: #FFFFFF;
                  padding: 40px 30px;
                  text-align: center;
                  margin: 0;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  letter-spacing: 2px;
                  margin-bottom: 10px;
                  color: #8B0000;
                }
                .header-subtitle {
                  font-size: 16px;
                  margin: 0;
                  color: #8B0000;
                }
                .content {
                  padding: 40px 30px;
                  text-align: center;
                }
                .welcome-text {
                  font-size: 24px;
                  color: #333;
                  margin: 0 0 20px 0;
                  font-weight: 600;
                }
                .description {
                  font-size: 16px;
                  color: #666;
                  line-height: 1.6;
                  margin: 0 0 30px 0;
                }
                .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 32px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 4px 16px rgba(211, 47, 47, 0.3);
                  transition: all 0.3s ease;
                  margin: 20px 0;
                }
                .cta-button:hover {
                  box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
                  transform: translateY(-2px);
                }
                .footer {
                  background: #f8f9fa;
                  padding: 30px;
                  text-align: center;
                  border-top: 1px solid #e9ecef;
                }
                .footer-text {
                  font-size: 14px;
                  color: #6c757d;
                  line-height: 1.5;
                  margin: 0;
                }
                .security-note {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 20px 0;
                  font-size: 14px;
                  color: #856404;
                }
                @media (max-width: 600px) {
                  .container { padding: 10px; }
                  .content { padding: 30px 20px; }
                  .header { padding: 30px 20px; }
                  .logo { font-size: 24px; }
                  .welcome-text { font-size: 20px; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="email-card">
                  <div class="header">
                    <div class="logo">PAFTA.APP</div>
                    <p class="header-subtitle">İş Yönetim Sistemi</p>
                  </div>
                  
                  <div class="content">
                    <h1 class="welcome-text">Merhaba${full_name ? ` ${full_name}` : ''}! 👋</h1>
                    
                    <p class="description">
                      <strong>PAFTA.APP</strong> İş Yönetim Sistemi'ne hoş geldiniz! 
                      Hesabınızı aktif etmek için aşağıdaki butona tıklayarak 
                      e-posta adresinizi onaylayın.
                    </p>
                    
                    <a href="${actionLink}" class="cta-button">
                      ✅ E-posta Adresimi Onayla
                    </a>
                    
                    <div class="security-note">
                      <strong>🔒 Güvenlik Notu:</strong> Bu onay linki 24 saat geçerlidir. 
                      Güvenliğiniz için link sadece bir kez kullanılabilir.
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p class="footer-text">
                      Bu e-postayı siz istemediyseniz güvenle yok sayabilirsiniz.<br>
                      Hesabınız oluşturulmayacak ve hiçbir işlem yapılmayacaktır.
                    </p>
                    <p class="footer-text" style="margin-top: 15px;">
                      <strong>PAFTA.APP</strong> - Profesyonel İş Yönetimi<br>
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } else {
        // Resend yoksa Supabase kendi e-postasını göndersin
        const { error: resendErr } = await (supabase as any).auth.resend({
          type: 'signup',
          email,
        });
        if (resendErr) console.warn('Supabase resend hata:', resendErr);
      }
    } catch (e) {
      console.warn('Onay e-postası adımında hata:', e);
    }

    // Başarılı yanıt
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-posta adresinizi kontrol edin ve hesabınızı onaylayın.',
        user: {
          id: createdUser?.user?.id,
          email: createdUser?.user?.email,
          full_name,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});