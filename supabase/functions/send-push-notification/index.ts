import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  console.log('🚀 Push Notification Edge Function başlatıldı!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
  // OPTIONS isteği için CORS preflight response
  if (req.method === 'OPTIONS') {
    try {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    } catch (error) {
      console.error('❌ OPTIONS request hatası:', error);
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }
  }

  try {
    // Environment variables kontrolü
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL environment variable bulunamadı');
      return new Response(JSON.stringify({ 
        error: 'SUPABASE_URL environment variable bulunamadı' 
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable bulunamadı');
      return new Response(JSON.stringify({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY environment variable bulunamadı' 
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    // Gelen veriyi al
    let payload;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim().length === 0) {
        console.error('❌ Request body boş');
        return new Response(JSON.stringify({ 
          error: 'Request body boş',
          details: 'POST isteği için body gereklidir'
        }), {
          headers: corsHeaders,
          status: 400
        });
      }
      console.log('📦 Raw request body:', bodyText.substring(0, 500));
      payload = JSON.parse(bodyText);
      console.log('📦 Parsed payload:', JSON.stringify(payload, null, 2));
    } catch (parseError: any) {
      console.error('❌ JSON parse hatası:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Geçersiz JSON formatı',
        details: parseError?.message || 'JSON parse edilemedi'
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    // Supabase client oluştur
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // İki farklı format destekle:
    // 1. Mobil uygulamadan: { user_id, title, body, data }
    // 2. Webhook'tan: { record: { ... } }
    
    let userId: string | null = null;
    let notificationTitle: string;
    let notificationBody: string;
    let notificationData: Record<string, string> = {};
    
    if (payload.user_id) {
      // Mobil uygulamadan gelen format
      userId = payload.user_id;
      notificationTitle = payload.title || 'Bildirim';
      notificationBody = payload.body || '';
      notificationData = payload.data || {};
    } else if (payload.record) {
      // Webhook'tan gelen format (service_requests tablosu güncellendiğinde)
      const serviceRequest = payload.record;
      
      // assigned_technician değiştiyse teknisyene bildirim gönder
      if (serviceRequest.assigned_technician) {
        userId = serviceRequest.assigned_technician;
        notificationTitle = 'Yeni Servis Talebi Atandı';
        const customerName = serviceRequest.customer_name || 'Müşteri';
        notificationBody = `${customerName} için "${serviceRequest.service_title || 'Servis talebi'}" atandı`;
        notificationData = {
          type: 'service_assignment',
          service_request_id: serviceRequest.id,
          action: 'open_service_request',
        };
      } else if (serviceRequest.customer_id) {
        // Müşteriye durum güncelleme bildirimi
        userId = serviceRequest.customer_id;
        notificationTitle = 'Servis Talebi Güncellendi';
        notificationBody = `${serviceRequest.service_title || 'Servis talebiniz'} durumu: ${serviceRequest.service_status}`;
        
        // Durum tabasında özel mesajlar
        switch (serviceRequest.service_status) {
          case 'assigned':
            notificationTitle = 'Teknisyen Atandı';
            notificationBody = `${serviceRequest.service_title} için teknisyen atandı`;
            break;
          case 'in_progress':
            notificationTitle = 'Servis Başlatıldı';
            notificationBody = `${serviceRequest.service_title} servisi başlatıldı`;
            break;
          case 'completed':
            notificationTitle = 'Servis Tamamlandı';
            notificationBody = `${serviceRequest.service_title} servisi tamamlandı`;
            break;
          case 'cancelled':
            notificationTitle = 'Servis İptal Edildi';
            notificationBody = `${serviceRequest.service_title} servisi iptal edildi`;
            break;
        }
        
        notificationData = {
          service_request_id: serviceRequest.id,
          status: serviceRequest.service_status,
          type: 'service_request_update',
          action: 'open_service_request',
        };
      } else {
        return new Response(JSON.stringify({ error: 'user_id veya customer_id bulunamadı' }), {
          headers: corsHeaders,
          status: 400
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Geçersiz payload formatı' }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id bulunamadı' }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    // Kullanıcının FCM token'ını al
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();
      
    console.log('👤 Profile query sonucu:', { 
      hasProfile: !!profile, 
      hasToken: !!profile?.fcm_token,
      tokenLength: profile?.fcm_token?.length,
      error: profileError 
    });
    
    if (profileError) {
      console.error('❌ Profile query hatası:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Kullanıcı profili bulunamadı',
        user_id: userId,
        details: profileError.message
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    if (!profile?.fcm_token) {
      console.log('❌ FCM token bulunamadı - kullanıcı ID:', userId);
      return new Response(JSON.stringify({ 
        error: 'FCM token bulunamadı',
        user_id: userId,
        hasProfile: !!profile
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    // FCM token validasyonu
    const fcmToken = profile.fcm_token.trim();
    if (fcmToken.length < 50) {
      console.error('❌ FCM token çok kısa:', fcmToken.length);
      return new Response(JSON.stringify({ 
        error: 'FCM token geçersiz (çok kısa)',
        user_id: userId,
        token_length: fcmToken.length
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    console.log('📨 Bildirim gönderiliyor:');
    console.log('- Title:', notificationTitle);
    console.log('- Body:', notificationBody);
    console.log('- User ID:', userId);
    console.log('- FCM Token (ilk 30 karakter):', fcmToken.substring(0, 30) + '...');
    console.log('- FCM Token uzunluğu:', fcmToken.length);
    
  // OAuth 2.0 Access Token al
  console.log('🔑 Access token alınıyor...');
  let accessToken;
  try {
    accessToken = await getAccessToken();
    console.log('🔑 Access token başarıyla alındı');
    console.log('🔑 Access token uzunluk:', accessToken?.length || 0);
    console.log('🔑 Access token ilk 20 karakter:', accessToken?.substring(0, 20) || 'N/A');
    if (!accessToken || accessToken.length < 10) {
      throw new Error('Access token geçersiz veya çok kısa');
    }
  } catch (tokenError) {
    console.error('❌ Access token alma hatası:', tokenError);
    console.error('❌ Token error details:', {
      message: tokenError?.message,
      stack: tokenError?.stack
    });
    throw new Error(`Access token alınamadı: ${tokenError?.message || 'Bilinmeyen hata'}`);
  }
    
    // FCM v1 API ile bildirim gönder
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: Object.fromEntries(
          Object.entries(notificationData).map(([k, v]) => [k, String(v)])
        ),
        android: {
          notification: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
            icon: 'ic_notification'
          }
        },
        apns: {
          payload: {
            aps: {
              category: 'FLUTTER_NOTIFICATION_CLICK',
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          }
        }
      }
    };
    
    console.log('📤 FCM mesajı hazırlandı, gönderiliyor...');
    console.log('- Message structure:', JSON.stringify({
      hasToken: !!message.message.token,
      tokenLength: message.message.token.length,
      title: message.message.notification.title,
      body: message.message.notification.body,
      dataKeys: Object.keys(message.message.data)
    }));
    
    console.log('📤 FCM API\'ye istek gönderiliyor...');
    console.log('📤 Authorization header:', `Bearer ${accessToken.substring(0, 20)}...`);
    
    const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/pafta-b84ce/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const responseText = await fcmResponse.text();
    console.log('📥 FCM Response:', {
      status: fcmResponse.status,
      statusText: fcmResponse.statusText,
      body: responseText.substring(0, 500) // İlk 500 karakter
    });
    
    if (!fcmResponse.ok) {
      console.error('❌ FCM API hatası:', fcmResponse.status, responseText);
      throw new Error(`FCM API hatası: ${fcmResponse.status} - ${responseText.substring(0, 200)}`);
    }
    
    let fcmResult;
    try {
      fcmResult = JSON.parse(responseText);
      console.log('✅ FCM başarılı response:', {
        messageId: fcmResult.name,
        success: true
      });
    } catch (parseError) {
      console.error('❌ FCM response parse hatası:', parseError);
      throw new Error(`FCM response parse edilemedi: ${responseText.substring(0, 200)}`);
    }
    
    // Bildirimi veritabanına kaydet
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notificationTitle,
          body: notificationBody,
          type: notificationData.type || 'general',
          data: notificationData,
          action: notificationData.action || null,
          service_request_id: notificationData.service_request_id || null,
          technician_id: notificationData.type === 'service_assignment' ? userId : null,
          customer_id: notificationData.type === 'service_request_update' ? userId : null,
          is_read: false
        });
      
      if (notificationError) {
        console.error('❌ Bildirim veritabanına kaydedilemedi:', notificationError);
      } else {
        console.log('✅ Bildirim veritabanına kaydedildi');
      }
    } catch (dbError) {
      console.error('❌ Bildirim kaydetme hatası:', dbError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Bildirim başarıyla gönderildi',
      fcm_message_id: fcmResult.name,
      data: {
        title: notificationTitle,
        body: notificationBody,
        user_id: userId,
        ...notificationData
      }
    }), {
      headers: corsHeaders,
      status: 200
    });
    
  } catch (error: any) {
    console.error('❌ Edge Function hatası:', {
      message: error?.message || 'Bilinmeyen hata',
      stack: error?.stack,
      name: error?.name,
      error: error
    });
    
    // Hata mesajını güvenli bir şekilde döndür
    const errorMessage = error?.message || 'Bilinmeyen hata oluştu';
    const errorName = error?.name || 'Error';
    
    return new Response(JSON.stringify({
      error: errorMessage,
      error_type: errorName,
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});

// OAuth 2.0 Access Token al
async function getAccessToken() {
  // Firebase service account bilgileri
  // Private key Supabase secrets'tan, diğerleri public bilgi olduğu için kodda
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
  
  if (!privateKey) {
    console.error('❌ FIREBASE_PRIVATE_KEY environment variable bulunamadı');
    throw new Error('FIREBASE_PRIVATE_KEY environment variable bulunamadı. Lütfen Supabase Edge Functions Secrets\'a ekleyin.');
  }
  
  console.log('🔧 Firebase config: Private key bulundu, length:', privateKey.length);
  
  const serviceAccount = {
    type: 'service_account',
    project_id: 'pafta-b84ce',
    private_key_id: '',
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: 'firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token'
  };
  
  // JWT oluştur
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now
  };
  
  // JWT'yi manuel olarak oluştur (Deno'da crypto.subtle kullan)
  // Base64 URL-safe encoding için Deno'nun built-in encoder'ını kullan
  const encodeBase64Url = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  
  const jwtHeader = encodeBase64Url(JSON.stringify(header));
  const jwtPayload = encodeBase64Url(JSON.stringify(payload));
  const textToSign = `${jwtHeader}.${jwtPayload}`;
  
  console.log('🔐 JWT imzalanıyor...');
  console.log('🔐 Header:', jwtHeader.substring(0, 30) + '...');
  console.log('🔐 Payload:', jwtPayload.substring(0, 50) + '...');
  
  const signature = await signWithRSA256(textToSign, serviceAccount.private_key);
  const jwt = `${textToSign}.${signature}`;
  console.log('🔐 JWT oluşturuldu (uzunluk:', jwt.length, ')');
  console.log('🔐 JWT ilk 50 karakter:', jwt.substring(0, 50) + '...');
  
  // Access token al
  console.log('📡 OAuth token endpoint\'e istek gönderiliyor...');
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(jwt)}`
  });
  
  console.log('📡 Token response status:', tokenResponse.status);
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('❌ Token alma hatası:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      error: errorText
    });
    throw new Error(`Token alma hatası: ${tokenResponse.status} - ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  console.log('✅ Token data alındı:', {
    hasAccessToken: !!tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in
  });
  
  if (!tokenData.access_token) {
    throw new Error('Access token response\'da bulunamadı');
  }
  
  return tokenData.access_token;
}

// RSA256 ile imzalama
async function signWithRSA256(data: string, privateKeyPem: string) {
  // Private key'i temizle
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKeyPem.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  
  // Base64'ten ArrayBuffer'a çevir
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Private key'i içe aktar
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']  // Deno'da usages doğrudan array olmalı
  );
  
  // Veriyi imzala
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(data)
  );
  
  // Base64 URL-safe formatına çevir
  // Deno'da Uint8Array'i string'e çevirirken dikkatli olmalıyız
  const signatureArray = new Uint8Array(signature);
  let signatureBinaryString = '';
  for (let i = 0; i < signatureArray.length; i++) {
    signatureBinaryString += String.fromCharCode(signatureArray[i]);
  }
  const base64Signature = btoa(signatureBinaryString);
  return base64Signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

