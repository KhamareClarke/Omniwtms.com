export type HazmatClass = `UN ${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | null;

export type HazmatSku = {
  id?: string;
  code?: string;
  name?: string;
  hazmat_class?: string | null;
  hazmat_packing_group?: string | null;
  hazmat_proper_shipping_name?: string | null;
  is_forbidden_air?: boolean | null;
  is_forbidden_sea?: boolean | null;
};

export type TransportRequirements = {
  requiresLabel: boolean;
  requiresPlacard: boolean;
  requiresTrainedDriver: boolean;
  maxQtyWithoutSpecialPermit: number;
};

export function classifyHazmat(sku: HazmatSku): HazmatClass {
  const raw = String(sku.hazmat_class ?? "").trim().toUpperCase();
  const normalized = raw.startsWith("UN ") ? raw : raw ? `UN ${raw.replace(/^UN\s*/i, "")}` : "";
  const valid = new Set(["UN 1", "UN 2", "UN 3", "UN 4", "UN 5", "UN 6", "UN 7", "UN 8", "UN 9"]);
  return valid.has(normalized) ? (normalized as HazmatClass) : null;
}

export function getTransportRequirements(hazmatClass: HazmatClass): TransportRequirements {
  if (!hazmatClass) {
    return {
      requiresLabel: false,
      requiresPlacard: false,
      requiresTrainedDriver: false,
      maxQtyWithoutSpecialPermit: Number.MAX_SAFE_INTEGER,
    };
  }
  switch (hazmatClass) {
    case "UN 1":
    case "UN 7":
      return { requiresLabel: true, requiresPlacard: true, requiresTrainedDriver: true, maxQtyWithoutSpecialPermit: 0 };
    case "UN 2":
    case "UN 3":
    case "UN 4":
    case "UN 5":
      return { requiresLabel: true, requiresPlacard: true, requiresTrainedDriver: true, maxQtyWithoutSpecialPermit: 50 };
    case "UN 6":
    case "UN 8":
      return { requiresLabel: true, requiresPlacard: false, requiresTrainedDriver: true, maxQtyWithoutSpecialPermit: 25 };
    case "UN 9":
      return { requiresLabel: true, requiresPlacard: false, requiresTrainedDriver: false, maxQtyWithoutSpecialPermit: 200 };
    default:
      return { requiresLabel: false, requiresPlacard: false, requiresTrainedDriver: false, maxQtyWithoutSpecialPermit: Number.MAX_SAFE_INTEGER };
  }
}

export function isProhibitedByAir(sku: HazmatSku): boolean {
  if (Boolean(sku.is_forbidden_air)) return true;
  const c = classifyHazmat(sku);
  return c === "UN 1" || c === "UN 7";
}

export function isProhibitedByRoad(sku: HazmatSku): boolean {
  const c = classifyHazmat(sku);
  return c === "UN 1" || c === "UN 7";
}
