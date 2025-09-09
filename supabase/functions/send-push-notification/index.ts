import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase client oluştur
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { user_id, title, body, data } = await req.json()

    // Kullanıcının FCM token'ını al
    const { data: userToken, error: tokenError } = await supabaseClient
      .from('user_tokens')
      .select('fcm_token')
      .eq('user_id', user_id)
      .single()

    if (tokenError || !userToken?.fcm_token) {
      throw new Error('FCM token bulunamadı')
    }

    // FCM Server Key (Environment variable'dan al)
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmServerKey) {
      throw new Error('FCM Server Key bulunamadı')
    }

    // FCM API'ye push notification gönder
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userToken.fcm_token,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
      }),
    })

    if (!fcmResponse.ok) {
      throw new Error(`FCM API hatası: ${fcmResponse.status}`)
    }

    const result = await fcmResponse.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
