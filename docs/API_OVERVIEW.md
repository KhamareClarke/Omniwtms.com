# API overview

OmniWTMS uses Next.js Route Handlers under `app/api/**/route.ts`.

## Tenant context

Most authenticated dashboard APIs require tenant context, provided by:

- `x-tenant-id` header (preferred)
- `wtms_tenant_id` cookie

If tenant context is missing, the API returns `400` with `code: TENANT_REQUIRED`.

## Key API groups

- **Admin (platform)**: `app/api/admin/**`
- **Admin auth**: `app/api/auth/admin/**`
- **Tenant auth**: `app/api/auth/**`
- **Dashboard**: `app/api/dashboard/**`
- **Orders / deliveries / invoices**: `app/api/orders/**`, `app/api/deliveries/**`, `app/api/invoices/**`
- **Suppliers**: `app/api/suppliers/**`
- **Stripe billing**: `app/api/stripe/**`

## Empire OS

- **Panel**: `GET /api/dashboard/empire-os`
- **Push event**: `POST /api/dashboard/empire-os`
- **Recommendation actions**: `POST /api/dashboard/empire-os/recommendations`

