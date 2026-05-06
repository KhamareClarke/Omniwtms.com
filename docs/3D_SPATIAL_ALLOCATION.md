# 3D Spatial Allocation Engine

Omni WTMS includes a coordinate-based storage system for bin-level allocation with capacity and volume constraints.

> **Full schema reference:** See [GRID_SCHEMA.md](./GRID_SCHEMA.md) for consolidated documentation of all grid, zone, and slot coordinate tables.

## Schema

### `warehouse_bins`
3D storage locations with x, y, z coordinates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| warehouse_id | uuid | FK to warehouses |
| section_id | uuid | Optional FK to warehouse_sections (links bin to 2D grid cell) |
| x | integer | X position (left-right) |
| y | integer | Y position (front-back) |
| z | integer | Z position (height/stacking level) |
| max_quantity | integer | Maximum units allowed |
| max_volume | numeric | Maximum volume (optional) |
| current_quantity | integer | Auto-updated from allocations |
| current_volume | numeric | Auto-updated from allocations |

Unique constraint: `(warehouse_id, x, y, z)` — no duplicate positions.

### `bin_allocations`
Product quantity allocated to a specific bin.

| Column | Type |
|--------|------|
| bin_id | uuid |
| product_id | uuid |
| quantity | integer |
| volume_used | numeric |

Trigger updates `warehouse_bins.current_quantity` and `current_volume` on insert/update/delete.

## API

### List bins
```
GET /api/warehouse/bins?warehouse_id=<uuid>
  ?section_id=<uuid>
  ?x=0&y=1&z=2
```

### Create bin
```
POST /api/warehouse/bins
{
  "warehouse_id": "uuid",
  "section_id": "uuid",  // optional
  "x": 0,
  "y": 1,
  "z": 2,
  "max_quantity": 100,
  "max_volume": 50.5,
  "bin_code": "A1-02"
}
```

### Allocate to bin
```
POST /api/warehouse/bins/allocate
{
  "bin_id": "uuid",
  "product_id": "uuid",
  "quantity": 10,
  "volume_used": 5.2,  // optional
  "client_id": "uuid"  // optional
}
```
- Validates capacity (quantity and volume) before insert
- Returns 400 with "Over-allocation prevented" if capacity exceeded

### Move between bins
```
POST /api/warehouse/bins/move
{
  "from_bin_id": "uuid",
  "to_bin_id": "uuid",
  "product_id": "uuid",
  "quantity": 5
}
```
- Validates source has sufficient quantity
- Validates destination has capacity
- Updates coordinates implicitly (stock moves to new x,y,z via bin reference)

## Capacity enforcement

- **Section-level** (`section_inventory`): `POST /api/warehouse/section-inventory` now validates `section.capacity` before allowing add. Returns 400 if over-allocation.
- **Bin-level** (`bin_allocations`): All allocate and move endpoints validate `max_quantity` and `max_volume` before insert/update.

## Migration

Run the migration to create tables:
```bash
npx supabase db push
```
Or execute `supabase/migrations/20250614000000_3d_spatial_allocation_engine.sql` in Supabase SQL Editor.
