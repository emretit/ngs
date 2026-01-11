import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy?: {
    user: {
      displayName: string;
      email: string;
    };
  };
}

export interface SharePointSearchResult {
  files: SharePointFile[];
  nextLink?: string;
}

export interface SharePointConnection {
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
    site_id?: string;
    site_name?: string;
    drive_id?: string;
  };
  last_sync_at?: string;
  created_at: string;
}

const MICROSOFT_GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Get active SharePoint connection for current user
 */
export async function getSharePointConnection(): Promise<SharePointConnection | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'sharepoint')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (err: any) {
    logger.error('Error getting SharePoint connection:', err);
    return null;
  }
}

/**
 * Check if access token is expired and refresh if needed
 */
async function ensureValidToken(connection: SharePointConnection): Promise<string> {
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
async function refreshAccessToken(connection: SharePointConnection): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('refresh-oauth-token', {
      body: {
        connection_id: connection.id,
        platform: 'sharepoint'
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
 * Initiate SharePoint OAuth flow
 */
export function initiateSharePointOAuth() {
  const clientId = import.meta.env.VITE_MICROSOFT_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
  const scopes = [
    'Files.Read.All',
    'Sites.Read.All',
    'User.Read'
  ];

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', JSON.stringify({ platform: 'sharepoint' }));

  window.location.href = authUrl.toString();
}

/**
 * Search files in SharePoint
 */
export async function searchSharePoint(
  query: string,
  options?: {
    siteId?: string;
    driveId?: string;
    top?: number;
  }
): Promise<SharePointSearchResult | null> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) {
      throw new Error('No active SharePoint connection');
    }

    const accessToken = await ensureValidToken(connection);

    // Use Microsoft Graph Search API
    const searchUrl = `${MICROSOFT_GRAPH_API_BASE}/search/query`;

    const searchBody = {
      requests: [
        {
          entityTypes: ['driveItem'],
          query: {
            queryString: query
          },
          from: 0,
          size: options?.top || 20
        }
      ]
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'SharePoint API error');
    }

    const data = await response.json();
    const hits = data.value?.[0]?.hitsContainers?.[0]?.hits || [];

    const files: SharePointFile[] = hits.map((hit: any) => ({
      id: hit.resource.id,
      name: hit.resource.name,
      webUrl: hit.resource.webUrl,
      size: hit.resource.size,
      createdDateTime: hit.resource.createdDateTime,
      lastModifiedDateTime: hit.resource.lastModifiedDateTime,
      createdBy: hit.resource.createdBy
    }));

    return {
      files,
      nextLink: data.value?.[0]?.hitsContainers?.[0]?.moreResultsAvailable
        ? data.value[0].hitsContainers[0].cursor
        : undefined
    };
  } catch (err: any) {
    logger.error('Error searching SharePoint:', err);
    throw err;
  }
}

/**
 * Get file by ID from SharePoint
 */
export async function getSharePointFile(
  siteId: string,
  driveId: string,
  itemId: string
): Promise<SharePointFile | null> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) {
      throw new Error('No active SharePoint connection');
    }

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/items/${itemId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.error?.message || 'SharePoint API error');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      webUrl: data.webUrl,
      size: data.size,
      createdDateTime: data.createdDateTime,
      lastModifiedDateTime: data.lastModifiedDateTime,
      createdBy: data.createdBy
    };
  } catch (err: any) {
    logger.error('Error getting SharePoint file:', err);
    return null;
  }
}

/**
 * Download file content from SharePoint
 */
export async function downloadSharePointFileContent(
  siteId: string,
  driveId: string,
  itemId: string
): Promise<string | null> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) {
      throw new Error('No active SharePoint connection');
    }

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/items/${itemId}/content`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download file content');
    }

    return await response.text();
  } catch (err: any) {
    logger.error('Error downloading SharePoint file:', err);
    return null;
  }
}

/**
 * List document libraries in SharePoint site
 */
export async function listSharePointDrives(siteId: string): Promise<any[]> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) return [];

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/sites/${siteId}/drives`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list drives');
    }

    const data = await response.json();
    return data.value || [];
  } catch (err: any) {
    logger.error('Error listing SharePoint drives:', err);
    return [];
  }
}

/**
 * List recent files from SharePoint
 */
export async function listRecentSharePointFiles(top = 10): Promise<SharePointFile[]> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) return [];

    const accessToken = await ensureValidToken(connection);

    // Get recent files from user's OneDrive (includes shared files)
    const url = `${MICROSOFT_GRAPH_API_BASE}/me/drive/recent?$top=${top}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list recent files');
    }

    const data = await response.json();
    return (data.value || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      size: item.size,
      createdDateTime: item.createdDateTime,
      lastModifiedDateTime: item.lastModifiedDateTime,
      createdBy: item.createdBy
    }));
  } catch (err: any) {
    logger.error('Error listing recent files:', err);
    return [];
  }
}

/**
 * Upload file to SharePoint
 */
export async function uploadToSharePoint(
  siteId: string,
  driveId: string,
  fileName: string,
  content: Blob
): Promise<SharePointFile | null> {
  try {
    const connection = await getSharePointConnection();
    if (!connection) {
      throw new Error('No active SharePoint connection');
    }

    const accessToken = await ensureValidToken(connection);

    const url = `${MICROSOFT_GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: content
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      webUrl: data.webUrl,
      size: data.size,
      createdDateTime: data.createdDateTime,
      lastModifiedDateTime: data.lastModifiedDateTime,
      createdBy: data.createdBy
    };
  } catch (err: any) {
    logger.error('Error uploading to SharePoint:', err);
    return null;
  }
}

/**
 * Disconnect SharePoint integration
 */
export async function disconnectSharePoint(connectionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_platform_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    logger.error('Error disconnecting SharePoint:', err);
    return false;
  }
}
