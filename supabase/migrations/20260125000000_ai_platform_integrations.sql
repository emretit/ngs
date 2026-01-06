-- FAZ 4: AI Platform Integrations Migration
-- Google Drive, SharePoint, Teams entegrasyonları için database şeması

-- Platform bağlantıları tablosu (OAuth connections)
CREATE TABLE IF NOT EXISTS ai_platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'google_drive', 'sharepoint', 'onedrive', 'teams'
  connection_name VARCHAR(255),
  access_token_encrypted TEXT NOT NULL, -- Encrypted with Supabase Vault
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes JSONB DEFAULT '[]'::jsonb,
  connection_metadata JSONB DEFAULT '{}'::jsonb, -- Platform-specific data (site_id, drive_id, etc.)
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform, connection_name),
  CHECK (platform IN ('google_drive', 'sharepoint', 'onedrive', 'teams'))
);

-- İndeksler
CREATE INDEX idx_ai_platform_connections_user
  ON ai_platform_connections(user_id, is_active);

CREATE INDEX idx_ai_platform_connections_company
  ON ai_platform_connections(company_id, platform, is_active);

-- Harici dökümanlar tablosu (indexed external documents)
CREATE TABLE IF NOT EXISTS ai_external_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES ai_platform_connections(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  platform_file_id VARCHAR(500) NOT NULL, -- File ID from platform (Google Drive, SharePoint)
  file_name VARCHAR(500),
  file_type VARCHAR(100), -- MIME type
  file_url TEXT,
  file_metadata JSONB DEFAULT '{}'::jsonb, -- Size, owner, created date, etc.
  content_summary TEXT, -- AI-generated summary for quick reference
  indexed_content TEXT, -- Full text content for search (truncated if needed)
  last_indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(connection_id, platform_file_id)
);

-- İndeksler
CREATE INDEX idx_ai_external_documents_company
  ON ai_external_documents(company_id);

CREATE INDEX idx_ai_external_documents_connection
  ON ai_external_documents(connection_id, last_indexed_at);

-- Full-text search index (Türkçe dil desteği ile)
CREATE INDEX idx_ai_external_documents_search
  ON ai_external_documents
  USING gin(to_tsvector('turkish', file_name || ' ' || COALESCE(indexed_content, '')));

-- Teams webhooks tablosu
CREATE TABLE IF NOT EXISTS teams_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_teams_webhooks_company
  ON teams_webhooks(company_id, is_active);

-- RLS Policies

-- ai_platform_connections: Kullanıcı sadece kendi bağlantılarını görebilir
ALTER TABLE ai_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platform connections"
  ON ai_platform_connections
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own platform connections"
  ON ai_platform_connections
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own platform connections"
  ON ai_platform_connections
  FOR UPDATE
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete own platform connections"
  ON ai_platform_connections
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- ai_external_documents: Şirket bazlı erişim
ALTER TABLE ai_external_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view external documents"
  ON ai_external_documents
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert external documents"
  ON ai_external_documents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update external documents"
  ON ai_external_documents
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can delete external documents"
  ON ai_external_documents
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- teams_webhooks: Şirket bazlı erişim
ALTER TABLE teams_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view teams webhooks"
  ON teams_webhooks
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can insert teams webhooks"
  ON teams_webhooks
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can update teams webhooks"
  ON teams_webhooks
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can delete teams webhooks"
  ON teams_webhooks
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ai_platform_connections_updated_at
  BEFORE UPDATE ON ai_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_external_documents_updated_at
  BEFORE UPDATE ON ai_external_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_webhooks_updated_at
  BEFORE UPDATE ON teams_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Search external documents
CREATE OR REPLACE FUNCTION search_external_documents(
  p_company_id UUID,
  p_query TEXT,
  p_platform TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  connection_id UUID,
  platform_file_id VARCHAR,
  file_name VARCHAR,
  file_type VARCHAR,
  file_url TEXT,
  file_metadata JSONB,
  content_summary TEXT,
  last_indexed_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.id,
    ed.connection_id,
    ed.platform_file_id,
    ed.file_name,
    ed.file_type,
    ed.file_url,
    ed.file_metadata,
    ed.content_summary,
    ed.last_indexed_at,
    ts_rank(
      to_tsvector('turkish', ed.file_name || ' ' || COALESCE(ed.indexed_content, '')),
      plainto_tsquery('turkish', p_query)
    ) AS rank
  FROM ai_external_documents ed
  JOIN ai_platform_connections pc ON pc.id = ed.connection_id
  WHERE
    ed.company_id = p_company_id
    AND (p_platform IS NULL OR pc.platform = p_platform)
    AND to_tsvector('turkish', ed.file_name || ' ' || COALESCE(ed.indexed_content, ''))
        @@ plainto_tsquery('turkish', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE ai_platform_connections IS 'OAuth connections for external platforms (Google Drive, SharePoint, Teams)';
COMMENT ON TABLE ai_external_documents IS 'Indexed external documents from connected platforms for AI search';
COMMENT ON TABLE teams_webhooks IS 'Microsoft Teams Incoming Webhooks for notifications';
COMMENT ON FUNCTION search_external_documents IS 'Full-text search across indexed external documents';
