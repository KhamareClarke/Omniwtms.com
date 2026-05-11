/**
 * Listener module for delivery events.
 * Subscribes to delivery.assigned, delivery.status_updated, delivery.completed.
 * Use for: email, audit, notifications, stock updates. This module logs for verification;
 * primary email/audit remain in API routes for reliability.
 */
import {
  onDeliveryAssigned,
  onStatusUpdated,
  onDeliveryCompleted,
  type DeliveryEventPayload,
  type DeliveryAssignedPayload,
} from "@/lib/events";
import { empireOsDispatch, EmpireOSEvents } from "@/lib/integrations/empire-os-dispatch";

function registerListeners() {
  onDeliveryAssigned((payload: DeliveryAssignedPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.assigned", payload.package_id, payload.courier_name);
    }
    const tid = payload.tenant_id;
    empireOsDispatch(tid, EmpireOSEvents.DELIVERY_ASSIGNED, {
      delivery_id: payload.delivery_id,
      package_id: payload.package_id,
      courier_name: payload.courier_name,
      pickup: payload.pickup,
      delivery_to: payload.delivery_to,
    });
  });

  onStatusUpdated((payload: DeliveryEventPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.status_updated", payload.package_id, payload.old_status, "->", payload.new_status);
    }
    const tid = payload.metadata?.tenant_id;
    if (typeof tid !== "string" || !tid) return;

    const base: Record<string, unknown> = {
      delivery_id: payload.delivery_id,
      package_id: payload.package_id,
      old_status: payload.old_status,
      new_status: payload.new_status,
      triggered_by: payload.triggered_by,
    };

    empireOsDispatch(tid, EmpireOSEvents.DELIVERY_STATUS_UPDATED, { ...base });

    switch (payload.new_status) {
      case "in_progress":
        empireOsDispatch(tid, EmpireOSEvents.ORDER_PICKED, base);
        break;
      case "out_for_delivery":
        empireOsDispatch(tid, EmpireOSEvents.ORDER_SHIPPED, base);
        empireOsDispatch(tid, EmpireOSEvents.DELIVERY_IN_TRANSIT, base);
        break;
      case "completed":
        empireOsDispatch(tid, EmpireOSEvents.DELIVERY_COMPLETED, base);
        break;
      case "failed":
        empireOsDispatch(tid, EmpireOSEvents.DELIVERY_FAILED, base);
        break;
      default:
        break;
    }
  });

  onDeliveryCompleted((payload: DeliveryEventPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.completed", payload.package_id);
    }
  });
}

registerListeners();
