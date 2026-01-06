// OAuth 2.0 Callback Handler for Platform Integrations
// Handles Google Drive, SharePoint, OneDrive, and Teams OAuth flows

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface PlatformConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  google_drive: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '',
    redirectUri: `${Deno.env.get('SITE_URL')}/integrations/oauth/callback`
  },
  sharepoint: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET') || '',
    redirectUri: `${Deno.env.get('SITE_URL')}/integrations/oauth/callback`
  },
  teams: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET') || '',
    redirectUri: `${Deno.env.get('SITE_URL')}/integrations/oauth/callback`
  }
};

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

    // Get company_id from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const url = new URL(req.url);

    // Exchange authorization code for tokens
    if (req.method === 'POST') {
      const body = await req.json();
      const { code, platform, state } = body;

      if (!code || !platform) {
        return new Response(
          JSON.stringify({ error: 'Missing code or platform' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const config = PLATFORM_CONFIGS[platform];
      if (!config) {
        return new Response(
          JSON.stringify({ error: 'Invalid platform' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForToken(code, platform, config);

      if (!tokenResponse) {
        throw new Error('Failed to exchange code for token');
      }

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

      // Store connection in database
      // Note: In production, tokens should be encrypted using Supabase Vault
      const { data: connection, error: insertError } = await supabaseClient
        .from('ai_platform_connections')
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          platform,
          connection_name: 'Default',
          access_token_encrypted: tokenResponse.access_token, // TODO: Encrypt with Vault
          refresh_token_encrypted: tokenResponse.refresh_token || null,
          token_expires_at: expiresAt.toISOString(),
          scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
          connection_metadata: {},
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to store connection');
      }

      return new Response(
        JSON.stringify({
          success: true,
          connection_id: connection.id,
          platform
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET request: Return OAuth URL for platform
    if (req.method === 'GET') {
      const platform = url.searchParams.get('platform');

      if (!platform) {
        return new Response(
          JSON.stringify({ error: 'Platform parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const config = PLATFORM_CONFIGS[platform];
      if (!config) {
        return new Response(
          JSON.stringify({ error: 'Invalid platform' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return platform configuration for client-side OAuth initiation
      return new Response(
        JSON.stringify({
          platform,
          redirect_uri: config.redirectUri
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Exchange authorization code for access/refresh tokens
 */
async function exchangeCodeForToken(
  code: string,
  platform: string,
  config: PlatformConfig
): Promise<OAuthTokenResponse | null> {
  try {
    const params = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Token exchange error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Exchange code error:', error);
    return null;
  }
}
