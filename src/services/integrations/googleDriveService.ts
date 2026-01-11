import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

export interface GoogleDriveSearchResult {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export interface GoogleDriveConnection {
  id: string;
  user_id: string;
  company_id: string;
  connection_name: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scopes: string[];
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
}

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_OAUTH_BASE = 'https://oauth2.googleapis.com/token';

/**
 * Get active Google Drive connection for current user
 */
export async function getGoogleDriveConnection(): Promise<GoogleDriveConnection | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'google_drive')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data;
  } catch (err: any) {
    logger.error('Error getting Google Drive connection:', err);
    return null;
  }
}

/**
 * Check if access token is expired and refresh if needed
 */
async function ensureValidToken(connection: GoogleDriveConnection): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    return await refreshAccessToken(connection);
  }

  // Token is still valid - decrypt and return
  // Note: In production, decryption should happen server-side for security
  return connection.access_token_encrypted;
}

/**
 * Refresh Google OAuth access token
 */
async function refreshAccessToken(connection: GoogleDriveConnection): Promise<string> {
  try {
    // Call Edge Function to refresh token securely
    const { data, error } = await supabase.functions.invoke('refresh-oauth-token', {
      body: {
        connection_id: connection.id,
        platform: 'google_drive'
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
 * Initiate Google OAuth flow
 */
export function initiateGoogleDriveOAuth() {
  // This will be implemented with actual OAuth client ID from environment
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', JSON.stringify({ platform: 'google_drive' }));

  window.location.href = authUrl.toString();
}

/**
 * Search files in Google Drive
 */
export async function searchGoogleDrive(
  query: string,
  options?: {
    mimeType?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<GoogleDriveSearchResult | null> {
  try {
    const connection = await getGoogleDriveConnection();
    if (!connection) {
      throw new Error('No active Google Drive connection');
    }

    const accessToken = await ensureValidToken(connection);

    // Build search query
    let q = `fullText contains '${query.replace(/'/g, "\\'")}'`;
    if (options?.mimeType) {
      q += ` and mimeType='${options.mimeType}'`;
    }
    // Only search files (not trashed)
    q += ' and trashed=false';

    const params = new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime,owners),nextPageToken',
      pageSize: String(options?.pageSize || 20)
    });

    if (options?.pageToken) {
      params.set('pageToken', options.pageToken);
    }

    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google Drive API error');
    }

    const data = await response.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken
    };
  } catch (err: any) {
    logger.error('Error searching Google Drive:', err);
    throw err;
  }
}

/**
 * Get file by ID
 */
export async function getGoogleDriveFile(fileId: string): Promise<GoogleDriveFile | null> {
  try {
    const connection = await getGoogleDriveConnection();
    if (!connection) {
      throw new Error('No active Google Drive connection');
    }

    const accessToken = await ensureValidToken(connection);

    const params = new URLSearchParams({
      fields: 'id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime,owners'
    });

    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.error?.message || 'Google Drive API error');
    }

    return await response.json();
  } catch (err: any) {
    logger.error('Error getting Google Drive file:', err);
    return null;
  }
}

/**
 * Download file content (for text-based files)
 */
export async function downloadGoogleDriveFileContent(fileId: string): Promise<string | null> {
  try {
    const connection = await getGoogleDriveConnection();
    if (!connection) {
      throw new Error('No active Google Drive connection');
    }

    const accessToken = await ensureValidToken(connection);

    // Try to export Google Docs files to plain text
    const file = await getGoogleDriveFile(fileId);
    if (!file) throw new Error('File not found');

    let url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}`;

    // Google Workspace files need to be exported
    if (file.mimeType.startsWith('application/vnd.google-apps')) {
      url += '/export?mimeType=text/plain';
    } else {
      url += '?alt=media';
    }

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
    logger.error('Error downloading Google Drive file:', err);
    return null;
  }
}

/**
 * Analyze document with AI
 */
export async function analyzeGoogleDriveDocument(
  fileId: string,
  analysisPrompt?: string
): Promise<string | null> {
  try {
    // Get file content
    const content = await downloadGoogleDriveFileContent(fileId);
    if (!content) throw new Error('Could not download file content');

    // Get file metadata
    const file = await getGoogleDriveFile(fileId);
    if (!file) throw new Error('File not found');

    // Call Edge Function to analyze with Gemini
    const { data, error } = await supabase.functions.invoke('analyze-document', {
      body: {
        content,
        fileName: file.name,
        mimeType: file.mimeType,
        analysisPrompt: analysisPrompt || 'Summarize this document in Turkish.'
      }
    });

    if (error) throw error;
    return data.analysis;
  } catch (err: any) {
    logger.error('Error analyzing document:', err);
    return null;
  }
}

/**
 * Disconnect Google Drive integration
 */
export async function disconnectGoogleDrive(connectionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_platform_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    logger.error('Error disconnecting Google Drive:', err);
    return false;
  }
}

/**
 * List recent files (for quick access)
 */
export async function listRecentGoogleDriveFiles(pageSize = 10): Promise<GoogleDriveFile[]> {
  try {
    const connection = await getGoogleDriveConnection();
    if (!connection) return [];

    const accessToken = await ensureValidToken(connection);

    const params = new URLSearchParams({
      orderBy: 'modifiedTime desc',
      fields: 'files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime)',
      pageSize: String(pageSize),
      q: 'trashed=false'
    });

    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return data.files || [];
  } catch (err: any) {
    logger.error('Error listing recent files:', err);
    return [];
  }
}
