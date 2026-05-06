"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, LayoutDashboard, Package, Truck, Home, AlertCircle } from "lucide-react";

const STEPS = [
  { key: "processed", label: "Order Processed", icon: ClipboardCheck },
  { key: "preparing", label: "Preparing", icon: LayoutDashboard },
  { key: "shipped", label: "Order Shipped", icon: Package },
  { key: "en_route", label: "Out for Delivery", icon: Truck },
  { key: "arrived", label: "Delivered", icon: Home },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "completed":
      return 5;
    case "out_for_delivery":
      return 4;
    case "in_progress":
      return 3;
    case "failed":
      return -1;
    default:
      return 2;
  }
}

/**
 * Public tracking result: /track/[tracking_number]. No login. Shows status, timeline, POD.
 */
export default function PublicTrackResultPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = decodeURIComponent((params.tracking_number as string) || "");
  const [delivery, setDelivery] = useState<{
    package_id: string;
    status: string;
    pod_file?: string;
    created_at?: string;
    notes?: string;
    from?: string;
    to?: string;
  } | null>(null);
  const [timeline, setTimeline] = useState<{ step: string; label: string; occurred_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingNumber) {
      setLoading(false);
      setError("Invalid tracking number");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/track?tracking_number=${encodeURIComponent(trackingNumber)}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Shipment not found");
          setDelivery(null);
          setTimeline([]);
          return;
        }
        setDelivery(data.delivery);
        setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Failed to load tracking");
          setDelivery(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  const stepIndex = delivery ? getStepIndex(delivery.status) : -2;
  const isFailed = delivery?.status === "failed";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3456FF] border-t-transparent" />
        <p className="text-gray-500 mt-4">Loading tracking…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/track" className="text-[#3456FF] font-semibold hover:underline">
            ← Track another
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            OmniWTMS
          </Link>
        </div>

        {error && (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/track")}
            >
              Try another number
            </Button>
          </div>
        )}

        {delivery && !error && (
          <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <p className="text-sm text-gray-500">Tracking number</p>
              <p className="text-xl font-bold text-[#3456FF]">{delivery.package_id}</p>
            </div>

            {isFailed ? (
              <div className="p-6 flex items-center gap-3 text-red-700 bg-red-50 border-t border-red-100">
                <AlertCircle className="h-8 w-8 shrink-0" />
                <div>
                  <p className="font-semibold">Delivery could not be completed</p>
                  <p className="text-sm">{delivery.notes || "Please contact support."}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6 pb-2">
                  <div className="flex items-center w-full">
                    {STEPS.map((step, i) => {
                      const nodeCompleted = stepIndex >= i + 1;
                      const lineCompleted = stepIndex >= i + 2;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-1 items-center min-w-0">
                          <div className={`flex flex-col items-center flex-1 min-w-0 ${nodeCompleted ? "text-[#3456FF]" : "text-gray-400"}`}>
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 shrink-0 ${
                                nodeCompleted ? "bg-[#3456FF] border-[#3456FF] text-white" : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-medium mt-2 text-center leading-tight truncate w-full px-0.5">{step.label}</p>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-1 rounded mx-0.5 min-w-[12px] ${lineCompleted ? "bg-[#3456FF]" : "bg-gray-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 pb-6 pt-4">
                  <p className="text-sm text-gray-500 text-center">
                    Current status:{" "}
                    <span className="font-semibold text-gray-900">
                      {delivery.status === "completed"
                        ? "Delivered"
                        : delivery.status === "out_for_delivery"
                        ? "Out for Delivery"
                        : delivery.status === "in_progress"
                        ? "In Progress"
                        : delivery.status === "failed"
                        ? "Failed"
                        : stepIndex >= 1 && stepIndex <= 5
                        ? STEPS[stepIndex - 1].label
                        : "Processing"}
                    </span>
                  </p>
                  {timeline.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Delivery history</p>
                      <ul className="space-y-2">
                        {timeline.map((t, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-2 h-2 rounded-full bg-[#3456FF] shrink-0" />
                            <span className="text-gray-800">{t.label}</span>
                            <span className="text-gray-500 ml-auto whitespace-nowrap">
                              {t.occurred_at ? new Date(t.occurred_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(delivery.from || delivery.to) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                      {delivery.from && <p><strong>From:</strong> {delivery.from}</p>}
                      {delivery.to && <p className="mt-1"><strong>To:</strong> {delivery.to}</p>}
                    </div>
                  )}
                  {delivery.pod_file && delivery.status === "completed" && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
                      <p className="font-medium text-emerald-800">Proof of delivery</p>
                      <a href={delivery.pod_file} target="_blank" rel="noopener noreferrer" className="text-[#3456FF] underline">View proof of delivery</a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
