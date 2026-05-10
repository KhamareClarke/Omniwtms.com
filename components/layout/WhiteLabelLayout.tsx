"use client";

import type { PublicTenantBranding } from "@/lib/tenants/branding-types";

type Props = {
  children: React.ReactNode;
  /** Null = OmniWTMS defaults until fetch completes. */
  branding: PublicTenantBranding | null;
  /** auth: top brand bar + footer. app: variables only (dashboard shell). */
  variant?: "auth" | "app";
  className?: string;
};

/**
 * Applies CSS variables for tenant colors and optional header/footer for white-label portals.
 */
export function WhiteLabelLayout({
  children,
  branding,
  variant = "app",
  className = "",
}: Props) {
  const p = branding?.primary_color ?? "#3456FF";
  const s = branding?.secondary_color ?? "#5C4EFF";
  const t = branding?.text_color ?? "#111827";
  const name = branding?.name ?? "OmniWTMS";

  const scopeStyle = {
    "--wl-primary": p,
    "--wl-secondary": s,
    "--wl-text": t,
  } as React.CSSProperties;

  return (
    <div
      data-wl-scope
      style={scopeStyle}
      className={`wl-root flex flex-col min-h-0 flex-1 text-[var(--wl-text)] ${className}`}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-wl-scope] a:not([class*="bg-"]):not([class*="text-white"]) { color: var(--wl-primary); }
          [data-wl-scope] a:hover { opacity: 0.9; }
          [data-wl-scope] button[type="submit"]:not([class*="from-green"]):not([class*="from-purple"]):not([class*="bg-ghost"]) {
            background: linear-gradient(90deg, var(--wl-primary), var(--wl-secondary)) !important;
            color: #fff !important;
            border-color: transparent !important;
          }
          [data-wl-scope] .border-blue-100, [data-wl-scope] .border-gray-200 {
            border-color: color-mix(in srgb, var(--wl-primary) 22%, transparent) !important;
          }
        `,
      }} />

      {variant === "auth" && (
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b bg-white/95 backdrop-blur-sm shrink-0"
          style={{ borderColor: `color-mix(in srgb, ${p} 25%, #e5e7eb)` }}
        >
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- tenant URLs are arbitrary (Supabase storage / CDN)
            <img
              src={branding.logo_url}
              alt=""
              className="h-9 sm:h-10 w-auto max-w-[200px] object-contain shrink-0"
            />
          ) : (
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md"
              style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Secure sign-in</p>
            <p className="font-semibold text-gray-900 truncate">{name}</p>
          </div>
        </header>
      )}

      <div className="flex-1 min-h-0 flex flex-col">{children}</div>

      {variant === "auth" && (
        <footer
          className="mt-auto py-4 px-4 text-center text-xs text-gray-500 border-t bg-white/80 shrink-0"
          style={{ borderColor: `color-mix(in srgb, ${p} 18%, #e5e7eb)` }}
        >
          © {new Date().getFullYear()} {name}. All rights reserved.
        </footer>
      )}
    </div>
  );
}
