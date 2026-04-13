# TCL Customer Portal Migration (Phase 1)

This project is a migration of the TCL Customer Portal from Bubble.io to a modern Next.js 16 + Supabase stack. It focuses on the **Customer** role, providing a seamless experience for order creation, design review, and status tracking.

## 🏗️ Technical Architecture
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with custom `public.users` synchronization via database triggers
- **Styling:** Tailwind CSS with a premium design system (Custom HSL palette)
- **Business Logic:** React Server Components (fetching) + Server Actions (mutations)

## 📂 Project Structure
- `app/(auth)`: Login and Signup flows
- `app/(portal)`: Protected customer dashboard and orders
- `lib/supabase`: Typed Supabase clients for server and client sides
- `supabase/migrations`: 
  - `001_customer_schema.sql`: Core schema + Triggers
  - `002_seed.sql`: Official TCL mock data (PRD001, USR001, etc.)
  - `003_rls_policies.sql`: Row-Level Security for customer data isolation

## 🧠 Design Decisions (Task 1)
1. **Schema Mapping (Bubble to SQL):** 
   - **Enums:** Converted Bubble "Option Sets" (order_status, user_type) into native PostgreSQL Enums for type safety.
   - **User Sync:** Implemented a Postgres Trigger (`handle_new_user`) to automatically create a profile in `public.users` whenever a user signs up via Supabase Auth. This ensures 1:1 data integrity.
   - **Normalization:** Flattened complex Bubble types. For example, `order_products` is a join table to allow multiple products per order, unlike Bubble's nested lists which can lead to slow queries.
2. **Security (RLS):** 
   - Applied **Row-Level Security** across all tables. A customer can ONLY view their own orders via the policy `auth.uid() = customer_id`.
3. **Storage:**
   - Used Supabase Buckets for `design-files`. Uploads are scoped by User ID in the folder structure (`/uuid/filename`).

## 🤖 Bonus Challenges Delivered
1. **Bonus 1 — AI-Assisted Dev:** This project was built using a "Human-in-the-loop" AI approach, leveraging **Antigravity** (Google Deepmind internal agent based on Gemini) for rapid prototyping, schema mapping, and building complex UI components (e.g., the 3-step dynamic Next.js `new-order-wizard.tsx` and premium `PrintTypeCard`).
2. **Bonus 2 — LLM "Next Best Action":** Implemented in `app/api/ai/next-action/route.ts` and shown on the Dashboard. It uses the NVIDIA API (`meta/llama-3.1-405b-instruct`) to analyze the order's specific status, print type, and target date, and provides a customized, contextual recommendation for the customer.
3. **Bonus 3 — Bubble Data Migration Script:** Located at `scripts/migrate-bubble-data.js`. It parses unstructured legacy Bubble JSON and transforms/upserts it into the new strict PostgreSQL schema.

## 🚀 Setup & Testing
1. **Environment Variables:** Create a `.env.local` file with the following placeholders:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NVIDIA_API_KEY=your_nvidia_api_key_for_llama
```
2. **Database:** Apply migrations in `supabase/migrations/` (001 -> 002 -> 003).
3. **Run:** `pnpm install && pnpm dev`
4. **Test Accounts:**
   - **Customer:** `test@tcl-demo.com` / `TCLdemo2024!`

## 🛠️ Integrated Workflows
- **Shopify Sync (Task 5):** Hit `GET /api/sync-products` to populate your product catalog from a mock Shopify source.
- **Simulate Proofs (Testing):** Added a "Generate Mock Proofs" Developer button on the Order Details page to instantly mock a designer's workflow, letting you test the Approval UI end-to-end!
