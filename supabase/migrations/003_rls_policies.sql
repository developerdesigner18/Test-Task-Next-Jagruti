-- ============================================================
-- TCL Customer Portal — Row-Level Security Policies
-- File: supabase/migrations/003_rls_policies.sql
-- ============================================================
-- Run AFTER 001_customer_schema.sql.
-- This file is idempotent: it drops and recreates all policies
-- so it can be re-run safely during development.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- HELPER: is_admin()
-- Returns TRUE if the calling user has user_type = 'admin' or
-- if the request is made with the service_role key
-- (service_role bypasses RLS entirely, but this is useful
--  for internal admin UI queries via the anon/authed role).
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users
     WHERE id = auth.uid()
       AND user_type = 'admin'
  );
$$;


-- ════════════════════════════════════════════════════════════
-- TABLE: public.users
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "users: select own"            ON public.users;
DROP POLICY IF EXISTS "users: insert own on signup"  ON public.users;
DROP POLICY IF EXISTS "users: update own"            ON public.users;
DROP POLICY IF EXISTS "users: admin select all"      ON public.users;

-- SELECT: a user sees only their own profile row.
-- Admins see all rows.
CREATE POLICY "users: select own"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- INSERT: only allowed at signup where the new row's id matches
-- the JWT subject (auth.uid()). Prevents a user from creating
-- a profile for a different auth account.
CREATE POLICY "users: insert own on signup"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: a user may edit only their own profile.
-- id and email changes are blocked at the application layer
-- (they must be changed via Supabase Auth, not this table).
CREATE POLICY "users: update own"
  ON public.users
  FOR UPDATE
  USING    (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy → customers cannot delete their own accounts
-- through direct REST calls. Account deletion must go through
-- a server-side function with SECURITY DEFINER.


-- ════════════════════════════════════════════════════════════
-- TABLE: public.products  (public catalog — read-only for customers)
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_print_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: read authenticated"             ON public.products;
DROP POLICY IF EXISTS "products: admin write"                    ON public.products;
DROP POLICY IF EXISTS "product_print_types: read authenticated"  ON public.product_print_types;
DROP POLICY IF EXISTS "product_print_types: admin write"         ON public.product_print_types;

-- All authenticated users can browse the product catalog
CREATE POLICY "products: read authenticated"
  ON public.products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins / service role can INSERT, UPDATE, DELETE products
-- (Shopify sync route uses service_role key → bypasses RLS)
CREATE POLICY "products: admin write"
  ON public.products
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "product_print_types: read authenticated"
  ON public.product_print_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "product_print_types: admin write"
  ON public.product_print_types
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABLE: public.orders
-- Customer is identified by customer_id = auth.uid()
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders: select own"   ON public.orders;
DROP POLICY IF EXISTS "orders: insert own"   ON public.orders;
DROP POLICY IF EXISTS "orders: update own"   ON public.orders;
DROP POLICY IF EXISTS "orders: admin all"    ON public.orders;

-- ── SELECT ─────────────────────────────────────────────────
-- A customer sees only rows where customer_id matches their JWT.
-- An admin sees all orders.
CREATE POLICY "orders: select own"
  ON public.orders
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
  );

-- ── INSERT ─────────────────────────────────────────────────
-- Customers may only create orders attributed to themselves.
-- Prevents a customer from setting customer_id to someone else's UUID.
CREATE POLICY "orders: insert own"
  ON public.orders
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ── UPDATE ─────────────────────────────────────────────────
-- Customers can update their own orders (e.g., add design notes).
-- Status transitions from 'proof_pending' onwards are locked to
-- admin/service role at the application layer, but this policy
-- allows the row to be targeted. Fine-grained field restrictions
-- should be enforced in application code or via a BEFORE UPDATE
-- trigger if required.
CREATE POLICY "orders: update own"
  ON public.orders
  FOR UPDATE
  USING    (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ── DELETE — not allowed for customers ─────────────────────
-- No customer DELETE policy. Admins use service_role (bypasses RLS).

-- ── Admin catch-all ────────────────────────────────────────
CREATE POLICY "orders: admin all"
  ON public.orders
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABLE: public.order_products  (line items — owned via orders)
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_products: select own"  ON public.order_products;
DROP POLICY IF EXISTS "order_products: insert own"  ON public.order_products;
DROP POLICY IF EXISTS "order_products: update own"  ON public.order_products;
DROP POLICY IF EXISTS "order_products: admin all"   ON public.order_products;

-- ── SELECT ─────────────────────────────────────────────────
-- Ownership is indirect: trace through orders → customer_id.
-- The subquery is index-efficient because orders.customer_id is indexed.
CREATE POLICY "order_products: select own"
  ON public.order_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = order_products.order_id
         AND o.customer_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ── INSERT ─────────────────────────────────────────────────
-- A customer can only add line items to their own orders.
CREATE POLICY "order_products: insert own"
  ON public.order_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = order_products.order_id
         AND o.customer_id = auth.uid()
    )
  );

-- ── UPDATE ─────────────────────────────────────────────────
CREATE POLICY "order_products: update own"
  ON public.order_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = order_products.order_id
         AND o.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = order_products.order_id
         AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "order_products: admin all"
  ON public.order_products
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABLE: public.proofs
-- Customers can only see proofs on their own orders.
-- Only staff (service_role / admin) can INSERT proofs.
-- Customers can UPDATE proof status (approve / request revision).
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proofs: select own"            ON public.proofs;
DROP POLICY IF EXISTS "proofs: customer update status" ON public.proofs;
DROP POLICY IF EXISTS "proofs: admin all"             ON public.proofs;

-- ── SELECT ─────────────────────────────────────────────────
-- Two-hop ownership: proof → order → customer_id
CREATE POLICY "proofs: select own"
  ON public.proofs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = proofs.order_id
         AND o.customer_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ── UPDATE (customer scope) ─────────────────────────────────
-- Customers are allowed to flip proof.status between
-- 'pending' → 'approved' or 'pending' → 'revision_requested'.
-- They cannot update mockup_image_url, price_tiers, or proof_number
-- (those are staff-only — enforce in application layer or via
-- a BEFORE UPDATE trigger checking NEW vs OLD column values).
CREATE POLICY "proofs: customer update status"
  ON public.proofs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = proofs.order_id
         AND o.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.orders o
       WHERE o.id          = proofs.order_id
         AND o.customer_id = auth.uid()
    )
  );

-- ── INSERT / DELETE / admin ─────────────────────────────────
-- Only admins and service_role can create or remove proofs.
CREATE POLICY "proofs: admin all"
  ON public.proofs
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABLE: public.revision_requests
-- Customers can create and read their own revision requests.
-- Preventing UPDATE/DELETE ensures an immutable audit trail.
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revision_requests: select own"  ON public.revision_requests;
DROP POLICY IF EXISTS "revision_requests: insert own"  ON public.revision_requests;
DROP POLICY IF EXISTS "revision_requests: admin all"   ON public.revision_requests;

-- ── SELECT ─────────────────────────────────────────────────
-- Customers see only their own revision requests.
CREATE POLICY "revision_requests: select own"
  ON public.revision_requests
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
  );

-- ── INSERT ─────────────────────────────────────────────────
-- Three-part guard:
--   1. customer_id in the new row matches the caller's JWT
--   2. The referenced proof belongs to one of the caller's orders
--   3. The proof is currently in 'pending' or 'revision_requested' state
--      (cannot submit a revision on an already-approved proof)
CREATE POLICY "revision_requests: insert own"
  ON public.revision_requests
  FOR INSERT
  WITH CHECK (
    -- Guard 1: caller owns this revision request
    customer_id = auth.uid()
    -- Guard 2 & 3: the proof links back to the caller's order
    --              and is in a revisable state
    AND EXISTS (
      SELECT 1
        FROM public.proofs p
        JOIN public.orders o ON o.id = p.order_id
       WHERE p.id            = revision_requests.proof_id
         AND o.customer_id   = auth.uid()
         AND p.status        IN ('pending', 'revision_requested')
    )
  );

-- No UPDATE / DELETE policies for customers → immutable audit trail.
-- Admins use service_role (bypasses RLS) for data correction.

CREATE POLICY "revision_requests: admin all"
  ON public.revision_requests
  FOR ALL
  USING    (public.is_admin())
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- Run these in the Supabase SQL editor to confirm RLS is active.
-- ════════════════════════════════════════════════════════════

-- 1. Confirm RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all active policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ════════════════════════════════════════════════════════════
-- CROSS-CUSTOMER ISOLATION TEST
-- ════════════════════════════════════════════════════════════
-- In your test suite or README, demonstrate isolation like this:
--
--   Step 1: Sign in as customer A (test@tcl-demo.com)
--           GET /rest/v1/orders → returns only customer A's rows
--
--   Step 2: Sign in as customer B (other@tcl-demo.com)
--           GET /rest/v1/orders → returns empty array []
--           even if customer B knows customer A's order UUID:
--           GET /rest/v1/orders?id=eq.<customer_A_order_id>
--           → still returns []
--
--   Step 3: Attempt direct proof access with customer B's token:
--           GET /rest/v1/proofs?order_id=eq.<customer_A_order_id>
--           → returns [] (two-hop RLS blocks the subquery)
--
-- This confirms the EXISTS-chain RLS is working correctly.
-- ════════════════════════════════════════════════════════════
