# Admin setup guide

This guide covers the minimum steps to stand up OmniWTMS in a new environment.

## 1) Configure environment variables

Populate `.env.local` for local development and your production environment variables for deployment.

At minimum, you need:

- Supabase project URL + keys
- Database service role key (server-only)
- Public app URL (`NEXT_PUBLIC_APP_URL`)
- Email provider credentials (Resend/SMTP) if sending email
- Stripe keys + webhook secret if billing is enabled

## 2) Run Supabase migrations

Apply SQL migrations in `supabase/migrations/` to your Supabase database.

## 3) Create your first tenant (organization)

Use the Admin dashboard to create a tenant (organization) and enable any feature flags you need (e.g. Empire OS).

## 4) Verify tenant context injection

Most internal dashboard APIs require a tenant context header/cookie:

- Header: `x-tenant-id`
- Cookie: `wtms_tenant_id`

The app middleware sets this from session/cookies. If you call APIs directly, include `x-tenant-id`.

## 5) Enable Empire OS webhook (optional)

Set tenant feature flag and webhook URL:

- `tenants.feature_empire_os = true`
- `tenants.metadata.empire_os_webhook_url = 'https://…'`

## 6) Supplier portal access (optional)

Supplier portal login is backed by `supplier_portal_users` and is tenant-scoped.

- Create a supplier under the tenant
- Create a `supplier_portal_users` record with a bcrypt password hash
- Supplier logs in at `/suppliers/portal/login`

