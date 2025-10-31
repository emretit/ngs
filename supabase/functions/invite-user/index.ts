import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Genel CORS başlıkları
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Uygulama URL'i (redirect için zorunlu)
// Not: Lovable ortamında env değişkenleri kullanılamaz, bu nedenle sabit URL kullanıyoruz
const APP_URL = "https://pafta.app";

serve(async (req) => {
  console.log("🚀 invite-user function called");
  
  // CORS preflight
  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📝 Request method:", req.method);
    
    if (req.method !== "POST") {
      console.log("❌ Invalid method:", req.method);
      return new Response(JSON.stringify({ error: "Sadece POST desteklenir" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    console.log("📦 Request body:", JSON.stringify(body));
    
    const { email, inviting_company_id, company_name } = body as {
      email?: string;
      inviting_company_id?: string;
      company_name?: string;
    };
    
    console.log("📧 Email:", email, "Company ID:", inviting_company_id, "Company Name:", company_name);

    if (!email) {
      console.log("❌ Email missing");
      return new Response(
        JSON.stringify({ error: "Email gereklidir" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("✅ Email validation passed");

    // Supabase service role client
    console.log("🔧 Creating Supabase client...");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log("✅ Supabase client created");

    // Şirket adını belirle (id varsa DB'den çek, yoksa gönderilen ya da varsayılan)
    let companyName = company_name || "Şirketiniz";
    console.log("🏢 Initial company name:", companyName);
    if (inviting_company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name")
        .eq("id", inviting_company_id)
        .maybeSingle();

      if (companyError) {
        console.error("Şirket bilgisi alınamadı:", companyError);
      }
      if (companyData?.name) companyName = companyData.name;
    }

    // Kullanıcı/profil var mı kontrol et
    console.log("🔍 Checking for existing profile...");
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Profil kontrol hatası:", profileError);
      return new Response(
        JSON.stringify({ error: "Profil kontrolü sırasında hata oluştu" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("📊 Existing profile:", existingProfile ? "Found" : "Not found");

    // Resend hazırla
    console.log("📬 Initializing Resend...");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    console.log("✅ Resend initialized");

    if (existingProfile) {
      console.log("♻️ Existing profile found, sending recovery link...");
      // Mevcut kullanıcı: recovery linki üret ve InviteSetup'a yönlendir
      const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${APP_URL}/invite-setup?email=${encodeURIComponent(email)}`,
        },
      });

      if (recoveryError || !recoveryData?.properties?.action_link) {
        console.error("❌ Recovery link hatası:", recoveryError);
        return new Response(
          JSON.stringify({ error: "Şifre sıfırlama bağlantısı oluşturulamadı" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resetUrl = recoveryData.properties.action_link;
      console.log("✅ Recovery link generated");
      const emailResponse = await resend.emails.send({
        from: "PAFTA.APP <noreply@pafta.app>",
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
                  <h1 class="welcome-text">Merhaba! 👋</h1>
                  
                  <p class="description">
                    <strong>${companyName}</strong> şirketine davet edildiniz! 
                    Hesabınız zaten bulunduğu için aşağıdaki bağlantı ile şifrenizi belirleyin.
                  </p>
                  
                  <a href="${resetUrl}" class="cta-button">
                    🔐 Şifremi Belirle
                  </a>
                  
                  <div class="security-note">
                    <strong>🔒 Güvenlik Notu:</strong> Bu link kısa süreliğine geçerlidir. 
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

      if ((emailResponse as any)?.error) {
        console.error("❌ Resend e-posta hatası:", (emailResponse as any).error);
        return new Response(
          JSON.stringify({ error: "E-posta gönderilemedi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Recovery email sent successfully");
      return new Response(
        JSON.stringify({ success: true, message: `${email} adresine şifre belirleme maili gönderildi` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("🆕 New user, sending invite link...");
      // Yeni kullanıcı: invite linki üret ve InviteSetup'a yönlendir
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo: `${APP_URL}/invite-setup?email=${encodeURIComponent(email)}`,
          data: inviting_company_id
            ? { invited_by_company_id: inviting_company_id, company_name: companyName }
            : { company_name: companyName },
        },
      });

      if (inviteError || !inviteData?.properties?.action_link) {
        console.error("❌ Invite linki oluşturulamadı:", inviteError);
        return new Response(
          JSON.stringify({ error: "Davet bağlantısı oluşturulamadı" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const inviteUrl = inviteData.properties.action_link;
      console.log("✅ Invite link generated");
      const emailResponse = await resend.emails.send({
        from: "PAFTA.APP <noreply@pafta.app>",
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
                  <h1 class="welcome-text">Merhaba! 👋</h1>
                  
                  <p class="description">
                    <strong>${companyName}</strong> şirketine davet edildiniz! 
                    Hesabınızı oluşturmak ve şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın.
                  </p>
                  
                  <a href="${inviteUrl}" class="cta-button">
                    ✅ Hesabımı Kur
                  </a>
                  
                  <div class="security-note">
                    <strong>🔒 Güvenlik Notu:</strong> Bu link kısa süreliğine geçerlidir. 
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

      if ((emailResponse as any)?.error) {
        console.error("❌ Resend e-posta hatası:", (emailResponse as any).error);
        return new Response(
          JSON.stringify({ error: "E-posta gönderilemedi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Invite email sent successfully");
      return new Response(
        JSON.stringify({ success: true, message: `${email} adresine davet e-postası gönderildi` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ invite-user hata:", error);
    return new Response(
      JSON.stringify({ error: "Sunucu hatası" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
