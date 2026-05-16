-- Add missing columns if they don't exist
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS available_colors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_sizes TEXT[] DEFAULT '{}';

-- Full text search index
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS
    search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('french',
        coalesce(name, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(category, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS
  products_search_idx
  ON products
  USING GIN(search_vector);

-- Search history for suggestions
CREATE TABLE IF NOT EXISTS
  search_history (
  id UUID DEFAULT gen_random_uuid()
    PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Popular searches (aggregated)
CREATE OR REPLACE VIEW 
  popular_searches AS
  SELECT 
    query,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results
  FROM search_history
  WHERE created_at > NOW() - 
    INTERVAL '30 days'
  GROUP BY query
  ORDER BY search_count DESC
  LIMIT 10;

-- RLS
ALTER TABLE search_history
  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_history_all" ON search_history;
CREATE POLICY "search_history_all"
  ON search_history FOR ALL
  USING (true);
