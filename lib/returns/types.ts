export type ReturnStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "label_sent"
  | "in_transit"
  | "received"
  | "inspecting"
  | "refunded"
  | "restocked"
  | "closed";

export type ReturnItemCondition = "unopened" | "opened" | "damaged" | "unknown";

export type ReturnItemInput = {
  /** Nullable when the source order is a simple_order without SKU linkage. */
  sku_id?: string | null;
  quantity: number;
  condition: ReturnItemCondition;
};

export type ReturnRow = {
  id: string;
  tenant_id: string;
  order_id: string | null;
  simple_order_id: string | null;
  customer_id: string;
  reason: string;
  status: ReturnStatus;
  rma_number: string;
  rejection_note: string | null;
  refund_reference: string | null;
  created_at: string;
  updated_at: string;
};
