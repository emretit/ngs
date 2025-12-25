-- Create ai_conversations table for storing AI chat sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ai_messages table for storing individual messages in conversations
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_company_id ON ai_conversations(company_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(conversation_id, created_at ASC);

-- Create updated_at trigger for ai_conversations
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversations_updated_at();

-- Auto-update conversation updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Row Level Security (RLS) Policies for ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own AI conversations"
  ON ai_conversations
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can insert their own conversations
CREATE POLICY "Users can insert own AI conversations"
  ON ai_conversations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own conversations
CREATE POLICY "Users can update own AI conversations"
  ON ai_conversations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can delete their own conversations
CREATE POLICY "Users can delete own AI conversations"
  ON ai_conversations
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Row Level Security (RLS) Policies for ai_messages
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their own conversations
CREATE POLICY "Users can view own AI messages"
  ON ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages in their own conversations
CREATE POLICY "Users can insert own AI messages"
  ON ai_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can update messages in their own conversations
CREATE POLICY "Users can update own AI messages"
  ON ai_messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can delete messages in their own conversations
CREATE POLICY "Users can delete own AI messages"
  ON ai_messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE ai_conversations IS 'Stores AI chat conversation sessions for each user';
COMMENT ON TABLE ai_messages IS 'Stores individual messages within AI conversations';
COMMENT ON COLUMN ai_messages.role IS 'Message sender role: user, assistant, or system';
COMMENT ON COLUMN ai_messages.metadata IS 'Additional data like SQL queries, chart configs, etc.';
