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
    let isWebhook = false;
    
    if (payload.user_id) {
      // Mobil uygulamadan gelen format - Authentication gerekli
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader) {
        console.error('❌ Authorization header bulunamadı');
        return new Response(JSON.stringify({ 
          error: 'Yetkilendirme gerekli',
          details: 'Authorization header eksik'
        }), {
          headers: corsHeaders,
          status: 401
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        console.error('❌ Geçersiz token:', userError);
        return new Response(JSON.stringify({ 
          error: 'Geçersiz yetkilendirme token\'ı',
          details: userError?.message || 'Token doğrulanamadı'
        }), {
          headers: corsHeaders,
          status: 401
        });
      }

      // Kullanıcı sadece kendisine bildirim gönderebilir (veya admin ise başkasına)
      const targetUserId = payload.user_id;
      
      // Admin kontrolü - user_roles tablosundan kontrol et
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'owner');
      
      if (targetUserId !== user.id && !isAdmin) {
        console.error('❌ Yetki hatası: Kullanıcı başkasına bildirim gönderemez');
        return new Response(JSON.stringify({ 
          error: 'Yetki hatası',
          details: 'Sadece kendinize bildirim gönderebilirsiniz'
        }), {
          headers: corsHeaders,
          status: 403
        });
      }

      console.log('✅ Kullanıcı doğrulandı:', user.id);
      
      userId = payload.user_id;
      notificationTitle = payload.title || 'Bildirim';
      notificationBody = payload.body || '';
      notificationData = payload.data || {};
    } else if (payload.record) {
      // Webhook'tan gelen format (service_requests tablosu güncellendiğinde)
      // Validate webhook origin - only accept from internal Supabase triggers
      const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
      const requestSignature = req.headers.get('x-webhook-signature');
      
      // If WEBHOOK_SECRET is configured, validate the signature
      if (webhookSecret) {
        if (!requestSignature) {
          console.error('❌ Webhook signature missing');
          return new Response(JSON.stringify({ 
            error: 'Webhook signature required',
            details: 'x-webhook-signature header is missing'
          }), {
            headers: corsHeaders,
            status: 401
          });
        }
        
        // Verify the signature matches (simple HMAC validation)
        const expectedSignature = await generateWebhookSignature(JSON.stringify(payload), webhookSecret);
        if (requestSignature !== expectedSignature) {
          console.error('❌ Invalid webhook signature');
          return new Response(JSON.stringify({ 
            error: 'Invalid webhook signature',
            details: 'Signature verification failed'
          }), {
            headers: corsHeaders,
            status: 401
          });
        }
        console.log('✅ Webhook signature verified');
      } else {
        // Fallback: Check for internal Supabase headers that indicate it's from a database trigger
        const supabaseWebhookHeader = req.headers.get('x-supabase-webhook');
        const userAgent = req.headers.get('user-agent') || '';
        
        // Log the webhook call for audit
        console.log('⚠️ Webhook call without signature verification:', {
          hasSupabaseHeader: !!supabaseWebhookHeader,
          userAgent: userAgent.substring(0, 50),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        });
        
        // Only allow if it looks like an internal Supabase call
        // pg_net is Supabase's internal network extension for database triggers
        const isInternalSupabaseCall = 
          supabaseWebhookHeader || 
          userAgent.includes('Supabase') || 
          userAgent.includes('pg_net');
        
        if (!isInternalSupabaseCall) {
          console.error('❌ Unauthorized webhook call - missing internal headers');
          return new Response(JSON.stringify({ 
            error: 'Unauthorized',
            details: 'Webhook calls must originate from Supabase or include proper authentication'
          }), {
            headers: corsHeaders,
            status: 401
          });
        }
        
        console.log('✅ Internal Supabase webhook call detected');
      }
      
      isWebhook = true;
      const serviceRequest = payload.record;
      
      // assigned_technician değiştiyse teknisyene bildirim gönder
      if (serviceRequest.assigned_technician) {
        // assigned_technician employee ID olabilir, user_id'yi bul
        const technicianId = serviceRequest.assigned_technician;
        
        // Önce employee tablosundan user_id'yi çek
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('user_id, first_name, last_name')
          .eq('id', technicianId)
          .single();
        
        if (employeeError || !employee?.user_id) {
          console.warn('⚠️ Employee bulunamadı veya user_id yok:', {
            technicianId,
            employeeError: employeeError?.message,
            hasEmployee: !!employee,
            hasUserId: !!employee?.user_id
          });
          
          // Employee yoksa veya user_id yoksa bildirim gönderemeyiz
          // user_id olmadan bildirim kaydedemeyiz (foreign key constraint)
          console.warn('⚠️ Employee user_id bulunamadı, bildirim kaydedilmeyecek');
          
          return new Response(JSON.stringify({ 
            success: false,
            message: 'Employee bulunamadı veya user_id yok - push notification gönderilemedi',
            warning: 'Employee user_id not found',
            technician_id: technicianId,
            notification_saved: false
          }), {
            headers: corsHeaders,
            status: 200
          });
        }
        
        // Employee'nin user_id'sini kullan
        userId = employee.user_id;
        const technicianName = employee.first_name && employee.last_name 
          ? `${employee.first_name} ${employee.last_name}` 
          : 'Teknisyen';
        
        notificationTitle = 'Yeni Servis Ataması';
        const customerName = serviceRequest.customer_name || 'Müşteri';
        notificationBody = `${customerName} - ${serviceRequest.service_title || 'Servis talebi'}`;
        notificationData = {
          type: 'service_assignment',
          service_request_id: serviceRequest.id,
          action: 'open_service_request',
        };
        
        console.log('👷 Employee bilgisi:', {
          employeeId: technicianId,
          userId: userId,
          technicianName: technicianName
        });
      } else if (serviceRequest.customer_id) {
        // Customer ID'ye bildirim gönderemeyiz çünkü customer bir kullanıcı değil
        // Customer'ın representative (employee) üzerinden user_id bulabiliriz ama şimdilik atlayalım
        console.warn('⚠️ Customer ID\'ye bildirim gönderilemez - customer bir kullanıcı değil');
        console.log('ℹ️ Customer ID:', serviceRequest.customer_id);
        
        // Bildirim göndermeden devam et
        return new Response(JSON.stringify({ 
          success: false,
          message: 'Customer ID\'ye bildirim gönderilemez - customer bir kullanıcı değil',
          warning: 'Customer is not a user',
          customer_id: serviceRequest.customer_id
        }), {
          headers: corsHeaders,
          status: 200
        });
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
      .select('fcm_token, platform')
      .eq('id', userId)
      .single();
      
    console.log('👤 Profile query sonucu:', { 
      hasProfile: !!profile, 
      hasToken: !!profile?.fcm_token,
      tokenLength: profile?.fcm_token?.length,
      platform: profile?.platform,
      error: profileError 
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:327',message:'Profile query sonucu',data:{hasProfile:!!profile,hasToken:!!profile?.fcm_token,tokenLength:profile?.fcm_token?.length||0,platform:profile?.platform||'unknown',hasError:!!profileError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (profileError) {
      console.error('❌ Profile query hatası:', profileError);
      console.warn('⚠️ Kullanıcı profili bulunamadı, bildirim veritabanına kaydedilecek ama push gönderilmeyecek');
      
      // Profile yoksa bildirim kaydedemeyiz (user_id foreign key constraint)
      console.warn('⚠️ Profile bulunamadı, bildirim kaydedilemez');
      
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Kullanıcı profili bulunamadı - push notification gönderilemedi',
        warning: 'Profile not found',
        user_id: userId,
        details: profileError.message,
        notification_saved: false
      }), {
        headers: corsHeaders,
        status: 200
      });
    }
    
    if (!profile?.fcm_token) {
      console.log('❌ FCM token bulunamadı - kullanıcı ID:', userId);
      console.warn('⚠️ FCM token yok, bildirim veritabanına kaydedilecek ama push gönderilmeyecek');
      
      // FCM token yoksa bildirim kaydedebiliriz ama push gönderemeyiz
      // Bildirimi veritabanına kaydet (push gönderemeyiz ama kayıt tutalım)
      let notificationSaved = false;
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
          console.log('✅ Bildirim veritabanına kaydedildi (FCM token yok ama kayıt tutuldu)');
          notificationSaved = true;
        }
      } catch (dbError) {
        console.error('❌ Bildirim kaydetme hatası:', dbError);
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        message: 'FCM token bulunamadı - bildirim veritabanına kaydedildi ancak push notification gönderilemedi',
        warning: 'FCM token not found',
        user_id: userId,
        hasProfile: !!profile,
        notification_saved: notificationSaved
      }), {
        headers: corsHeaders,
        status: 200
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:417',message:'getAccessToken çağrılıyor',data:{userId,hasFcmToken:!!fcmToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    accessToken = await getAccessToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:421',message:'getAccessToken başarılı',data:{tokenLength:accessToken?.length||0,tokenPrefix:accessToken?.substring(0,20)||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('🔑 Access token başarıyla alındı');
    console.log('🔑 Access token uzunluk:', accessToken?.length || 0);
    console.log('🔑 Access token ilk 20 karakter:', accessToken?.substring(0, 20) || 'N/A');
    if (!accessToken || accessToken.length < 10) {
      throw new Error('Access token geçersiz veya çok kısa');
    }
  } catch (tokenError: unknown) {
    const errorMessage = tokenError instanceof Error ? tokenError.message : 'Bilinmeyen hata';
    const errorStack = tokenError instanceof Error ? tokenError.stack : undefined;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:427',message:'getAccessToken hatası',data:{error:errorMessage,hasStack:!!errorStack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('❌ Access token alma hatası:', tokenError);
    console.error('❌ Token error details:', {
      message: errorMessage,
      stack: errorStack
    });
    throw new Error(`Access token alınamadı: ${errorMessage}`);
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
          headers: {
            'apns-priority': '10', // Immediate delivery
            'apns-push-type': 'alert'
          },
          payload: {
            aps: {
              alert: {
                title: notificationTitle,
                body: notificationBody
              },
              category: 'FLUTTER_NOTIFICATION_CLICK',
              sound: 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1
            }
          }
        }
      }
    };
    
    // #region agent log
    const apnsPayload = message.message.apns?.payload?.aps;
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:476',message:'FCM message payload oluşturuldu',data:{hasToken:!!message.message.token,tokenLength:message.message.token.length,hasApns:!!message.message.apns,hasApnsHeaders:!!message.message.apns.headers,hasApnsPayload:!!message.message.apns.payload,apnsPushType:message.message.apns.headers['apns-push-type'],apnsPriority:message.message.apns.headers['apns-priority'],hasAps:!!apnsPayload,hasAlert:!!apnsPayload?.alert,hasTitle:!!apnsPayload?.alert?.title,hasBody:!!apnsPayload?.alert?.body,hasSound:!!apnsPayload?.sound,hasBadge:apnsPayload?.badge!==undefined,hasContentAvailable:apnsPayload?.['content-available']!==undefined,hasMutableContent:apnsPayload?.['mutable-content']!==undefined,platform:profile?.platform||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:490',message:'FCM API isteği gönderiliyor',data:{hasAccessToken:!!accessToken,tokenLength:accessToken.length,hasMessage:!!message,hasApns:!!message.message.apns,platform:profile?.platform||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:490',message:'FCM API isteği detayları',data:{url:'https://fcm.googleapis.com/v1/projects/pafta-b84ce/messages:send',hasAuthHeader:true,authHeaderPrefix:accessToken.substring(0,20),hasMessage:!!message,messageKeys:Object.keys(message),hasApns:!!message.message.apns,apnsKeys:message.message.apns?Object.keys(message.message.apns):[],platform:profile?.platform||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/pafta-b84ce/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:497',message:'FCM API response alındı',data:{status:fcmResponse.status,statusText:fcmResponse.statusText,ok:fcmResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const responseText = await fcmResponse.text();
    console.log('📥 FCM Response:', {
      status: fcmResponse.status,
      statusText: fcmResponse.statusText,
      body: responseText.substring(0, 1000) // İlk 1000 karakter
    });
    
    // Response headers'ı da logla
    const responseHeaders: Record<string, string> = {};
    fcmResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('📥 FCM Response Headers:', responseHeaders);
    
    let fcmResult = null;
    let fcmError = null;
    
    if (!fcmResponse.ok) {
      console.error('❌ FCM API hatası:', fcmResponse.status, responseText);
      
      // Hata detaylarını parse et
      let errorDetails = responseText;
      let parsedError = null;
      try {
        parsedError = JSON.parse(responseText);
        errorDetails = JSON.stringify(parsedError, null, 2);
        console.error('❌ FCM API hata detayları:', errorDetails);
        fcmError = {
          status: fcmResponse.status,
          message: parsedError.error?.message || 'FCM API hatası',
          code: parsedError.error?.code || 'UNKNOWN',
          details: parsedError
        };
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:522',message:'FCM API hata detayları parse edildi',data:{status:fcmResponse.status,errorCode:parsedError.error?.code,errorMessage:parsedError.error?.message,hasApnsError:!!parsedError.error?.details?.find((d:any)=>d['@type']?.includes('ApnsError')),apnsErrorReason:parsedError.error?.details?.find((d:any)=>d['@type']?.includes('ApnsError'))?.reason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        // JSON parse edilemezse olduğu gibi kullan
        fcmError = {
          status: fcmResponse.status,
          message: 'FCM API hatası',
          code: 'PARSE_ERROR',
          details: responseText.substring(0, 500)
        };
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:531',message:'FCM API hata parse edilemedi',data:{status:fcmResponse.status,responsePreview:responseText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    } else {
      // FCM başarılı, response'u parse et
      try {
        fcmResult = JSON.parse(responseText);
        console.log('✅ FCM başarılı response:', {
          messageId: fcmResult.name,
          success: true
        });
      } catch (parseError) {
        console.error('❌ FCM response parse hatası:', parseError);
        fcmError = {
          status: fcmResponse.status,
          message: 'FCM response parse edilemedi',
          code: 'PARSE_ERROR',
          details: responseText.substring(0, 200)
        };
      }
    }
    
    // Bildirimi her durumda veritabanına kaydet (FCM hatası olsa bile)
    let notificationSaved = false;
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
        notificationSaved = true;
      }
    } catch (dbError) {
      console.error('❌ Bildirim kaydetme hatası:', dbError);
    }
    
    // FCM hatası varsa, bildirimi kaydettik ama push gönderemedik
    if (fcmError) {
      console.warn('⚠️ FCM hatası oluştu ama bildirim veritabanına kaydedildi');
      
      // 401 hatası için özel mesaj
      let errorMessage = 'Bildirim veritabanına kaydedildi ancak push notification gönderilemedi';
      let troubleshootingSteps: any = {};
      
      if (fcmError.status === 401) {
        errorMessage += '. FCM API authentication hatası - Service account izinlerini kontrol edin.';
        console.error('🔐 FCM 401 hatası - Service account izinleri kontrol edilmeli:');
        console.error('   1. Google Cloud Console → IAM & Admin → Service Accounts');
        console.error('   2. firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com');
        console.error('   3. "Firebase Cloud Messaging Admin" veya "Firebase Admin" rolü ekleyin');
        console.error('   4. API & Services → Enabled APIs → "Firebase Cloud Messaging API" etkin olmalı');
        
        // Hata detaylarını kontrol et
        const errorDetails = fcmError.details?.error?.details || [];
        const hasApnsError = errorDetails.some((d: any) => d['@type']?.includes('ApnsError'));
        const hasThirdPartyAuthError = errorDetails.some((d: any) => d.errorCode === 'THIRD_PARTY_AUTH_ERROR');
        
        if (hasApnsError) {
          const apnsError = errorDetails.find((d: any) => d['@type']?.includes('ApnsError'));
          console.error('🍎 APNs InvalidProviderToken hatası - Firebase Console\'da APNs Authentication Key kontrol edilmeli:');
          console.error('   1. Firebase Console → Project Settings → Cloud Messaging');
          console.error('   2. Apple app configuration → com.pafta.mobile');
          console.error('   3. APNs Authentication Key (.p8) yüklü ve geçerli olmalı');
          console.error('   4. Key ID ve Team ID doğru girilmiş olmalı');
          console.error('   5. Bundle ID: com.pafta.mobile eşleşmeli');
          console.error(`   6. APNs Error: ${apnsError.reason || 'InvalidProviderToken'}`);
          
          troubleshootingSteps.apns = {
            issue: 'APNs InvalidProviderToken - iOS push notification için APNs Authentication Key geçersiz',
            solution: 'Firebase Console → Project Settings → Cloud Messaging → Apple app configuration → APNs Authentication Key (.p8) yükleyin ve Key ID, Team ID, Bundle ID değerlerini kontrol edin',
            steps: [
              'Firebase Console → Project Settings → Cloud Messaging',
              'Apple app configuration → com.pafta.mobile seçin',
              'APNs Authentication Key (.p8) yüklü ve geçerli olmalı',
              'Key ID ve Team ID Apple Developer Console\'dan alınan değerlerle eşleşmeli',
              'Bundle ID: com.pafta.mobile kontrol edin'
            ]
          };
        }
        
        if (hasThirdPartyAuthError) {
          console.error('🔐 THIRD_PARTY_AUTH_ERROR - Service account izinleri eksik:');
          console.error('   1. Google Cloud Console → IAM & Admin → Service Accounts');
          console.error('   2. firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com');
          console.error('   3. "Firebase Cloud Messaging Admin" rolü ekleyin');
          console.error('   4. API & Services → Enabled APIs → "Firebase Cloud Messaging API" etkin olmalı');
          
          troubleshootingSteps.iam = {
            issue: 'THIRD_PARTY_AUTH_ERROR - Service account FCM API izinleri eksik',
            solution: 'Google Cloud Console → IAM & Admin → Service Accounts → firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com → "Firebase Cloud Messaging Admin" rolü ekleyin',
            steps: [
              'Google Cloud Console → IAM & Admin → Service Accounts',
              'firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com seçin',
              '"Firebase Cloud Messaging Admin" veya "Firebase Admin" rolü ekleyin',
              'API & Services → Enabled APIs → "Firebase Cloud Messaging API" etkin olduğundan emin olun'
            ]
          };
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        message: errorMessage,
        warning: 'FCM API hatası',
        fcm_error: fcmError,
        notification_saved: notificationSaved,
        troubleshooting: fcmError.status === 401 ? troubleshootingSteps : undefined,
        data: {
          title: notificationTitle,
          body: notificationBody,
          user_id: userId,
          ...notificationData
        }
      }), {
        headers: corsHeaders,
        status: 200 // 200 döndürüyoruz çünkü bildirim kaydedildi
      });
    }
    
    // Başarılı durum
    return new Response(JSON.stringify({
      success: true,
      message: 'Bildirim başarıyla gönderildi',
      fcm_message_id: fcmResult?.name,
      notification_saved: notificationSaved,
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
  // Firebase service account bilgileri - environment variables'tan al
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
  const privateKeyId = Deno.env.get('FIREBASE_PRIVATE_KEY_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const tokenUri = Deno.env.get('FIREBASE_TOKEN_URI');

  if (!privateKey) {
    console.error('❌ FIREBASE_PRIVATE_KEY environment variable bulunamadı');
    throw new Error('FIREBASE_PRIVATE_KEY environment variable bulunamadı. Lütfen Supabase Edge Functions Secrets\'a ekleyin.');
  }

  console.log('🔧 Firebase config:', {
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey.length,
    hasPrivateKeyId: !!privateKeyId,
    clientEmail: clientEmail || 'firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com',
    projectId: projectId || 'pafta-b84ce'
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:678',message:'Firebase config kontrolü',data:{hasPrivateKey:!!privateKey,privateKeyLength:privateKey?.length||0,hasPrivateKeyId:!!privateKeyId,clientEmail:clientEmail||'default',projectId:projectId||'default'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const serviceAccount = {
    type: 'service_account',
    project_id: projectId || 'pafta-b84ce',
    private_key_id: privateKeyId || '',
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: clientEmail || 'firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: tokenUri || 'https://oauth2.googleapis.com/token'
  };
  
  // JWT oluştur
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now
  };
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:703',message:'JWT payload oluşturuldu',data:{iss:payload.iss,scope:payload.scope,scopeCount:payload.scope.split(' ').length,aud:payload.aud,exp:payload.exp,iat:payload.iat,hasCloudPlatform:payload.scope.includes('cloud-platform'),hasFirebaseMessaging:payload.scope.includes('firebase.messaging')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
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
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:742',message:'OAuth token response alındı',data:{status:tokenResponse.status,ok:tokenResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('❌ Token alma hatası:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      error: errorText
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:747',message:'OAuth token alma hatası',data:{status:tokenResponse.status,errorPreview:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(`Token alma hatası: ${tokenResponse.status} - ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  console.log('✅ Token data alındı:', {
    hasAccessToken: !!tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/e54a1b65-f487-45c8-9f44-491bb1af2395',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-push-notification/index.ts:754',message:'OAuth token data parse edildi',data:{hasAccessToken:!!tokenData.access_token,tokenType:tokenData.token_type,expiresIn:tokenData.expires_in,tokenLength:tokenData.access_token?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
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

// Webhook signature generation for HMAC validation
async function generateWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const signatureArray = new Uint8Array(signature);
  let signatureBinaryString = '';
  for (let i = 0; i < signatureArray.length; i++) {
    signatureBinaryString += String.fromCharCode(signatureArray[i]);
  }
  return btoa(signatureBinaryString);
}

