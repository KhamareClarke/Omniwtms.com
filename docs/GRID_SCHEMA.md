# Omni WTMS – Persistent Grid Schema Documentation

This document is the **authoritative reference** for all grid, zone, and slot coordinate schemas in Omni WTMS. All coordinate systems and their database mappings are documented here.

---

## Overview

| System | Purpose | Primary Table | Coordinate Columns |
|--------|---------|---------------|---------------------|
| **2D Floor Plan Grid** | Layout overlay on floor plan image | `warehouse_layouts`, `warehouse_sections` | `grid_rows`, `grid_columns`, `row_index`, `column_index` |
| **3D Bin Grid** | Spatial allocation (x, y, z) | `warehouse_bins` | `x`, `y`, `z` |
| **Zone Mapping** | Zone-to-section linkage | `warehouse_zones`, `warehouse_sections` | `zone_id` (FK) |
| **Activity Heatmap** | Activity by grid position | `warehouse_activity` | `x_coordinate`, `y_coordinate` |

---

## 1. Floor Plan Grid Schema

### `warehouse_layouts`
Defines the grid dimensions for a warehouse floor plan.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| warehouse_id | uuid | FK → warehouses(id) |
| image_url | text | Floor plan image URL |
| image_width | integer | Image width (px) |
| image_height | integer | Image height (px) |
| **grid_rows** | integer | Number of grid rows (default: 10) |
| **grid_columns** | integer | Number of grid columns (default: 10) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Migration:** `20250104000000_warehouse_floor_plan_tables.sql`

### `warehouse_sections`
Each section is a grid cell at `(row_index, column_index)`.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| layout_id | uuid | FK → warehouse_layouts(id) |
| **row_index** | integer | Row in grid (0-based) |
| **column_index** | integer | Column in grid (0-based) |
| section_name | text | Display name |
| section_type | text | `storage`, `shipping`, `receiving`, `picking`, `blocked`, `other` |
| capacity | integer | Max units |
| current_usage | integer | Auto-updated from section_inventory |
| is_blocked | boolean | |
| color | text | Optional override |
| **zone_id** | uuid | FK → warehouse_zones(id) — links section to zone |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique:** `(layout_id, row_index, column_index)` — one section per grid cell.

**Migration:** `20250104000000_warehouse_floor_plan_tables.sql`; `zone_id` added in `20250615000000_zone_section_mapping.sql`

---

## 2. 3D Bin / Slot Coordinate Schema

### `warehouse_bins`
3D storage slots with explicit `x`, `y`, `z` coordinates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| warehouse_id | uuid | FK → warehouses(id) |
| section_id | uuid | Optional FK → warehouse_sections(id) — links bin to 2D grid cell |
| **x** | integer | X position (left-right) |
| **y** | integer | Y position (depth) |
| **z** | integer | Z position (height/stacking level) |
| max_quantity | integer | Max units |
| max_volume | numeric | Max volume |
| current_quantity | integer | Auto-updated from bin_allocations |
| current_volume | numeric | Auto-updated |
| bin_code | text | Human-readable code (e.g. A1-02) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique:** `(warehouse_id, x, y, z)` — no duplicate positions per warehouse.

**Migration:** `20250614000000_3d_spatial_allocation_engine.sql`

### `bin_allocations`
Product quantity at a bin (coordinates via bin reference).

| Column | Type |
|--------|------|
| bin_id | uuid → warehouse_bins(id) |
| product_id | uuid → products(id) |
| quantity | integer |
| volume_used | numeric |

---

## 3. Zone Mapping Schema

### `warehouse_zones`
Logical zones within a warehouse (Receiving, Storage A, Picking, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| warehouse_id | uuid | FK → warehouses(id) |
| name | text | Zone name |
| code | text | Short code (e.g. A1) |
| color | text | Hex color |
| x_position | integer | Optional position for visualization |
| y_position | integer | |
| width | integer | |
| height | integer | |
| capacity | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Migration:** `20250525133600_warehouse_visualization_tables.sql`

### Zone-to-Section Mapping
- `warehouse_sections.zone_id` → `warehouse_zones(id)` links each grid cell to a zone.
- **Migration:** `20250615000000_zone_section_mapping.sql`

---

## 4. Activity Heatmap Schema

### `warehouse_activity`
Activity level at grid coordinates (for heatmap visualization).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| warehouse_id | uuid | FK → warehouses(id) |
| zone_id | uuid | FK → warehouse_zones(id) |
| **x_coordinate** | integer | X position in grid |
| **y_coordinate** | integer | Y position in grid |
| activity_level | numeric | 0.00–1.00 |
| activity_type | text | movement, pickup, storage, etc. |
| recorded_at | timestamptz | |

**Migration:** `20250525133600_warehouse_visualization_tables.sql`

---

## Entity Relationship Summary

```
warehouses
    ├── warehouse_layouts (grid_rows, grid_columns)
    │       └── warehouse_sections (row_index, column_index, zone_id)
    │               ├── section_inventory
    │               └── warehouse_bins (section_id optional)
    ├── warehouse_zones
    │       └── warehouse_sections.zone_id
    ├── warehouse_bins (x, y, z)
    │       └── bin_allocations
    └── warehouse_activity (x_coordinate, y_coordinate)
```

---

## Related Documentation

- [3D Spatial Allocation](./3D_SPATIAL_ALLOCATION.md) — API and bin operations
- [3D Warehouse Grid User Guide](./3D_WAREHOUSE_GRID_USER_GUIDE.md)
- [3D Warehouse Grid Validation Guide](./3D_WAREHOUSE_GRID_VALIDATION_GUIDE.md)
