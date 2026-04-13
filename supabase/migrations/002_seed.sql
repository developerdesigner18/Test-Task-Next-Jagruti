-- ────────────────────────────────────────────────────────────
-- 002_seed.sql: OFFICIAL MOCK DATA WITH DETERMINISTIC UUIDS
-- ────────────────────────────────────────────────────────────

-- 1. PRODUCTS
INSERT INTO public.products (id, sku, name, category, turnaround_days, starting_price, is_featured, description, image_url)
VALUES 
  (gen_id('PRD001'), 'TEE-GILDAN-64000', 'Gildan Softstyle Tee', 'T-Shirts', 10, 8.50, true, 'Classic soft cotton tee', 'https://placehold.co/400x400?text=Gildan+Tee'),
  (gen_id('PRD002'), 'TEE-BELLA-3001', 'Bella+Canvas Unisex Tee', 'T-Shirts', 10, 11.00, true, 'Premium fitted unisex tee', 'https://placehold.co/400x400?text=Bella+Canvas'),
  (gen_id('PRD003'), 'CREW-INDEPENDENT-SS3000', 'Independent Trading Crewneck', 'Sweatshirts', 12, 22.00, true, 'Heavyweight cozy crewneck', 'https://placehold.co/400x400?text=Crewneck'),
  (gen_id('PRD004'), 'HOOD-GILDAN-18500', 'Gildan Heavy Blend Hoodie', 'Sweatshirts', 12, 24.00, true, 'Warm fleece-lined hoodie', 'https://placehold.co/400x400?text=Hoodie')
ON CONFLICT (id) DO NOTHING;

-- 2. PRODUCT PRINT TYPES
INSERT INTO public.product_print_types (product_id, print_type, min_quantity)
VALUES
  (gen_id('PRD001'), 'screen_print', 24),
  (gen_id('PRD002'), 'screen_print', 24),
  (gen_id('PRD003'), 'embroidery', 12),
  (gen_id('PRD004'), 'embroidery', 12)
ON CONFLICT DO NOTHING;

-- 3. USERS (Madison & Tyler)
INSERT INTO public.users (id, name, email, user_type, organization, school, avatar_url)
VALUES 
  (gen_id('USR001'), 'Madison Clarke', 'madison.clarke@alphaphi.org', 'customer', 'Alpha Phi', 'University of Alabama', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Madison'),
  (gen_id('USR002'), 'Tyler Nguyen', 'tyler.nguyen@sigchi.org', 'customer', 'Sigma Chi', 'University of Georgia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler')
ON CONFLICT (id) DO NOTHING;

-- 4. ORDERS
INSERT INTO public.orders (id, customer_id, event_name, due_date, status, order_type, selected_print_type, front_design_description, design_direction, notes)
VALUES
  (gen_id('ORD001'), gen_id('USR001'), 'Alpha Phi Bid Day 2025', '2025-02-28', 'proof_ready', 'group_order', 'screen_print', 'Alpha Phi letters with bid day sun motif', 'use_as_inspiration', 'Please use bright colors!'),
  (gen_id('ORD002'), gen_id('USR002'), 'Sigma Chi Derby Days', '2025-03-10', 'proof_pending', 'get_a_link', 'screen_print', 'Sigma Chi crest with Derby Days text', 'copy_exactly', 'Match the official crest colors.')
ON CONFLICT (id) DO NOTHING;

-- 5. PROOFS
INSERT INTO public.proofs (id, order_id, product_id, proof_number, color, print_type, est_ship_date, status, price_tiers)
VALUES
  (gen_id('PRF001'), gen_id('ORD001'), gen_id('PRD002'), 1, 'Heather Peach', 'screen_print', '2025-02-24', 'pending', '[{"min_qty":24, "price_per_unit":13.50}]'),
  (gen_id('PRF002'), gen_id('ORD001'), gen_id('PRD001'), 2, 'Coral', 'screen_print', '2025-02-24', 'pending', '[{"min_qty":24, "price_per_unit":11.50}]')
ON CONFLICT (id) DO NOTHING;
