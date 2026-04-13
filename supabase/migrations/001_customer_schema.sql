-- ============================================================
-- TCL Customer Portal — Supabase Migration 001
-- File: supabase/migrations/001_customer_schema.sql
-- Description: Core schema for Customer Portal (Phase 1)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- CLEANUP
-- ────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_proof_all_approved ON public.proofs;
DROP FUNCTION IF EXISTS public.check_all_proofs_approved();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.revision_requests CASCADE;
DROP TABLE IF EXISTS public.proofs CASCADE;
DROP TABLE IF EXISTS public.order_products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_print_types CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS design_direction CASCADE;
DROP TYPE IF EXISTS proof_status CASCADE;
DROP TYPE IF EXISTS print_type CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- UTILITY: Deterministic ID Generator
-- This turns "PRD001" into a perfect UUID. 
-- Extremely useful for migrating legacy systems or Bubble data.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION gen_id(name TEXT) 
RETURNS UUID AS $$
BEGIN
  RETURN uuid_generate_v5(uuid_ns_url(), name);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────
CREATE TYPE user_type AS ENUM ('customer', 'campus_rep', 'account_manager', 'admin');
CREATE TYPE order_status AS ENUM ('new', 'proof_pending', 'proof_ready', 'approved', 'in_production', 'shipped', 'complete');
CREATE TYPE order_type AS ENUM ('group_order', 'get_a_link');
CREATE TYPE print_type AS ENUM ('screen_print', 'embroidery', 'puff_print', 'foil', 'dye_sublimation');
CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'revision_requested');
CREATE TYPE design_direction AS ENUM ('copy_exactly', 'use_as_inspiration', 'designers_choice');

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id               UUID PRIMARY KEY, 
  name             TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  user_type        user_type   NOT NULL DEFAULT 'customer',
  organization     TEXT,
  school           TEXT,
  loyalty_points   INTEGER     NOT NULL DEFAULT 0,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync logic for auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku               TEXT        NOT NULL UNIQUE,
  name              TEXT        NOT NULL,
  category          TEXT        NOT NULL,
  turnaround_days   INTEGER     NOT NULL,
  starting_price    NUMERIC(10,2) NOT NULL,
  is_featured       BOOLEAN     NOT NULL DEFAULT FALSE,
  description       TEXT,
  image_url         TEXT,
  shopify_product_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.product_print_types (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID      NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  print_type  print_type NOT NULL,
  min_quantity INTEGER   NOT NULL DEFAULT 1,
  UNIQUE (product_id, print_type)
);

CREATE TABLE public.orders (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id               UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_name                TEXT         NOT NULL,
  due_date                  DATE         NOT NULL,
  status                    order_status NOT NULL DEFAULT 'new',
  order_type                order_type   NOT NULL DEFAULT 'group_order',
  front_design_description  TEXT,
  back_design_description   TEXT,
  front_design_file_path    TEXT,
  back_design_file_path     TEXT,
  design_direction          design_direction,
  selected_print_type       print_type,
  notes                     TEXT,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_products (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID    NOT NULL REFERENCES public.orders(id)   ON DELETE CASCADE,
  product_id  UUID    NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  color       TEXT,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2)
);

CREATE TABLE public.proofs (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID         NOT NULL REFERENCES public.orders(id)   ON DELETE CASCADE,
  product_id       UUID         NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  proof_number     INTEGER      NOT NULL,
  color            TEXT         NOT NULL,
  print_type       print_type   NOT NULL,
  est_ship_date    DATE,
  price_tiers      JSONB        NOT NULL DEFAULT '[]',
  mockup_image_url TEXT,
  status           proof_status NOT NULL DEFAULT 'pending',
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE public.revision_requests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  proof_id    UUID        NOT NULL REFERENCES public.proofs(id) ON DELETE CASCADE,
  customer_id UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  notes       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: Business Logic
-- ────────────────────────────────────────────────────────────

-- When a proof is approved, check if ALL proofs for that order are approved.
-- If so, advance the order.status to 'approved' (Task 4 requirement).
CREATE OR REPLACE FUNCTION public.check_all_proofs_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
      FROM public.proofs 
     WHERE order_id = NEW.order_id 
       AND status   != 'approved'
  ) THEN
    RETURN NEW;
  ELSE
    UPDATE public.orders
       SET status     = 'approved',
           updated_at = NOW()
     WHERE id = NEW.order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_proof_all_approved
  AFTER UPDATE OF status ON public.proofs
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.check_all_proofs_approved();


-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_print_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: access own" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "products: read authenticated" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "orders: access own" ON public.orders FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "order_products: access own" ON public.order_products FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_products.order_id AND o.customer_id = auth.uid()));
CREATE POLICY "proofs: access own" ON public.proofs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = proofs.order_id AND o.customer_id = auth.uid()));
CREATE POLICY "revision_requests: access own" ON public.revision_requests FOR ALL 
  USING (auth.uid() = customer_id);
