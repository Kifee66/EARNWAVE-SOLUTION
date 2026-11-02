# Earnwave Solution

Earnwave is a publisher platform with admin-managed product packages, uploaded product images, and database-calculated submission rewards.

## Setup

1. Install dependencies with `npm install`.
2. Copy the Supabase project URL and anon key into a local `.env` file:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. It creates the tables, role and row-level security rules, the public `product-images` storage bucket, pricing history, reward snapshots, and review/order functions. It also removes unreferenced legacy sample packages.
4. Create an admin user in Supabase Auth. Promote the account using the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (
     select id from auth.users where email = 'admin@example.com'
   );
   ```

   Public registration creates publisher accounts only. Role changes must be made through trusted database access.

## Development

- `npm run dev` starts the local development server.
- `npm run build` runs the TypeScript check and production build.
- `npm run lint` runs Oxlint.

Admins can create and edit products, upload JPEG/PNG/WebP images up to 5 MB, set prices and reward rates, and review submissions. The database records package pricing changes and captures the applicable reward rate for each submission. Approved rewards are calculated and credited by a database function.

Package order records capture the current product terms, but checkout, payment processing, deposits, and withdrawals are not enabled yet.
