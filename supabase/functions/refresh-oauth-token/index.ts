// Refresh OAuth Access Tokens for Platform Integrations

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
}

interface PlatformConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  google_drive: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || ''
  },
  sharepoint: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET') || ''
  },
  teams: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID') || '',
    clientSecret: Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET') || ''
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

    const body = await req.json();
    const { connection_id, platform } = body;

    if (!connection_id || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing connection_id or platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get connection from database
    const { data: connection, error: connError } = await supabaseClient
      .from('ai_platform_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found');
    }

    if (!connection.refresh_token_encrypted) {
      throw new Error('No refresh token available');
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error('Invalid platform');
    }

    // Refresh the token
    const tokenResponse = await refreshToken(
      connection.refresh_token_encrypted,
      platform,
      config
    );

    if (!tokenResponse) {
      throw new Error('Failed to refresh token');
    }

    // Calculate new expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

    // Update connection with new token
    const { error: updateError } = await supabaseClient
      .from('ai_platform_connections')
      .update({
        access_token_encrypted: tokenResponse.access_token, // TODO: Encrypt with Vault
        refresh_token_encrypted: tokenResponse.refresh_token || connection.refresh_token_encrypted,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update connection');
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: tokenResponse.access_token,
        expires_at: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Refresh token error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Refresh OAuth access token using refresh token
 */
async function refreshToken(
  refreshToken: string,
  platform: string,
  config: PlatformConfig
): Promise<OAuthTokenResponse | null> {
  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
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
      console.error('Token refresh error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Refresh token error:', error);
    return null;
  }
}
