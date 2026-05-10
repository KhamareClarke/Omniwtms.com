import { jsPDF } from "jspdf";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendEmail, loadMailBranding, brandedEmailHtml } from "@/lib/email";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import {
  calculateOverageCharges,
  getUsageSnapshot,
  type BillingLimits,
} from "@/lib/billing/usage";
import { createStripeInvoiceForLocalRow } from "@/lib/stripe/sync-local-invoice";
import { hasStripeSecretKey } from "@/lib/stripe/client";

export type TenantBillingInvoiceRow = {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  currency: string;
  base_amount_gbp: number;
  overage_amount_gbp: number;
  total_amount_gbp: number;
  line_items: unknown;
  status: string;
  stripe_invoice_id: string | null;
  paid_at: string | null;
  due_at: string | null;
  overdue_reminder_level: number;
  created_at: string;
};

/** Previous calendar month relative to `anchor` (UTC). */
export function previousBillingMonthRange(anchor: Date): { periodStart: string; periodEnd: string } {
  const firstThisMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const lastPrev = new Date(firstThisMonth.getTime() - 24 * 60 * 60 * 1000);
  const firstPrev = new Date(Date.UTC(lastPrev.getUTCFullYear(), lastPrev.getUTCMonth(), 1));
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { periodStart: iso(firstPrev), periodEnd: iso(lastPrev) };
}

export function buildInvoicePdfLines(invoice: {
  id: string;
  period_start: string;
  period_end: string;
  tenantName: string;
  base_amount_gbp: number;
  overage_amount_gbp: number;
  total_amount_gbp: number;
  line_items: Array<{ label: string; amount_gbp: number }>;
}): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;
  doc.setFontSize(16);
  doc.text("OmniWTMS — monthly invoice", margin, y);
  y += 28;
  doc.setFontSize(10);
  doc.text(`Tenant: ${invoice.tenantName}`, margin, y);
  y += 16;
  doc.text(`Invoice ID: ${invoice.id}`, margin, y);
  y += 16;
  doc.text(`Period: ${invoice.period_start} → ${invoice.period_end}`, margin, y);
  y += 28;
  doc.setFontSize(11);
  doc.text("Line items", margin, y);
  y += 18;
  doc.setFontSize(10);
  for (const line of invoice.line_items) {
    doc.text(`${line.label}`, margin, y);
    doc.text(`£${line.amount_gbp.toFixed(2)}`, 480, y, { align: "right" });
    y += 14;
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
  }
  y += 20;
  doc.setFontSize(11);
  doc.text(`Base plan`, margin, y);
  doc.text(`£${invoice.base_amount_gbp.toFixed(2)}`, 480, y, { align: "right" });
  y += 16;
  doc.text(`Overage`, margin, y);
  doc.text(`£${invoice.overage_amount_gbp.toFixed(2)}`, 480, y, { align: "right" });
  y += 22;
  doc.setFontSize(12);
  doc.text(`Total due`, margin, y);
  doc.text(`£${invoice.total_amount_gbp.toFixed(2)}`, 480, y, { align: "right" });
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Creates a monthly invoice row for the previous calendar month, emails the tenant admin, returns invoice id.
 */
export async function createMonthlyInvoice(tenantId: string, anchor: Date = new Date()): Promise<{ ok: boolean; invoiceId?: string; error?: string }> {
  const supabase = createAdminServiceClient();
  const { data: tenant, error: tErr } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (tErr || !tenant) return { ok: false, error: tErr?.message || "Tenant not found" };
  const row = tenant as Record<string, unknown>;
  if (String(row.status || "") === "suspended") return { ok: false, error: "Tenant suspended" };

  const { periodStart, periodEnd } = previousBillingMonthRange(anchor);

  const { data: existing } = await supabase
    .from("tenant_billing_invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();
  if (existing) return { ok: true, invoiceId: (existing as { id: string }).id };

  const usageAnchor = new Date(`${periodStart}T12:00:00.000Z`);
  const snap = await getUsageSnapshot(tenantId, usageAnchor);
  const limits: BillingLimits = {
    max_api_calls_per_month: (row.max_api_calls_per_month as number | null) ?? null,
    max_storage_gb: (row.max_storage_gb as number | null) ?? null,
    max_orders_per_month: (row.max_orders_per_month as number | null) ?? null,
    max_deliveries_per_month: null,
  };
  const overage = calculateOverageCharges(
    {
      apiCalls: snap.apiCalls,
      storageGb: snap.storageGb,
      orders: snap.orders,
      deliveries: snap.deliveries,
    },
    limits
  );

  const base = Number(row.monthly_cost ?? 0) || 0;
  const total = Math.round((base + overage.totalGbp) * 10000) / 10000;
  const lineItems = [
    { label: "Base subscription", amount_gbp: base },
    { label: "API overage", amount_gbp: overage.apiChargeGbp },
    { label: "Storage overage", amount_gbp: overage.storageChargeGbp },
    { label: "Order volume overage", amount_gbp: overage.ordersChargeGbp },
    { label: "Delivery volume overage", amount_gbp: overage.deliveriesChargeGbp },
  ];

  const { data: inserted, error: iErr } = await supabase
    .from("tenant_billing_invoices")
    .insert({
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      currency: "GBP",
      base_amount_gbp: base,
      overage_amount_gbp: overage.totalGbp,
      total_amount_gbp: total,
      line_items: lineItems,
      status: "open",
      due_at: periodEnd,
    })
    .select("id")
    .single();
  if (iErr || !inserted) return { ok: false, error: iErr?.message || "Insert failed" };
  const invoiceId = (inserted as { id: string }).id;

  const stripeCustomerId = String(row.stripe_customer_id || "").trim();
  if (hasStripeSecretKey() && stripeCustomerId && total > 0) {
    await createStripeInvoiceForLocalRow({
      tenantId,
      localInvoiceId: invoiceId,
      stripeCustomerId,
      amountGbp: total,
      description: `OmniWTMS ${periodStart}–${periodEnd} (incl. usage)`,
    });
  }

  const adminEmail = String(row.admin_email || "").trim();
  if (adminEmail && (await isEmailOutgoingConfigured(tenantId))) {
    const branding = await loadMailBranding(tenantId);
    const name = String(row.name || "Organization");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const downloadUrl = `${appUrl}/settings/billing?invoice=${encodeURIComponent(invoiceId)}`;
    const html = brandedEmailHtml(
      `<p>Hello,</p>
<p>Your monthly billing statement for <strong>${periodStart}</strong> to <strong>${periodEnd}</strong> is ready.</p>
<ul>
<li>Base plan: £${base.toFixed(2)}</li>
<li>Overages: £${overage.totalGbp.toFixed(2)}</li>
<li><strong>Total: £${total.toFixed(2)}</strong></li>
</ul>
<p><a href="${downloadUrl}">Download PDF invoice</a> (signed-in organization context).</p>`,
      "Monthly invoice",
      branding
    );
    try {
      await sendEmail({
        to: adminEmail,
        subject: `${name} — invoice ${periodStart} to ${periodEnd}`,
        html,
        tenantId,
        fromDisplayName: branding?.companyName,
      });
    } catch (e) {
      console.error("createMonthlyInvoice email", e);
    }
  }

  return { ok: true, invoiceId };
}

export async function sendOverdueReminder(
  tenantId: string,
  invoiceId: string,
  level: number
): Promise<void> {
  const supabase = createAdminServiceClient();
  const { data: tenant } = await supabase.from("tenants").select("admin_email, name").eq("id", tenantId).maybeSingle();
  const row = tenant as { admin_email?: string | null; name?: string | null } | null;
  const adminEmail = String(row?.admin_email || "").trim();
  if (!adminEmail || !(await isEmailOutgoingConfigured(tenantId))) return;

  const branding = await loadMailBranding(tenantId);
  const html = brandedEmailHtml(
    `<p>This is reminder <strong>${level}</strong> for unpaid invoice <code>${invoiceId}</code>.</p>
<p>Please update your payment method in the billing portal or contact support.</p>`,
    "Payment overdue",
    branding
  );
  try {
    await sendEmail({
      to: adminEmail,
      subject: `Payment overdue — reminder ${level}`,
      html,
      tenantId,
      fromDisplayName: branding?.companyName,
    });
  } catch (e) {
    console.error("sendOverdueReminder", e);
  }
}
