// AI Document Analysis using Gemini
// Analyzes external documents (Google Drive, SharePoint) using Gemini API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const { content, fileName, mimeType, analysisPrompt } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Missing content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate content if too long (Gemini has token limits)
    const maxLength = 50000; // ~12k tokens for safety
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n\n[... döküman kesildi ...]'
      : content;

    // Build analysis prompt
    const systemPrompt = `Sen bir döküman analiz AI asistanısın. Türkçe yanıt veriyorsun.

GÖREV: Aşağıdaki dökümanı analiz et ve kullanıcı sorusunu yanıtla.

DÖKÜMAN BİLGİLERİ:
- Dosya Adı: ${fileName || 'Bilinmiyor'}
- Tip: ${mimeType || 'text/plain'}

${analysisPrompt || 'Bu dökümanı özetle ve ana noktalarını çıkar.'}

Yanıtını şu formatta ver:
1. **Özet**: Dökümanın kısa özeti
2. **Ana Noktalar**: Önemli bulgular ve bilgiler
3. **Öneriler**: Varsa aksiyon önerileri

Yanıtın net, öz ve Türkçe olsun.`;

    const userMessage = `Döküman İçeriği:\n\n${truncatedContent}`;

    // Call Gemini API
    const model = 'gemini-2.0-flash-exp';
    const geminiUrl = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: systemPrompt
          }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!geminiResponse.ok) {
      const error = await geminiResponse.json();
      console.error('Gemini API error:', error);
      throw new Error('Gemini API request failed');
    }

    const geminiData = await geminiResponse.json();

    // Extract response text
    const analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    return new Response(
      JSON.stringify({
        analysis,
        fileName,
        contentLength: content.length,
        truncated: content.length > maxLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Document analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
