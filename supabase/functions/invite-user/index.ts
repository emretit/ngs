import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const APP_URL = "https://pafta.app";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviting_company_id, company_name, role, employee_id } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email gereklidir' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default role is 'admin' if not provided
    const userRole = role || 'admin';

    console.log('📧 Invite request for:', email, 'employee_id:', employee_id);

    // Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get company name if company_id provided
    let companyName = company_name || 'Şirketiniz';
    if (inviting_company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', inviting_company_id)
        .maybeSingle();

      if (companyData?.name) companyName = companyData.name;
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    console.log(existingProfile ? '♻️ Existing user' : '🆕 New user');

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    if (existingProfile) {
      // Existing user: send recovery link to set password page
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${APP_URL}/set-password?email=${encodeURIComponent(email)}`
        }
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Recovery link error:', linkError);
        return new Response(
          JSON.stringify({ error: 'Şifre sıfırlama bağlantısı oluşturulamadı' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const resetUrl = linkData.properties.action_link;

      await resend.emails.send({
        from: 'PAFTA.APP <noreply@pafta.app>',
        to: [email],
        subject: `${companyName} şirketine davet edildiniz`,
        html: `
          <!DOCTYPE html>
          <html lang="tr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PAFTA.APP - Şirket Daveti</title>
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
              }
              .header-subtitle {
                font-size: 16px;
                margin: 0;
                opacity: 0.9;
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
                  <h1 class="welcome-text">Merhaba! 👋</h1>
                  
                  <p class="description">
                    <strong>${companyName}</strong> şirketine davet edildiniz! 
                    Hesabınız zaten bulunduğu için aşağıdaki bağlantı ile şifrenizi belirleyin.
                  </p>
                  
                  <a href="${resetUrl}" class="cta-button">
                    🔐 Şifremi Belirle
                  </a>
                  
                  <div class="security-note">
                    <strong>⏰ Önemli:</strong> Bu davet linki 1 saat boyunca geçerlidir. 
                    Link süresi dolduysa, lütfen yöneticinizden yeni bir davet linki isteyin.
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
        `
      });

      console.log('✅ Recovery email sent');
      return new Response(
        JSON.stringify({ success: true, message: `${email} adresine şifre belirleme maili gönderildi` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // New user: send invite link
      console.log('📧 Generating invite link for new user:', email);
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: `${APP_URL}/invite-setup?email=${encodeURIComponent(email)}`,
          data: {
            ...(inviting_company_id && { invited_by_company_id: inviting_company_id }),
                company_name: companyName,
            invited_role: userRole,
            ...(employee_id && { employee_id: employee_id })
              }
        }
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('❌ Invite link generation failed:', {
          error: linkError,
          code: linkError?.code,
          message: linkError?.message,
          email: email,
          timestamp: new Date().toISOString()
        });
        
        // Check if it's an email_exists error
        if (linkError && linkError.code === 'email_exists') {
          return new Response(
            JSON.stringify({ 
              error: 'Bu e-posta adresi zaten kayıtlı',
              code: 'email_exists'
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Davet bağlantısı oluşturulamadı', 
            details: linkError?.message || 'Bilinmeyen hata' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Invite link generated successfully for:', email);

      // ===== KRITIK: Davet sonrası profiles ve user_roles kaydı oluştur =====
      const userId = linkData.user?.id;
      
      if (userId && inviting_company_id) {
        console.log('📝 Creating profiles and user_roles for invited user:', userId);
        
        // 1. Profiles kaydı oluştur
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: email,
            full_name: null, // Kullanıcı InviteSetup'ta dolduracak
            company_id: inviting_company_id,
            company_name: companyName,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (profileError) {
          console.error('⚠️ Profile creation error (non-blocking):', profileError);
        } else {
          console.log('✅ Profile created for:', email);
        }
        
        // 2. User roles kaydı oluştur
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: userRole,
            company_id: inviting_company_id,
            created_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id,role,company_id',
            ignoreDuplicates: false 
          });
        
        if (roleError) {
          console.error('⚠️ User role creation error (non-blocking):', roleError);
        } else {
          console.log('✅ User role created for:', email, 'role:', userRole);
        }
      }
      // ===== KRITIK BÖLÜM SONU =====

      const inviteUrl = linkData.properties.action_link;

      await resend.emails.send({
        from: 'PAFTA.APP <noreply@pafta.app>',
        to: [email],
        subject: `${companyName} şirketine davet edildiniz`,
        html: `
          <!DOCTYPE html>
          <html lang="tr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PAFTA.APP - Şirket Daveti</title>
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
              }
              .header-subtitle {
                font-size: 16px;
                margin: 0;
                opacity: 0.9;
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
                  <h1 class="welcome-text">Merhaba! 👋</h1>
                  
                  <p class="description">
                    <strong>${companyName}</strong> şirketine davet edildiniz! 
                    Hesabınızı oluşturmak ve şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın.
                  </p>
                  
                  <a href="${inviteUrl}" class="cta-button">
                    ✅ Hesabımı Kur
                  </a>
                  
                  <div class="security-note">
                    <strong>⏰ Önemli:</strong> Bu davet linki 1 saat boyunca geçerlidir. 
                    Link süresi dolduysa, lütfen yöneticinizden yeni bir davet linki isteyin.
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
        `
      });

      console.log('✅ Invite email sent');
      return new Response(
        JSON.stringify({ success: true, message: `${email} adresine davet maili gönderildi` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Invite error:', error);
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
