import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface TeamsWebhookConfig {
  id: string;
  company_id: string;
  webhook_url: string;
  channel_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TeamsMessageCard {
  '@type': 'MessageCard';
  '@context': 'https://schema.org/extensions';
  summary: string;
  themeColor: string;
  title: string;
  sections: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts?: Array<{
      name: string;
      value: string;
    }>;
    text?: string;
    markdown?: boolean;
  }>;
  potentialAction?: Array<{
    '@type': 'OpenUri';
    name: string;
    targets: Array<{
      os: 'default';
      uri: string;
    }>;
  }>;
}

export interface TeamsConnection {
  id: string;
  user_id: string;
  company_id: string;
  connection_name: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scopes: string[];
  is_active: boolean;
  connection_metadata: {
    team_id?: string;
    team_name?: string;
    channel_id?: string;
  };
  last_sync_at?: string;
  created_at: string;
}

const MICROSOFT_GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Get active Teams connection for current user
 */
export async function getTeamsConnection(): Promise<TeamsConnection | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'teams')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (err: any) {
    logger.error('Error getting Teams connection:', err);
    return null;
  }
}

/**
 * Check if access token is expired and refresh if needed
 */
async function ensureValidToken(connection: TeamsConnection): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    return await refreshAccessToken(connection);
  }

  return connection.access_token_encrypted;
}

/**
 * Refresh Microsoft OAuth access token
 */
async function refreshAccessToken(connection: TeamsConnection): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('refresh-oauth-token', {
      body: {
        connection_id: connection.id,
        platform: 'teams'
      }
    });

    if (error) throw error;
    return data.access_token;
  } catch (err: any) {
    logger.error('Error refreshing access token:', err);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Initiate Teams OAuth flow
 */
export function initiateTeamsOAuth() {
  const clientId = import.meta.env.VITE_MICROSOFT_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
  const scopes = [
    'ChannelMessage.Send',
    'Chat.ReadWrite',
    'Team.ReadBasic.All',
    'User.Read'
  ];

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', JSON.stringify({ platform: 'teams' }));

  window.location.href = authUrl.toString();
}

/**
 * Send message to Teams channel using Graph API
 */
export async function sendTeamsChannelMessage(
  teamId: string,
  channelId: string,
  message: {
    subject?: string;
    body: string;
  }
): Promise<boolean> {
  try {
    const connection = await getTeamsConnection();
    if (!connection) {
      throw new Error('No active Teams connection');
    }

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/teams/${teamId}/channels/${channelId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: message.subject,
        body: {
          contentType: 'html',
          content: message.body
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Teams API error');
    }

    return true;
  } catch (err: any) {
    logger.error('Error sending Teams message:', err);
    return false;
  }
}

/**
 * Send message using Incoming Webhook (simpler, doesn't require auth)
 */
export async function sendTeamsWebhookMessage(
  webhookUrl: string,
  card: TeamsMessageCard
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    });

    if (!response.ok) {
      throw new Error('Failed to send webhook message');
    }

    return true;
  } catch (err: any) {
    logger.error('Error sending Teams webhook:', err);
    return false;
  }
}

/**
 * Create Teams notification card for workflow completion
 */
export function createWorkflowCompletionCard(
  workflowName: string,
  status: 'completed' | 'failed',
  details: {
    duration: string;
    stepsCompleted: number;
    totalSteps: number;
    error?: string;
  },
  actionUrl?: string
): TeamsMessageCard {
  const isSuccess = status === 'completed';

  const card: TeamsMessageCard = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Workflow ${workflowName} ${isSuccess ? 'tamamlandı' : 'başarısız oldu'}`,
    themeColor: isSuccess ? '28a745' : 'dc3545',
    title: `🤖 AI Workflow: ${workflowName}`,
    sections: [
      {
        activityTitle: isSuccess ? '✅ Workflow Tamamlandı' : '❌ Workflow Başarısız',
        activitySubtitle: new Date().toLocaleString('tr-TR'),
        facts: [
          {
            name: 'Durum',
            value: isSuccess ? 'Başarılı' : 'Başarısız'
          },
          {
            name: 'Süre',
            value: details.duration
          },
          {
            name: 'Adımlar',
            value: `${details.stepsCompleted} / ${details.totalSteps}`
          }
        ]
      }
    ]
  };

  if (details.error) {
    card.sections.push({
      text: `**Hata:** ${details.error}`,
      markdown: true
    });
  }

  if (actionUrl) {
    card.potentialAction = [
      {
        '@type': 'OpenUri',
        name: 'Detayları Görüntüle',
        targets: [
          {
            os: 'default',
            uri: actionUrl
          }
        ]
      }
    ];
  }

  return card;
}

/**
 * Create Teams notification card for approval request
 */
export function createApprovalRequestCard(
  workflowName: string,
  requestedBy: string,
  approvalData: Record<string, any>,
  approveUrl: string,
  rejectUrl: string
): TeamsMessageCard {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `${workflowName} onay bekliyor`,
    themeColor: 'ff9800',
    title: `⏳ Onay Gerekli: ${workflowName}`,
    sections: [
      {
        activityTitle: '🔔 Workflow Onayı Bekleniyor',
        activitySubtitle: `Talep eden: ${requestedBy}`,
        facts: Object.entries(approvalData).map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        }))
      }
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: '✅ Onayla',
        targets: [
          {
            os: 'default',
            uri: approveUrl
          }
        ]
      },
      {
        '@type': 'OpenUri',
        name: '❌ Reddet',
        targets: [
          {
            os: 'default',
            uri: rejectUrl
          }
        ]
      }
    ]
  };
}

/**
 * Create Teams notification card for AI insight
 */
export function createInsightNotificationCard(
  title: string,
  description: string,
  severity: 'info' | 'warning' | 'critical' | 'opportunity',
  recommendations: string[],
  actionUrl?: string
): TeamsMessageCard {
  const colorMap = {
    info: '0078d4',
    warning: 'ff9800',
    critical: 'dc3545',
    opportunity: '28a745'
  };

  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
    opportunity: '💡'
  };

  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: title,
    themeColor: colorMap[severity],
    title: `${iconMap[severity]} ${title}`,
    sections: [
      {
        text: description,
        markdown: true
      },
      {
        activityTitle: 'Öneriler',
        facts: recommendations.map((rec, i) => ({
          name: `${i + 1}`,
          value: rec
        }))
      }
    ],
    potentialAction: actionUrl
      ? [
          {
            '@type': 'OpenUri',
            name: 'Detayları Görüntüle',
            targets: [
              {
                os: 'default',
                uri: actionUrl
              }
            ]
          }
        ]
      : undefined
  };
}

/**
 * List Teams for connected user
 */
export async function listTeams(): Promise<any[]> {
  try {
    const connection = await getTeamsConnection();
    if (!connection) return [];

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/me/joinedTeams`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list teams');
    }

    const data = await response.json();
    return data.value || [];
  } catch (err: any) {
    logger.error('Error listing teams:', err);
    return [];
  }
}

/**
 * List channels in a Team
 */
export async function listTeamChannels(teamId: string): Promise<any[]> {
  try {
    const connection = await getTeamsConnection();
    if (!connection) return [];

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/teams/${teamId}/channels`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list channels');
    }

    const data = await response.json();
    return data.value || [];
  } catch (err: any) {
    logger.error('Error listing channels:', err);
    return [];
  }
}

/**
 * Disconnect Teams integration
 */
export async function disconnectTeams(connectionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_platform_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    logger.error('Error disconnecting Teams:', err);
    return false;
  }
}

/**
 * Get Teams webhook configurations for company
 */
export async function getTeamsWebhooks(): Promise<TeamsWebhookConfig[]> {
  try {
    const { data, error } = await supabase
      .from('teams_webhooks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    logger.error('Error getting Teams webhooks:', err);
    return [];
  }
}

/**
 * Add Teams webhook
 */
export async function addTeamsWebhook(
  webhookUrl: string,
  channelName: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Company not found');

    const { error } = await supabase.from('teams_webhooks').insert({
      company_id: profile.company_id,
      webhook_url: webhookUrl,
      channel_name: channelName,
      is_active: true
    });

    if (error) throw error;
    return true;
  } catch (err: any) {
    logger.error('Error adding Teams webhook:', err);
    return false;
  }
}
