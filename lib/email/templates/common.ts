/** Escape text for HTML body (not full attribute context). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replace {{key}} with values; missing keys stay as empty string. */
export function mergeVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function withDefaults(
  vars: Record<string, string> | undefined,
  defaults: Record<string, string>
): Record<string, string> {
  return { ...defaults, ...(vars || {}) };
}

export function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function defaultTemplateVars(tenantId?: string | null): Record<string, string> {
  const base = appBaseUrl();
  const unsub = `${base}/settings/notifications${tenantId ? `?tenantHint=${encodeURIComponent(tenantId)}` : ""}`;
  return {
    appUrl: base,
    supportEmail: process.env.ADMIN_EMAIL?.trim() || "support@omniwtms.com",
    unsubscribeUrl: unsub,
    legalCompanyName: "OmniWTMS Ltd",
    legalAddress: "United Kingdom",
    orgName: "Your organization",
    customerName: "Customer",
    tenantId: tenantId ?? "",
    orderId: "",
    packageId: "",
    amount: "",
    currency: "GBP",
    resetUrl: `${base}/auth/login`,
    trackingUrl: base,
    invoiceUrl: base,
    retryUrl: base,
    payUrl: base,
    upgradeUrl: `${base}/dashboard/settings`,
    courierName: "Courier",
    pickupAddress: "",
    dropoffAddress: "",
    deliveriesCount: "0",
    onTimePercent: "100",
    sku: "",
    warehouseName: "",
    currentQty: "",
    minQty: "",
    utilizationPercent: "",
    adminEmail: "",
    invoiceNumber: "",
    escalationLevel: "1",
    suspensionReason: "Policy",
    ticketId: "",
    resolutionSummary: "",
    dueDate: "",
    trialEndDate: "",
    keyLast4: "****",
    alertTitle: "Alert",
    alertBody: "",
    severity: "high",
    failureReason: "",
    extraNote: "",
  };
}

/** Inline footer: company line + unsubscribe (transactional). */
export function footerBlock(v: Record<string, string>): string {
  const company = escapeHtml(v.legalCompanyName || "OmniWTMS Ltd");
  const addr = escapeHtml(v.legalAddress || "");
  const rawUnsub = v.unsubscribeUrl || `${appBaseUrl()}/settings/notifications`;
  const href = escapeHtml(rawUnsub.replace(/"/g, "%22"));
  return `
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
<p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.5;">
  <strong>${company}</strong>${addr ? ` · ${addr}` : ""}
</p>
<p style="margin:0;font-size:12px;color:#6b7280;">
  <a href="${href}" style="color:#4b5563;text-decoration:underline;">Notification preferences / unsubscribe</a>
</p>`;
}
