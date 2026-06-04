-- 0009_grocery_store_prices.sql
-- Cheapest Grocery Store: stores + ingredient_prices tables.
-- Populated by the user-triggered Kroger sync (lib/sync-prices.ts); no seeded prices.

-- ============================================================
-- stores
-- ============================================================
CREATE TABLE stores (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  region             text        NOT NULL DEFAULT 'default',
  is_active          boolean     NOT NULL DEFAULT true,
  kroger_location_id text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ingredient_prices
-- ============================================================
CREATE TABLE ingredient_prices (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       uuid          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  canonical_name text          NOT NULL,
  price          numeric(10,2) NOT NULL CHECK (price >= 0),
  unit           text          NOT NULL,
  in_stock       boolean       NOT NULL DEFAULT true,
  updated_at     timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (store_id, canonical_name)
);

CREATE INDEX ingredient_prices_store_id_idx       ON ingredient_prices (store_id);
CREATE INDEX ingredient_prices_canonical_name_idx ON ingredient_prices (canonical_name);

-- ============================================================
-- updated_at trigger
-- Auto-stamps updated_at on UPDATE so sync upserts always record
-- the true time of the last change without special handling.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ingredient_prices_set_updated_at
  BEFORE UPDATE ON ingredient_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Row-Level Security
-- Public read matches every other table in this project.
-- Writes go through service_role (sync action), which bypasses RLS.
-- ============================================================
ALTER TABLE stores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON stores            FOR SELECT USING (true);
CREATE POLICY "public read" ON ingredient_prices FOR SELECT USING (true);

-- ============================================================
-- Seed stores
-- Replace kroger_location_id values with real locationIds for the
-- admin's region before the first sync run (see quickstart.md Step 3).
-- ============================================================
INSERT INTO stores (name, region, is_active, kroger_location_id) VALUES
  ('Ralphs — Wilshire',   'default', true, '70300168'),
  ('Kroger — Main Street', 'default', true, '01400376');
