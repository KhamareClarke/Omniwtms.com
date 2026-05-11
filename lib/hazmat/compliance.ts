import {
  classifyHazmat,
  getTransportRequirements,
  isProhibitedByAir,
  isProhibitedByRoad,
  type HazmatSku,
} from "@/lib/hazmat/classify";

export type DeliveryMode = "air" | "road" | "sea";

export type ComplianceResult = {
  canDeliver: boolean;
  reasons: string[];
  requiresSignature: boolean;
  requiresSpecialHandling: boolean;
  requiresShippersDeclaration: boolean;
};

export function canDeliver(sku: HazmatSku, mode: DeliveryMode): { allowed: boolean; reason?: string } {
  const c = classifyHazmat(sku);
  if (!c) return { allowed: true };
  if (mode === "air" && isProhibitedByAir(sku)) return { allowed: false, reason: "Prohibited by air regulations" };
  if (mode === "road" && isProhibitedByRoad(sku)) return { allowed: false, reason: "Prohibited by road regulations" };
  if (mode === "sea" && Boolean(sku.is_forbidden_sea)) return { allowed: false, reason: "Prohibited by sea regulations" };
  return { allowed: true };
}

export function requiresSignature(sku: HazmatSku): boolean {
  const c = classifyHazmat(sku);
  return c !== null;
}

export function requiresSpecialHandling(sku: HazmatSku): boolean {
  const c = classifyHazmat(sku);
  if (!c) return false;
  const req = getTransportRequirements(c);
  return req.requiresPlacard || req.requiresTrainedDriver;
}

export function requiresShippersDeclaration(sku: HazmatSku): boolean {
  const c = classifyHazmat(sku);
  if (!c) return false;
  return c !== "UN 9";
}

export function evaluateHazmatCompliance(sku: HazmatSku, mode: DeliveryMode): ComplianceResult {
  const reasons: string[] = [];
  const deliverable = canDeliver(sku, mode);
  if (!deliverable.allowed) reasons.push(deliverable.reason ?? "Not deliverable");
  return {
    canDeliver: deliverable.allowed,
    reasons,
    requiresSignature: requiresSignature(sku),
    requiresSpecialHandling: requiresSpecialHandling(sku),
    requiresShippersDeclaration: requiresShippersDeclaration(sku),
  };
}
