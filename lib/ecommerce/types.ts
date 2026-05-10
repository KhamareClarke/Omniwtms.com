export type EcommerceProvider = "shopify" | "amazon" | "ebay" | "woocommerce";

export type SyncEntity = "products" | "orders" | "inventory";

export type SyncResult = {
  ok: boolean;
  synced?: number;
  error?: string;
};

export type IntegrationRow = {
  id: string;
  tenant_id: string;
  provider: EcommerceProvider;
  display_name: string | null;
  shop_identifier: string | null;
  status: string;
  access_token?: string | null;
  refresh_token?: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
};
