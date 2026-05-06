import { EventEmitter } from "events";

/**
 * Central event bus for shipment/delivery lifecycle.
 * Emit: shipment.created, delivery.status_updated, delivery.completed, etc.
 * Listeners: email, audit, notifications, stock updates.
 */

export type DeliveryEventPayload = {
  delivery_id: string;
  package_id?: string;
  old_status?: string;
  new_status: string;
  triggered_by?: "organization" | "courier";
  pod_file?: string;
  metadata?: Record<string, unknown>;
};

export type DeliveryAssignedPayload = {
  delivery_id: string;
  package_id: string;
  courier_name?: string;
  pickup?: string;
  delivery_to?: string;
};

const eventBus = new EventEmitter();
eventBus.setMaxListeners(20);

export const deliveryEvents = {
  /** Emitted when a delivery is assigned to a courier */
  DELIVERY_ASSIGNED: "delivery.assigned",
  /** Emitted when delivery status changes (in_progress, out_for_delivery, completed, failed) */
  STATUS_UPDATED: "delivery.status_updated",
  /** Emitted when delivery is marked completed (with or without POD) */
  DELIVERY_COMPLETED: "delivery.completed",
  /** Emitted when POD is uploaded */
  POD_UPLOADED: "delivery.pod_uploaded",
} as const;

export function emitDeliveryAssigned(payload: DeliveryAssignedPayload): void {
  eventBus.emit(deliveryEvents.DELIVERY_ASSIGNED, payload);
}

export function emitStatusUpdated(payload: DeliveryEventPayload): void {
  eventBus.emit(deliveryEvents.STATUS_UPDATED, payload);
  if (payload.new_status === "completed") {
    eventBus.emit(deliveryEvents.DELIVERY_COMPLETED, payload);
  }
  if (payload.pod_file && payload.new_status === "completed") {
    eventBus.emit(deliveryEvents.POD_UPLOADED, { ...payload });
  }
}

/** Subscribe to delivery events (for email, audit, notifications). Returns unsubscribe fn. */
export function onDeliveryAssigned(
  handler: (payload: DeliveryAssignedPayload) => void | Promise<void>
): () => void {
  const wrapped = (payload: DeliveryAssignedPayload) => {
    try {
      const r = handler(payload);
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch((err) => console.error("delivery.assigned listener error:", err));
      }
    } catch (err) {
      console.error("delivery.assigned listener error:", err);
    }
  };
  eventBus.on(deliveryEvents.DELIVERY_ASSIGNED, wrapped);
  return () => eventBus.off(deliveryEvents.DELIVERY_ASSIGNED, wrapped);
}

export function onStatusUpdated(
  handler: (payload: DeliveryEventPayload) => void | Promise<void>
): () => void {
  const wrapped = (payload: DeliveryEventPayload) => {
    try {
      const r = handler(payload);
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch((err) => console.error("delivery.status_updated listener error:", err));
      }
    } catch (err) {
      console.error("delivery.status_updated listener error:", err);
    }
  };
  eventBus.on(deliveryEvents.STATUS_UPDATED, wrapped);
  return () => eventBus.off(deliveryEvents.STATUS_UPDATED, wrapped);
}

export function onDeliveryCompleted(
  handler: (payload: DeliveryEventPayload) => void | Promise<void>
): () => void {
  const wrapped = (payload: DeliveryEventPayload) => {
    try {
      const r = handler(payload);
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch((err) => console.error("delivery.completed listener error:", err));
      }
    } catch (err) {
      console.error("delivery.completed listener error:", err);
    }
  };
  eventBus.on(deliveryEvents.DELIVERY_COMPLETED, wrapped);
  return () => eventBus.off(deliveryEvents.DELIVERY_COMPLETED, wrapped);
}

export function onPodUploaded(
  handler: (payload: DeliveryEventPayload) => void | Promise<void>
): () => void {
  const wrapped = (payload: DeliveryEventPayload) => {
    try {
      const r = handler(payload);
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch((err) => console.error("delivery.pod_uploaded listener error:", err));
      }
    } catch (err) {
      console.error("delivery.pod_uploaded listener error:", err);
    }
  };
  eventBus.on(deliveryEvents.POD_UPLOADED, wrapped);
  return () => eventBus.off(deliveryEvents.POD_UPLOADED, wrapped);
}
