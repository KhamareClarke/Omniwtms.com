/** All transactional template ids (Phase 5). */
export const TEMPLATE_IDS = [
  // Auth (4)
  "org-welcome",
  "password-reset",
  "password-changed",
  "2fa-enabled",
  // Orders / delivery (5)
  "order-confirmation",
  "order-picked",
  "order-shipped",
  "delivery-complete",
  "delivery-failed",
  // Billing (5) — use {{escalationLevel}} 1|2|3 for payment-overdue
  "invoice-generated",
  "payment-received",
  "payment-failed",
  "payment-overdue",
  "account-suspended",
  // Courier (3)
  "delivery-assigned",
  "daily-performance-summary",
  "weekly-performance-report",
  // Warehouse (4)
  "low-inventory-alert",
  "warehouse-capacity-warning",
  "new-order-received",
  "picking-complete",
  // Admin (2)
  "new-organization-signup",
  "critical-system-alert",
  // Support (2)
  "support-ticket-received",
  "support-ticket-resolved",
  // Extra system (3) + returns (5) + cold chain (1)
  "payment-reminder",
  "trial-ending-soon",
  "api-key-rotated",
  // Returns / RMA (5)
  "return-created",
  "return-approved",
  "return-rejected",
  "return-received",
  "refund-processed",
  // Cold chain (1)
  "temperature-deviation",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(id: string): id is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(id);
}
