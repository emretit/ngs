-- FAZ 5: AI Proactive Insights Migration
-- Anomaly detection, predictive analytics, optimization suggestions

-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'anomaly', 'prediction', 'optimization', 'risk'
  category VARCHAR(100), -- 'sales', 'finance', 'inventory', 'hr', 'operations', 'general'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'critical', 'opportunity'
  impact_score INT CHECK (impact_score >= 1 AND impact_score <= 100),
  data_summary JSONB DEFAULT '{}'::jsonb, -- Supporting data for the insight
  recommendations JSONB DEFAULT '[]'::jsonb, -- Array of recommendation strings
  related_entities JSONB DEFAULT '[]'::jsonb, -- [{type: 'invoice', id: 'uuid'}]
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  actionable BOOLEAN DEFAULT true,
  action_url VARCHAR(500), -- Deep link to relevant page
  expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive insights
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (insight_type IN ('anomaly', 'prediction', 'optimization', 'risk')),
  CHECK (category IN ('sales', 'finance', 'inventory', 'hr', 'operations', 'general')),
  CHECK (severity IN ('info', 'warning', 'critical', 'opportunity'))
);

-- Insight interactions table (for tracking user engagement)
CREATE TABLE IF NOT EXISTS ai_insight_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'viewed', 'dismissed', 'acted', 'shared', 'feedback'
  feedback VARCHAR(50), -- Optional: 'helpful', 'not_helpful', 'inaccurate'
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (action IN ('viewed', 'dismissed', 'acted', 'shared', 'feedback')),
  CHECK (feedback IS NULL OR feedback IN ('helpful', 'not_helpful', 'inaccurate'))
);

-- Indexes for performance
CREATE INDEX idx_ai_insights_company_active
  ON ai_insights(company_id, is_dismissed)
  WHERE is_dismissed = false;

CREATE INDEX idx_ai_insights_severity
  ON ai_insights(severity, created_at DESC);

CREATE INDEX idx_ai_insights_category
  ON ai_insights(company_id, category, created_at DESC);

CREATE INDEX idx_ai_insights_type
  ON ai_insights(company_id, insight_type, created_at DESC);

CREATE INDEX idx_ai_insights_impact
  ON ai_insights(company_id, impact_score DESC, created_at DESC);

CREATE INDEX idx_ai_insight_interactions_insight
  ON ai_insight_interactions(insight_id, created_at DESC);

CREATE INDEX idx_ai_insight_interactions_user
  ON ai_insight_interactions(user_id, created_at DESC);

-- RLS Policies

-- ai_insights: Company-based access
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view insights"
  ON ai_insights
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert insights"
  ON ai_insights
  FOR INSERT
  WITH CHECK (true); -- Edge Function will insert with service role

CREATE POLICY "Company users can update insights"
  ON ai_insights
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company users can delete insights"
  ON ai_insights
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ai_insight_interactions: User-based access
ALTER TABLE ai_insight_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions"
  ON ai_insight_interactions
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own interactions"
  ON ai_insight_interactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Helper function: Get active insights for company
CREATE OR REPLACE FUNCTION get_active_insights(
  p_company_id UUID,
  p_category VARCHAR DEFAULT NULL,
  p_severity VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  insight_type VARCHAR,
  category VARCHAR,
  title VARCHAR,
  description TEXT,
  severity VARCHAR,
  impact_score INT,
  data_summary JSONB,
  recommendations JSONB,
  related_entities JSONB,
  is_read BOOLEAN,
  actionable BOOLEAN,
  action_url VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.insight_type,
    i.category,
    i.title,
    i.description,
    i.severity,
    i.impact_score,
    i.data_summary,
    i.recommendations,
    i.related_entities,
    i.is_read,
    i.actionable,
    i.action_url,
    i.created_at
  FROM ai_insights i
  WHERE
    i.company_id = p_company_id
    AND i.is_dismissed = false
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
    AND (p_category IS NULL OR i.category = p_category)
    AND (p_severity IS NULL OR i.severity = p_severity)
  ORDER BY
    CASE i.severity
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'opportunity' THEN 3
      WHEN 'info' THEN 4
    END,
    i.impact_score DESC,
    i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get insight statistics
CREATE OR REPLACE FUNCTION get_insight_stats(
  p_company_id UUID
)
RETURNS TABLE (
  total INT,
  critical_count INT,
  warning_count INT,
  opportunity_count INT,
  unread_count INT,
  dismissed_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total,
    COUNT(*) FILTER (WHERE severity = 'critical')::INT AS critical_count,
    COUNT(*) FILTER (WHERE severity = 'warning')::INT AS warning_count,
    COUNT(*) FILTER (WHERE severity = 'opportunity')::INT AS opportunity_count,
    COUNT(*) FILTER (WHERE is_read = false AND is_dismissed = false)::INT AS unread_count,
    COUNT(*) FILTER (WHERE is_dismissed = true)::INT AS dismissed_count
  FROM ai_insights
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Clean up old dismissed insights (automated cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_insights()
RETURNS void AS $$
BEGIN
  -- Delete dismissed insights older than 90 days
  DELETE FROM ai_insights
  WHERE is_dismissed = true
    AND created_at < NOW() - INTERVAL '90 days';

  -- Delete expired insights
  DELETE FROM ai_insights
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ai_insights IS 'AI-generated proactive insights: anomalies, predictions, optimizations, and risks';
COMMENT ON TABLE ai_insight_interactions IS 'User interactions with insights for ML feedback loop';
COMMENT ON FUNCTION get_active_insights IS 'Retrieve active insights for a company with optional filters';
COMMENT ON FUNCTION get_insight_stats IS 'Get insight statistics for dashboard';
COMMENT ON FUNCTION cleanup_old_insights IS 'Periodic cleanup of dismissed and expired insights';
