-- 0001_initial_schema.sql
-- Recipe Website: initial Supabase schema

-- ============================================================
-- recipes
-- ============================================================
CREATE TABLE recipes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          text        NOT NULL UNIQUE,
  title        text        NOT NULL,
  prep_minutes integer,
  total_minutes integer,
  servings     integer,
  notes        text,
  source       text,
  weekday      boolean     NOT NULL DEFAULT false,
  title_fts    tsvector    GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,
  created_at   timestamptz NOT NULL
);

CREATE INDEX idx_recipes_title_fts  ON recipes USING GIN (title_fts);
CREATE INDEX idx_recipes_created_at ON recipes (created_at DESC);

-- ============================================================
-- tags
-- ============================================================
CREATE TABLE tags (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid      text NOT NULL UNIQUE,
  name     text NOT NULL,
  category text NOT NULL,
  CONSTRAINT tags_category_check CHECK (category IN ('ingredient', 'cuisine', 'type', 'season'))
);

CREATE INDEX idx_tags_category_name ON tags (category, name);

-- ============================================================
-- recipe_tags  (many-to-many junction)
-- ============================================================
CREATE TABLE recipe_tags (
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags (tag_id);

-- ============================================================
-- ingredient_entries
-- ============================================================
CREATE TABLE ingredient_entries (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position    integer NOT NULL,
  type        text    NOT NULL,
  name        text    NOT NULL,
  amount      text,
  preparation text,
  aisle       text,
  CONSTRAINT ingredient_entries_type_check CHECK (type IN ('heading', 'ingredient')),
  CONSTRAINT ingredient_entries_aisle_check CHECK (
    aisle IS NULL OR aisle IN (
      'Beer and Wine', 'Produce', 'Deli', 'Bread', 'Seafood', 'Meat',
      'Cheese', 'World Aisle', 'Pasta', 'Condiments', 'Soups & Canned Goods',
      'Spices', 'Baking', 'Cereal', 'Chips', 'Soda', 'Frozen', 'Dairy'
    )
  )
);

CREATE INDEX idx_ingredient_entries_recipe_position ON ingredient_entries (recipe_id, position);

-- ============================================================
-- instruction_entries
-- ============================================================
CREATE TABLE instruction_entries (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position  integer NOT NULL,
  type      text    NOT NULL,
  text      text    NOT NULL,
  CONSTRAINT instruction_entries_type_check CHECK (type IN ('heading', 'instruction'))
);

CREATE INDEX idx_instruction_entries_recipe_position ON instruction_entries (recipe_id, position);

-- ============================================================
-- related_recipes  (self-referencing junction)
-- ============================================================
CREATE TABLE related_recipes (
  recipe_id         uuid    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  related_recipe_id uuid    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position          integer NOT NULL,
  PRIMARY KEY (recipe_id, related_recipe_id)
);

CREATE INDEX idx_related_recipes_related_recipe_id ON related_recipes (related_recipe_id);

-- ============================================================
-- cook_next_list
-- ============================================================
CREATE TABLE cook_next_list (
  recipe_id uuid    PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  position  integer NOT NULL
);

-- ============================================================
-- favorites_list
-- ============================================================
CREATE TABLE favorites_list (
  recipe_id uuid    PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  position  integer NOT NULL
);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE recipes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_recipes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_next_list      ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites_list      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON recipes             FOR SELECT USING (true);
CREATE POLICY "public read" ON tags                FOR SELECT USING (true);
CREATE POLICY "public read" ON recipe_tags         FOR SELECT USING (true);
CREATE POLICY "public read" ON ingredient_entries  FOR SELECT USING (true);
CREATE POLICY "public read" ON instruction_entries FOR SELECT USING (true);
CREATE POLICY "public read" ON related_recipes     FOR SELECT USING (true);
CREATE POLICY "public read" ON cook_next_list      FOR SELECT USING (true);
CREATE POLICY "public read" ON favorites_list      FOR SELECT USING (true);
