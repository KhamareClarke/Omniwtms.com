import { defaultTemplateVars, footerBlock } from "./common";
import { EMAIL_TEMPLATE_CATALOG } from "./catalog";
import type { TemplateId } from "./types";

export type { TemplateId } from "./types";
export { TEMPLATE_IDS, isTemplateId } from "./types";

export function buildEmailFromTemplate(
  id: TemplateId,
  variables: Record<string, string>,
  tenantId?: string | null
): { subject: string; htmlBody: string } {
  const defaults = defaultTemplateVars(tenantId ?? undefined);
  const v = { ...defaults, ...variables };
  const builder = EMAIL_TEMPLATE_CATALOG[id];
  const { subject, body } = builder(v);
  const htmlBody = `<div style="color:#111827;font-size:15px;line-height:1.6;">${body}</div>${footerBlock(v)}`;
  return { subject, htmlBody };
}
