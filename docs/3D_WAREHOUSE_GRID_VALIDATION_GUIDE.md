# Omni WTMS – 3D Warehouse Grid: Step-by-Step Usage & Validation Guide

This document provides step-by-step instructions for using the 3D warehouse grid and verifying its operational status against the technical evaluation criteria.

---

## Prerequisites

### 1. Database migrations

Run on your Supabase project (local or production):

```bash
npx supabase db push
```

Or manually in Supabase SQL Editor, in order:

1. `20250612000000_ensure_warehouses_table.sql`
2. `20250612000001_ensure_products_table.sql`
3. `20250612000002_ensure_warehouse_inventory_and_movements.sql`
4. **`20250614000000_3d_spatial_allocation_engine.sql`** – creates `warehouse_bins` and `bin_allocations` with triggers

### 2. Warehouse and products

- At least one **warehouse** (create via Warehouses page or Create Warehouse dialog)
- At least one **product** (create via Products/Inventories page)

---

## Step-by-Step: How to Use the 3D Warehouse Grid

### Step 1: Open Warehouse Visualization

1. Log in as **Organisation** (client) user
2. Go to **Dashboard** → **Warehouse** → **Warehouse Visualization**
3. Select a warehouse from the dropdown (e.g. "new - karachi")
4. Click the **3D Bins** tab

---

### Step 2: Create bins (grid coordinates)

Each bin is a storage location at coordinates (x, y, z).

1. In the **Create Bin (x, y, z)** card:
   - **X** = left–right position (e.g. 0, 1, 2)
   - **Y** = front–back position (e.g. 0, 1, 2)
   - **Z** = height / stacking level (e.g. 0, 1)
   - **Max quantity** = maximum units allowed in this bin (e.g. 100)
   - **Bin code** (optional) = human label (e.g. A1-01)

2. Click **Create Bin**

3. **Verify**: The bin appears in the Bins table and, if you have bins, in the 3D view. Coordinates are stored in the database at `warehouse_bins (x, y, z)`.

**Example test**: Create bins at (0,0,0), (1,1,0), (2,2,1).

---

### Step 3: Allocate product to a bin

1. In the **Allocate to Bin** card:
   - **Bin** = select a bin (e.g. (0,0,0))
   - **Product** = select a product
   - **Quantity** = number of units to place

2. Click **Allocate**

3. **Verify**:
   - The Bins table shows the product and quantity for that bin
   - The 3D view (if rendered) updates to show usage (e.g. partial/full colour)
   - `warehouse_bins.current_quantity` and `bin_allocations` are updated in the database

---

### Step 4: Verify capacity validation (no over-allocation)

1. Try to allocate **more** than the bin’s max quantity (e.g. max 100, allocate 150)
2. **Expected**: Error toast: “Over-allocation prevented” / “Bin capacity: 100. Current: X. Cannot add Y.”
3. **Verify**: No new rows are written to `bin_allocations`; database stays consistent

---

### Step 5: Move stock between bins

1. In the **Move Between Bins** card:
   - **From bin** = bin with stock (e.g. (0,0,0))
   - **To bin** = destination bin (e.g. (1,1,0))
   - **Product** = product to move
   - **Quantity** = units to move

2. Click **Move**

3. **Verify**:
   - Source bin quantity decreases; destination bin quantity increases
   - Bins table and 3D view update after refresh
   - `bin_allocations` in the database reflect the move (delete/update at source, insert/update at destination)

---

### Step 6: Verify destination capacity on move

1. Set destination bin’s **max quantity** so it is already full or nearly full
2. Try to move more than available capacity into that bin
3. **Expected**: Error toast “Over-allocation prevented at destination”
4. **Verify**: Source and destination allocations in the database are unchanged

---

## Audit Criteria vs Implementation

| Criterion | Implementation | How to Verify |
|-----------|----------------|---------------|
| **Dynamic rendering tied to live inventory** | 3D view reads `bins` from `GET /api/warehouse/bins`. Bins include `current_quantity`, `bin_allocations`. | Allocate or move stock; refresh or switch tabs. Bins table and 3D cubes reflect updated usage. |
| **Real-time update when stock moved** | After allocate/move, `loadBins()` is called to refetch bins. | Use Allocate or Move; Bins table and 3D view update without manual page reload (no WebSocket). |
| **Collision/space validation (no over-allocation)** | Allocate and Move APIs check `current_quantity + qty <= max_quantity` before write. | Over-allocate; API returns 400 and no DB changes occur. |
| **Persistence: coordinates in database** | `warehouse_bins` stores `x`, `y`, `z`. `bin_allocations` links to `bin_id` (coordinates via bin). | Query `warehouse_bins` in Supabase Table Editor to see `x`, `y`, `z` and `current_quantity`. |
| **Admin / reallocation in 3D** | Organisation users (not admin-only) can create bins, allocate, and move. | Log in as Organisation; perform create/allocate/move; verify changes in UI and DB. |
| **Performance / large datasets** | Not explicitly stress-tested. | Run with many bins/products; observe response times and UI responsiveness. |

---

## API Endpoints (for direct validation)

### List bins

```
GET /api/warehouse/bins?warehouse_id=<uuid>
```

Returns bins with coordinates, `current_quantity`, `max_quantity`, and `bin_allocations`.

### Create bin

```
POST /api/warehouse/bins
Content-Type: application/json

{
  "warehouse_id": "<uuid>",
  "x": 0,
  "y": 1,
  "z": 2,
  "max_quantity": 100,
  "bin_code": "A1-01"
}
```

### Allocate

```
POST /api/warehouse/bins/allocate
Content-Type: application/json

{
  "bin_id": "<uuid>",
  "product_id": "<uuid>",
  "quantity": 10
}
```

### Move

```
POST /api/warehouse/bins/move
Content-Type: application/json

{
  "from_bin_id": "<uuid>",
  "to_bin_id": "<uuid>",
  "product_id": "<uuid>",
  "quantity": 5
}
```

---

## Database Verification Queries

Run in Supabase SQL Editor:

```sql
-- Bins with coordinates and usage
SELECT id, warehouse_id, x, y, z, max_quantity, current_quantity, bin_code
FROM warehouse_bins
WHERE warehouse_id = '<your-warehouse-id>'
ORDER BY x, y, z;

-- Allocations per bin
SELECT b.x, b.y, b.z, ba.quantity, p.name AS product_name
FROM bin_allocations ba
JOIN warehouse_bins b ON b.id = ba.bin_id
JOIN products p ON p.id = ba.product_id
WHERE b.warehouse_id = '<your-warehouse-id>';
```

---

## Validation Checklist for Auditors

Use this to confirm operational status:

- [ ] Migration `20250614000000_3d_spatial_allocation_engine.sql` applied
- [ ] Can create bins with x, y, z coordinates
- [ ] Coordinates and usage visible in Bins table
- [ ] Can allocate product to a bin
- [ ] Over-allocation is rejected (API 400)
- [ ] Can move stock from one bin to another
- [ ] Move respects destination capacity (400 if over)
- [ ] Bins table and 3D view reflect changes after actions
- [ ] Database tables `warehouse_bins` and `bin_allocations` match UI

---

## Production Deployment

For production (e.g. omniwtms.com):

1. Run all migrations on the production Supabase project (see `docs/DEPLOYMENT.md`)
2. Ensure `20250614000000_3d_spatial_allocation_engine.sql` is included
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the production project

---

## Summary

The 3D warehouse grid provides:

- **Coordinate-based storage**: x, y, z in `warehouse_bins`
- **Capacity enforcement**: API validates before insert/update
- **Persistence**: `bin_allocations` linked to bins; trigger updates `current_quantity`
- **UI sync**: Create, Allocate, Move refresh bins; Bins table and 3D view display live data

The 3D visualization is an optional layer; the core behaviour is driven by the database schema and API logic.
