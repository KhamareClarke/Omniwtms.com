# End-to-End Workflow Test & Role-Based Login Testing

This document describes the documented end-to-end workflow test (Order → Allocate → Assign Courier → Deliver → Confirm) and role-based login testing across Organisation, Courier, Customer, and Admin accounts.

---

## 1. End-to-End Workflow Test

### Flow: Order → Allocate → Assign Courier → Deliver → Confirm

| Step | Actor | Action | Where | Notes |
|------|-------|--------|-------|-------|
| **1. Order** | Customer | Create order | `/customer` → Orders | Customer adds items (description, quantity) and submits. Stored in `simple_orders`. |
| **2. Allocate** | Organisation | Select products for delivery | Dashboard → Couriers | Organisation picks warehouse, products, and destination. Products are "allocated" for this delivery. |
| **3. Assign Courier** | Organisation | Assign delivery to courier | Dashboard → Couriers | Optimize route, select courier, assign. Creates record in `deliveries` + `delivery_stops`. |
| **4. Deliver** | Courier | Execute delivery | `/courier` | Courier sees assigned deliveries, marks stops as completed, uploads Proof of Delivery (POD). |
| **5. Confirm** | Courier | Mark delivery completed | `/courier` | All stops must be completed and POD uploaded before marking delivery as completed. |

---

### Detailed Steps

#### Step 1: Order (Customer)

1. Go to `/auth/login` → **Customer** tab.
2. Sign in (e.g. `customer@omnideploy.ai` / `AIpowered2023`).
3. Navigate to **Orders** (or `/customer/orders`).
4. Click **Create Order** or equivalent.
5. Add items (description, quantity).
6. Submit. Order is stored in `simple_orders`.

**Verify:** Order appears in customer's order list.

---

#### Step 2: Allocate (Organisation)

*Note: In the current flow, “allocation” happens when the Organisation selects products for a delivery. Warehouse bin allocation (3D grid) is separate; see [3D Warehouse Grid User Guide](./3D_WAREHOUSE_GRID_USER_GUIDE.md).*

1. Go to `/auth/login` → **Client** tab.
2. Sign in as Organisation (e.g. `demo@omnideploy.ai` / `AIpowered2023`).
3. Go to **Dashboard** → **Couriers**.
4. Click **Assign Delivery** (or equivalent).
5. Select **Source warehouse**.
6. Add **products** and quantities to deliver.
7. Choose destination (warehouse or client address).

**Verify:** Products and warehouse are selected; ready for route optimization.

---

#### Step 3: Assign Courier (Organisation)

1. On the same Assign Delivery dialog:
   - Set pickup time, notes, priority.
   - Run **Route optimization**.
   - Select a route.
2. Select a **courier** from the dropdown.
3. Click **Assign** (or equivalent).
4. Confirm success. A new record is created in `deliveries` and `delivery_stops`.

**Verify:** Delivery appears in the deliveries list with status `pending`; courier is assigned.

---

#### Step 4: Deliver (Courier)

1. Go to `/auth/login` → **Courier** tab.
2. Sign in (e.g. `driver@omnideploy.ai` / `AIpowered2023`).
3. Go to `/courier` (Courier Portal).
4. Find the assigned delivery in **Pending** or **Active**.
5. Mark each **stop** as completed (pickup → delivery).
6. Upload **Proof of Delivery (POD)** file.

**Verify:** Stops show as completed; POD is uploaded.

---

#### Step 5: Confirm (Courier)

1. With all stops completed and POD uploaded:
2. Click **Mark as Completed** (or equivalent).
3. Delivery status changes to `completed`.

**Verify:** Delivery moves to **Completed** tab; status is `completed` in DB.

---

### Alternative Flow (Organisation-Led Delivery)

If no customer order is used, the Organisation can create a delivery directly:

1. Organisation → Couriers → Assign Delivery.
2. Select warehouse, products, destination.
3. Optimize route → Assign courier.
4. Courier delivers and confirms as above.

---

## 2. Role-Based Login Testing

### Roles & Entry Points

| Role | Login URL | Storage Key | Home Route |
|------|-----------|-------------|------------|
| **Organisation (Client)** | `/auth/login` (Client tab) | `currentUser` (type: `client`) | `/dashboard` |
| **Admin** | `/auth/admin` | `currentUser` (type: `admin`) | `/dashboard` |
| **Courier** | `/auth/login` (Courier tab) | `currentCourier` | `/courier` |
| **Customer** | `/auth/login` (Customer tab) | `currentCustomer` | `/customer` |

---

### Test Matrix

| Test | Role | Expected Result |
|------|------|-----------------|
| Client login → Dashboard | Organisation | Success; redirect to `/dashboard`; sidebar visible. |
| Courier login → Courier portal | Courier | Success; redirect to `/courier`; deliveries visible. |
| Customer login → Customer portal | Customer | Success; redirect to `/customer`; orders visible. |
| Admin login → Dashboard | Admin | Success; redirect to `/dashboard`; admin tabs (Organisations, Couriers, Customers) visible. |
| Courier on `/dashboard` | Courier | Redirect to `/courier`. |
| Customer on `/dashboard` | Customer | Redirect to `/customer`. |
| Client on `/courier` | Organisation | Redirect to `/dashboard`. |
| Customer on `/courier` | Customer | Redirect to `/customer`. |
| Logout | Any | Storage cleared; redirect to login. |

---

### Demo / Test Credentials

*These must exist in the database. Seed data or migrations may be required.*

| Role | Email | Password | Table |
|------|-------|----------|-------|
| **Organisation** | `demo@omnideploy.ai` | `AIpowered2023` | `clients` |
| **Courier** | `driver@omnideploy.ai` | `AIpowered2023` | `couriers` |
| **Customer** | `customer@omnideploy.ai` | `AIpowered2023` | `customers` |
| **Admin** | `admin@omniwtms.com` | `OmniAdmin2025!` | `admins` |

**Note:** Admin is created by migration `20250611000000_create_admins_table.sql`. Organisation, Courier, and Customer demo accounts must be seeded or created manually (e.g. via Organisation adding couriers/customers, or a seed script).

---

### Organisation (Client)

1. Go to `/auth/login`.
2. Ensure **Client** tab is selected.
3. Enter `demo@omnideploy.ai` / `AIpowered2023` (or your org credentials).
4. Submit.
5. **Pass:** Redirect to `/dashboard`; sidebar shows warehouse, couriers, inventories, etc.
6. **Fail:** "Incorrect email or password" or "Account is not active".

---

### Courier

1. Go to `/auth/login`.
2. Select **Courier** tab.
3. Enter `driver@omnideploy.ai` / `AIpowered2023` (or your courier credentials).
4. Submit.
5. **Pass:** Redirect to `/courier`; pending/active deliveries visible.
6. **Fail:** "Incorrect email or password" or "Account is not active".

---

### Customer

1. Go to `/auth/login`.
2. Select **Customer** tab.
3. Enter `customer@omnideploy.ai` / `AIpowered2023` (or your customer credentials).
4. Submit.
5. **Pass:** Redirect to `/customer`; orders and dashboard visible.
6. **Fail:** "Incorrect email or password".

---

### Admin

1. Go to `/auth/admin` (separate from main login).
2. Enter `admin@omniwtms.com` / `OmniAdmin2025!`.
3. Submit.
4. **Pass:** Redirect to `/dashboard`; admin view with Organisations, Couriers, Customers tabs.
5. **Fail:** "Incorrect email or password" or "Account is not active".

---

### Role Guard Behavior

- **Dashboard** (`/dashboard/*`): Allowed for `client` and `admin` only.
- **Courier** (`/courier/*`): Allowed for `courier` only.
- **Customer** (`/customer/*`): Allowed for `customer` only.
- Wrong role → redirect to that role’s home route (e.g. courier on dashboard → `/courier`).

---

## 3. Quick Checklist

### End-to-End Workflow

- [ ] Customer creates order.
- [ ] Organisation allocates products for delivery.
- [ ] Organisation assigns courier and creates delivery.
- [ ] Courier sees delivery in portal.
- [ ] Courier completes all stops.
- [ ] Courier uploads POD.
- [ ] Courier marks delivery as completed.
- [ ] Organisation sees completed delivery in dashboard.

### Role-Based Login

- [ ] Organisation can log in and access dashboard.
- [ ] Courier can log in and access courier portal.
- [ ] Customer can log in and access customer portal.
- [ ] Admin can log in and access admin dashboard.
- [ ] Wrong-role redirects work (e.g. courier → `/courier` when on `/dashboard`).
- [ ] Logout clears storage and redirects to login.

---

## Related Docs

- [3D Warehouse Grid User Guide](./3D_WAREHOUSE_GRID_USER_GUIDE.md)
- [3D Warehouse Grid Validation Guide](./3D_WAREHOUSE_GRID_VALIDATION_GUIDE.md)
- [Deployment](./DEPLOYMENT.md)
