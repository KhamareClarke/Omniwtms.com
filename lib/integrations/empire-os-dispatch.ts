import { sendEmpireOSEvent } from "@/lib/integrations/empire-os";

/** Canonical Empire OS / autonomous-skill event names (webhook contract). */
export const EmpireOSEvents = {
  ORDER_CREATED: "order_created",
  ORDER_PICKED: "order_picked",
  ORDER_SHIPPED: "order_shipped",
  DELIVERY_ASSIGNED: "delivery_assigned",
  DELIVERY_IN_TRANSIT: "delivery_in_transit",
  DELIVERY_COMPLETED: "delivery_completed",
  DELIVERY_FAILED: "delivery_failed",
  INVENTORY_LOW: "inventory_low",
  WAREHOUSE_BACKLOG: "warehouse_backlog",
  PERFORMANCE_MILESTONE: "performance_milestone",
  /** Generic lifecycle envelope (always safe for integrators). */
  DELIVERY_STATUS_UPDATED: "delivery.status_updated",
} as const;

/**
 * Fire-and-forget webhook when tenant has Empire OS enabled. Never throws.
 */
export function empireOsDispatch(
  tenantId: string | null | undefined,
  event: string,
  payload: Record<string, unknown>
): void {
  if (!tenantId || typeof tenantId !== "string") return;
  void sendEmpireOSEvent({ tenantId, event, payload }).catch(() => {});
}
