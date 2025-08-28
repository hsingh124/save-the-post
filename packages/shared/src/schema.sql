-- Instagram Saves Knowledge Dashboard Database Schema
-- Based on PRD data model

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users & authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items (one per IG post URL)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permalink TEXT NOT NULL,
  post_id TEXT,              -- extracted from permalink if available
  creator_handle TEXT,
  media_type TEXT CHECK (media_type IN ('image','video','reel','album')),
  saved_at TIMESTAMPTZ,      -- when user saved/forwarded
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lang TEXT,
  source TEXT NOT NULL CHECK (source IN ('export','telegram','discord','whatsapp','igdm')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','unavailable','error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure unique permalinks per user
CREATE UNIQUE INDEX items_user_permalink_idx ON items(user_id, permalink);
CREATE INDEX items_user_id_idx ON items(user_id);
CREATE INDEX items_creator_handle_idx ON items(creator_handle);
CREATE INDEX items_media_type_idx ON items(media_type);
CREATE INDEX items_status_idx ON items(status);
CREATE INDEX items_saved_at_idx ON items(saved_at);
CREATE INDEX items_ingested_at_idx ON items(ingested_at);

-- Raw/parsed text & embed content
CREATE TABLE item_content (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  embed_html TEXT,
  thumb_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrichment from LLM/heuristics
CREATE TABLE item_enrichment (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  topics TEXT[] DEFAULT '{}',              -- controlled vocabulary
  keywords TEXT[] DEFAULT '{}',            -- freeform search terms
  entities JSONB DEFAULT '{}',             -- {people:[], brands:[], places:[]}
  qualities TEXT[] DEFAULT '{}',           -- e.g., how-to, tutorial, opinion
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vector embeddings for similarity search
CREATE TABLE item_embeddings (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  embedding vector(768),                   -- 768-dimensional embeddings
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User collections for organization
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX collections_user_id_idx ON collections(user_id);

-- Collection-item relationships
CREATE TABLE collection_items (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, item_id)
);

CREATE INDEX collection_items_collection_id_idx ON collection_items(collection_id);
CREATE INDEX collection_items_item_id_idx ON collection_items(item_id);

-- User notes on items
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_item_id_idx ON notes(item_id);
CREATE INDEX notes_user_id_idx ON notes(user_id);

-- Background jobs for processing
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('hydrate','tag','embed','import')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','error')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX jobs_user_id_idx ON jobs(user_id);
CREATE INDEX jobs_type_idx ON jobs(type);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_created_at_idx ON jobs(created_at);

-- Audit logging for compliance
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_action_idx ON audit_log(action);
CREATE INDEX audit_log_item_id_idx ON audit_log(item_id);
CREATE INDEX audit_log_at_idx ON audit_log(at);

-- Instagram oEmbed cache
CREATE TABLE oembed_cache (
  url TEXT PRIMARY KEY,
  embed_html TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX oembed_cache_expires_at_idx ON oembed_cache(expires_at);

-- Search synonyms for query expansion
CREATE TABLE search_synonyms (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_synonyms_term_idx ON search_synonyms(term);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_content_updated_at BEFORE UPDATE ON item_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_enrichment_updated_at BEFORE UPDATE ON item_enrichment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_search_synonyms_updated_at BEFORE UPDATE ON search_synonyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default search synonyms
INSERT INTO search_synonyms (term, synonyms) VALUES
  ('meal prep', ARRAY['batch cooking', 'food prep', 'meal planning']),
  ('workout', ARRAY['exercise', 'training', 'fitness routine']),
  ('coding', ARRAY['programming', 'development', 'software']),
  ('recipe', ARRAY['cooking', 'dish', 'meal']),
  ('tutorial', ARRAY['how-to', 'guide', 'lesson']),
  ('inspiration', ARRAY['motivation', 'ideas', 'creativity']),
  ('travel', ARRAY['vacation', 'trip', 'adventure']),
  ('design', ARRAY['art', 'creativity', 'aesthetics']);

-- Create a view for search results
CREATE VIEW search_results AS
SELECT 
  i.id as item_id,
  i.permalink,
  i.creator_handle,
  i.media_type,
  i.saved_at,
  i.lang,
  ic.caption,
  ic.hashtags,
  ic.thumb_url,
  ie.topics,
  ie.keywords,
  ie.entities,
  ie.qualities,
  ie.confidence
FROM items i
LEFT JOIN item_content ic ON i.id = ic.item_id
LEFT JOIN item_enrichment ie ON i.id = ie.item_id
WHERE i.status = 'active';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
