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

function registerListeners() {
  onDeliveryAssigned((payload: DeliveryAssignedPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.assigned", payload.package_id, payload.courier_name);
    }
  });

  onStatusUpdated((payload: DeliveryEventPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.status_updated", payload.package_id, payload.old_status, "->", payload.new_status);
    }
  });

  onDeliveryCompleted((payload: DeliveryEventPayload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[events] delivery.completed", payload.package_id);
    }
  });
}

registerListeners();
