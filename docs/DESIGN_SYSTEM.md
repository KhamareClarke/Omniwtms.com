# OmniWTMS Design System (UAE Template)

Unified UI structure aligned with the UAE Private Investor template. Brand colors stay in OmniWTMS palette; layout and rhythm follow the design system.

## Design Tokens (`design-tokens.css`)

- **Spacing:** `--space-1` (8px) through `--space-6` (64px)
- **Typography:** `--text-hero`, `--text-section`, `--text-subsection`, `--text-body` + weight vars
- **Radius:** `--radius-standard`, `--radius-card`, `--radius-button`, `--radius-input` (12px)
- **Shadow:** `--shadow-sm` through `--shadow-xl`
- **Containers:** `--container-main` (1200px), `--container-wide` (1400px), `--container-narrow` (896px)
- **Section padding:** `--section-py`, `--section-py-sm`, `--section-py-lg`

## UI Components

| Component | Path | Usage |
|-----------|------|--------|
| **Section** | `@/components/ui/section` | Page sections with consistent vertical padding. Props: `size` (default \| sm \| lg), `as` (section \| div) |
| **Container** | `@/components/ui/container` | Max-width content wrapper. Props: `size` (main \| wide \| narrow) |
| **Card** | `@/components/ui/card` | Uses `--radius-card`, `--shadow-sm` |
| **Button** | `@/components/ui/button` | Uses `--radius-button` |
| **Input** | `@/components/ui/input` | Uses `--radius-input` |
| **NavbarWrapper** | `@/components/layout/navbar-wrapper` | Wraps `Header` for consistent navbar placement |
| **DashboardLayoutWrapper** | `@/components/layout/dashboard-layout-wrapper` | Dashboard pages; uses `--container-wide` |

## Page Structure (UAE-style)

```
Navbar (Header)
→ Hero
→ Section + Container (content sections)
→ Cards / data blocks
→ Footer
```

## Pilot Page

Home (`app/page.tsx`): Hero + Sections (Solutions, Case Studies, Pricing, Contact) each wrapped in `<Section><Container>...</Container></Section>`.

## Gradual Migration

Replace raw layout with design system components:

- `div` with manual padding → `<Section>`
- `max-w-7xl mx-auto px-4` → `<Container>`
- Panels / content blocks → `<Card>` (existing) with token styling

Do not change: backend, APIs, auth, routing, state, or file structure.
