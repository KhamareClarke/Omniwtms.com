# Deployment (Production)

The app works on **localhost** because it uses your local Supabase project (or the one in `.env.local`). On **production** (e.g. omniwtms.com), you must use the **same schema and env** on the production Supabase project.

## 1. Production Supabase project

Your production site uses the project at **xvbhcvwjwsjgzjpfpogy.supabase.co**. All steps below apply to that project.

## 2. Run migrations on production

In the [Supabase Dashboard](https://supabase.com/dashboard) → your **production** project → **SQL Editor**, run these migrations **in order**:

1. **`supabase/migrations/20250612000000_ensure_warehouses_table.sql`**  
   Creates `warehouses` and adds columns the app needs. Fixes 404 on `warehouses`.

2. **`supabase/migrations/20250612000001_ensure_products_table.sql`**  
   Creates `products`. Fixes 404/400 on `products`.

3. **`supabase/migrations/20250612000002_ensure_warehouse_inventory_and_movements.sql`**  
   Creates `warehouse_inventory` and `inventory_movements`. Fixes 404 on those tables.

4. **`supabase/migrations/20250614000000_3d_spatial_allocation_engine.sql`**  
   Creates `warehouse_bins` and `bin_allocations` for 3D spatial allocation. Required for Warehouse Visualization → 3D Bins.

5. **`supabase/migrations/20250615000000_zone_section_mapping.sql`**  
   Adds `zone_id` to `warehouse_sections` to link grid cells to `warehouse_zones`. Required for zone-to-section mapping.

Alternatively, if you use the Supabase CLI and link to the production project:

```bash
npx supabase link --project-ref xvbhcvwjwsjgzjpfpogy
npx supabase db push
```

That applies all migrations in `supabase/migrations/` to the linked DB.

## 3. Environment variables on production

In your hosting (Vercel, Netlify, etc.), set for **production**:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://xvbhcvwjwsjgzjpfpogy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon** key from that project (Settings → API)

If these are missing or point to another project, you can get 401 Unauthorized or wrong data.

## 4. 401 on couriers / deliveries

If you still see **401** on `couriers` or `deliveries`, those tables may have RLS that requires Supabase Auth. Ensure the production app sends a valid session (e.g. Supabase Auth or the same auth your app uses) so RLS allows access. If those tables are managed by other migrations, add or adjust RLS policies so the client can read with the key/session you use in production.

## Summary

| Issue | Fix |
|-------|-----|
| 404 on warehouses, products, warehouse_inventory, inventory_movements | Run migrations 1–3 above on the **production** Supabase project. |
| 3D Bins / warehouse_bins not found | Run migration 4 (`20250614000000_3d_spatial_allocation_engine.sql`) on production. |
| Zone-to-section mapping | Run migration 5 (`20250615000000_zone_section_mapping.sql`) to add `zone_id` to `warehouse_sections`. |
| 400 on products | Run `20250612000001_ensure_products_table.sql` so the `products` table has the columns the app selects. |
| 401 on API requests | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for production; fix RLS on couriers/deliveries if needed. |
