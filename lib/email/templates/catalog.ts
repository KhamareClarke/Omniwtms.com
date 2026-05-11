import { mergeVars } from "./common";
import type { TemplateId } from "./types";

type Builder = (v: Record<string, string>) => { subject: string; body: string };

const S = (subjectTpl: string, bodyTpl: string): Builder => {
  return (v) => ({
    subject: mergeVars(subjectTpl, v),
    body: mergeVars(bodyTpl, v),
  });
};

export const EMAIL_TEMPLATE_CATALOG: Record<TemplateId, Builder> = {
  "org-welcome": S(
    "Welcome to {{orgName}}",
    `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 12px;">Your organization <strong>{{orgName}}</strong> is set up on OmniWTMS. You can sign in at <a href="{{appUrl}}/auth/login" style="color:#3456FF;">{{appUrl}}/auth/login</a>.</p>
<p style="margin:0;">If you did not create this account, contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>`
  ),
  "password-reset": S(
    "Reset your password",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">We received a request to reset your password. Use the link below (valid for a limited time):</p>
<p style="margin:0 0 16px;"><a href="{{resetUrl}}" style="display:inline-block;padding:12px 20px;background:#3456FF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
<p style="margin:0;font-size:13px;color:#6b7280;">If the button does not work, copy this URL:<br/><span style="word-break:break-all;">{{resetUrl}}</span></p>`
  ),
  "password-changed": S(
    "Your password was changed",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Your account password was changed successfully.</p>
<p style="margin:0;">If this was not you, reset your password immediately and contact {{supportEmail}}.</p>`
  ),
  "2fa-enabled": S(
    "Two-factor authentication enabled",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Two-factor authentication is now enabled for {{orgName}}. Future sign-ins may require your second factor.</p>`
  ),
  "order-confirmation": S(
    "Order {{orderId}} confirmed",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Thank you for your order. <strong>Order ID:</strong> {{orderId}}</p>
<p style="margin:0 0 12px;"><strong>Total:</strong> {{amount}} {{currency}}</p>
<p style="margin:0;">We will notify you when it ships.</p>`
  ),
  "order-picked": S(
    "Order {{orderId}} picked",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Your order <strong>{{orderId}}</strong> has been picked and is being prepared for dispatch.</p>`
  ),
  "order-shipped": S(
    "Order {{orderId}} shipped",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Your order <strong>{{orderId}}</strong> has shipped.</p>
<p style="margin:0;"><strong>Tracking:</strong> {{trackingUrl}}</p>`
  ),
  "delivery-complete": S(
    "Delivery complete — {{packageId}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Your delivery <strong>{{packageId}}</strong> is complete.</p>
<p style="margin:0;">{{extraNote}}</p>`
  ),
  "delivery-failed": S(
    "Delivery issue — {{packageId}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">We could not complete delivery for <strong>{{packageId}}</strong>.</p>
<p style="margin:0;"><strong>Reason:</strong> {{failureReason}}</p>`
  ),
  "invoice-generated": S(
    "Invoice {{invoiceNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Invoice <strong>{{invoiceNumber}}</strong> for <strong>{{amount}} {{currency}}</strong> is ready.</p>
<p style="margin:0;"><a href="{{invoiceUrl}}" style="color:#3456FF;">View invoice</a></p>`
  ),
  "payment-received": S(
    "Payment received — {{amount}} {{currency}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">We received your payment of <strong>{{amount}} {{currency}}</strong> for {{orgName}}. Thank you.</p>`
  ),
  "payment-failed": S(
    "Payment failed — {{amount}} {{currency}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Your payment of <strong>{{amount}} {{currency}}</strong> could not be processed.</p>
<p style="margin:0;">{{failureReason}} — <a href="{{retryUrl}}" style="color:#3456FF;">Try again</a></p>`
  ),
  "payment-overdue": S(
    "Payment overdue (reminder {{escalationLevel}}) — {{orgName}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">This is reminder <strong>{{escalationLevel}}</strong> of 3: an amount of <strong>{{amount}} {{currency}}</strong> is overdue for {{orgName}}.</p>
<p style="margin:0;"><a href="{{payUrl}}" style="color:#3456FF;">Pay now</a></p>`
  ),
  "account-suspended": S(
    "Account suspended — {{orgName}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Your {{orgName}} account has been suspended. Reason: {{suspensionReason}}. Contact {{supportEmail}}.</p>`
  ),
  "delivery-assigned": S(
    "New delivery assigned — {{packageId}}",
    `<p style="margin:0 0 12px;">Hi {{courierName}},</p>
<p style="margin:0 0 12px;">You have a new delivery <strong>{{packageId}}</strong>.</p>
<p style="margin:0;"><strong>Pickup:</strong> {{pickupAddress}}<br/><strong>Dropoff:</strong> {{dropoffAddress}}</p>`
  ),
  "daily-performance-summary": S(
    "Daily performance summary",
    `<p style="margin:0 0 12px;">Hi {{courierName}},</p>
<p style="margin:0 0 12px;">Yesterday: <strong>{{deliveriesCount}}</strong> deliveries · on-time <strong>{{onTimePercent}}%</strong>.</p>
<p style="margin:0;">Keep up the great work for {{orgName}}.</p>`
  ),
  "weekly-performance-report": S(
    "Weekly performance report",
    `<p style="margin:0 0 12px;">Hi {{courierName}},</p>
<p style="margin:0 0 12px;">Week summary for {{orgName}}: <strong>{{deliveriesCount}}</strong> deliveries completed.</p>
<p style="margin:0;">Details are in your courier dashboard.</p>`
  ),
  "low-inventory-alert": S(
    "Low inventory: {{sku}}",
    `<p style="margin:0 0 12px;">Team {{orgName}},</p>
<p style="margin:0;">SKU <strong>{{sku}}</strong> at <strong>{{warehouseName}}</strong> is below threshold (current: {{currentQty}}, min: {{minQty}}).</p>`
  ),
  "warehouse-capacity-warning": S(
    "Warehouse capacity warning — {{warehouseName}}",
    `<p style="margin:0 0 12px;">Team {{orgName}},</p>
<p style="margin:0;">{{warehouseName}} is at <strong>{{utilizationPercent}}%</strong> capacity. Plan inbound or transfers.</p>`
  ),
  "new-order-received": S(
    "New order received — {{orderId}}",
    `<p style="margin:0 0 12px;">Team {{orgName}},</p>
<p style="margin:0;">A new order <strong>{{orderId}}</strong> is ready for processing.</p>`
  ),
  "picking-complete": S(
    "Picking complete — {{orderId}}",
    `<p style="margin:0 0 12px;">Team {{orgName}},</p>
<p style="margin:0;">Picking for order <strong>{{orderId}}</strong> is complete and ready for packing/shipping.</p>`
  ),
  "new-organization-signup": S(
    "[Admin] New organization: {{orgName}}",
    `<p style="margin:0 0 12px;">Platform admin,</p>
<p style="margin:0;">A new organization registered: <strong>{{orgName}}</strong> ({{adminEmail}}).</p>`
  ),
  "critical-system-alert": S(
    "[Admin] Critical alert: {{alertTitle}}",
    `<p style="margin:0 0 12px;">Platform admin,</p>
<p style="margin:0;"><strong>{{alertTitle}}</strong></p>
<p style="margin:0 0 12px;">{{alertBody}}</p>
<p style="margin:0;font-size:13px;color:#6b7280;">Severity: {{severity}}</p>`
  ),
  "support-ticket-received": S(
    "Support ticket {{ticketId}} received",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">We received your request (ticket <strong>{{ticketId}}</strong>). Our team will respond shortly.</p>`
  ),
  "support-ticket-resolved": S(
    "Support ticket {{ticketId}} resolved",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Ticket <strong>{{ticketId}}</strong> is resolved. Summary: {{resolutionSummary}}</p>`
  ),
  "payment-reminder": S(
    "Payment reminder — {{orgName}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Friendly reminder: <strong>{{amount}} {{currency}}</strong> is due on {{dueDate}} for {{orgName}}.</p>`
  ),
  "trial-ending-soon": S(
    "Your trial ends soon — {{orgName}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Your trial for {{orgName}} ends on <strong>{{trialEndDate}}</strong>. Upgrade to keep full access: <a href="{{upgradeUrl}}" style="color:#3456FF;">{{upgradeUrl}}</a></p>`
  ),
  "api-key-rotated": S(
    "API key rotated — {{orgName}}",
    `<p style="margin:0 0 12px;">Team {{orgName}},</p>
<p style="margin:0;">An API key ending in <strong>{{keyLast4}}</strong> was rotated. Update integrations if needed.</p>`
  ),
  "return-created": S(
    "Return submitted — {{rmaNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">We received your return request <strong>{{rmaNumber}}</strong>.</p>
<p style="margin:0 0 12px;"><strong>Reason:</strong> {{reason}}</p>
<p style="margin:0;">Track status: <a href="{{returnStatusUrl}}" style="color:#3456FF;">{{returnStatusUrl}}</a></p>`
  ),
  "return-approved": S(
    "Return approved — {{rmaNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Your return <strong>{{rmaNumber}}</strong> is approved.</p>
<p style="margin:0 0 12px;">Download your return label: <a href="{{labelUrl}}" style="color:#3456FF;">{{labelUrl}}</a></p>
<p style="margin:0;">Print and attach it to the outer carton.</p>`
  ),
  "return-rejected": S(
    "Return not approved — {{rmaNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">We could not approve return <strong>{{rmaNumber}}</strong>.</p>
<p style="margin:0;"><strong>Reason:</strong> {{rejectionReason}}</p>`
  ),
  "return-received": S(
    "We received your return — {{rmaNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Your package for <strong>{{rmaNumber}}</strong> arrived at our facility. Inspection will follow.</p>`
  ),
  "refund-processed": S(
    "Refund processed — {{rmaNumber}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0;">Refund for <strong>{{rmaNumber}}</strong> is processed. Reference: <strong>{{refundReference}}</strong>.</p>`
  ),
  "temperature-deviation": S(
    "Temperature alert — {{packageId}}",
    `<p style="margin:0 0 12px;">Hi {{customerName}},</p>
<p style="margin:0 0 12px;">Cold chain alert for <strong>{{packageId}}</strong>: reading <strong>{{reading}}°C</strong> (allowed {{minTemp}}°C – {{maxTemp}}°C).</p>
<p style="margin:0;">Device: {{deviceId}} · {{occurredAt}}</p>`
  ),
};
