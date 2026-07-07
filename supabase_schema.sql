-- Supabase schema for Anchor
-- Run this in Supabase SQL Editor

CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  filename TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding JSONB,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  customer_identifier TEXT,
  started_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT DEFAULT 'default',
  conversation_id UUID REFERENCES conversations(id),
  name TEXT,
  phone TEXT,
  intent TEXT,
  interested_product TEXT,
  buying_probability TEXT DEFAULT 'medium',
  urgency TEXT DEFAULT 'medium',
  recommended_action TEXT,
  estimated_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_leads_conversation_id ON leads(conversation_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);
CREATE INDEX idx_leads_buying_probability ON leads(buying_probability);

-- Row Level Security policies (required for Supabase anon key access)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on document_chunks" ON document_chunks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
