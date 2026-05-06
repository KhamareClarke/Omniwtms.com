# How to Use the 3D Warehouse Grid

## Step 1: Go to Warehouse Visualization

1. Log in to Omni WTMS
2. Open **Dashboard** → **Warehouse** → **Warehouse Visualization**
3. Choose a warehouse from the dropdown
4. Click the **3D Bins** tab

---

## Step 2: Create Bins

1. In the **Create Bin (x, y, z)** card:
   - **X** = position left to right (e.g. 0, 1, 2)
   - **Y** = position front to back (e.g. 0, 1, 2)
   - **Z** = height / level (e.g. 0, 1)
   - **Max quantity** = max units allowed (e.g. 100)
   - **Bin code** (optional) = label like A1-01
2. Click **Create Bin**
3. Add more bins as needed

---

## Step 3: Allocate Products to a Bin

1. In the **Allocate to Bin** card:
   - **Bin** = choose the storage location
   - **Product** = choose the product
   - **Quantity** = number of units
2. Click **Allocate**
3. The bin usage will update (you cannot exceed max quantity)

---

## Step 4: Move Stock Between Bins

1. In the **Move Between Bins** card:
   - **From bin** = bin with stock
   - **To bin** = destination bin
   - **Product** = product to move
   - **Quantity** = units to move
2. Click **Move**
3. Stock moves from one bin to another

---

## Quick Reference

| Action    | Where           | What you do                                                |
|-----------|-----------------|------------------------------------------------------------|
| Create bin| Create Bin card | Enter X, Y, Z, Max quantity → Create Bin                   |
| Add stock | Allocate card   | Select bin, product, quantity → Allocate                  |
| Move stock| Move card       | Select from bin, to bin, product, quantity → Move        |
| View bins | Bins table      | See coordinates, usage, and products in each bin         |

---

## Tips

- **From bin** only lists bins that have stock.
- You cannot allocate more than a bin’s max quantity.
- You cannot move more than a destination bin’s max quantity.
- Hover over bins in the 3D view to see coordinates and usage.
