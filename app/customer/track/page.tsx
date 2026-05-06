// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerSidebar from "../CustomerSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function CustomerTrackPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [delivery, setDelivery] = useState<any>(null);
  const [timeline, setTimeline] = useState<{ step: string; label: string; occurred_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const customerStr = localStorage.getItem("currentCustomer");
    if (!customerStr) {
      router.push("/auth/login");
      return;
    }
    setCustomer(JSON.parse(customerStr));
  }, [router]);

  const handleTrack = async () => {
    const tn = trackingNumber?.trim();
    if (!tn || !customer?.id) return;
    setLoading(true);
    setError(null);
    setDelivery(null);
    setTimeline([]);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/customer/track?customer_id=${encodeURIComponent(customer.id)}&tracking_number=${encodeURIComponent(tn)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delivery not found");
        return;
      }
      setDelivery(data.delivery);
      setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
    } catch (e) {
      setError("Failed to look up tracking");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const stepIndex = delivery ? getStepIndex(delivery.status) : -2;
  const isFailed = delivery?.status === "failed";
  const expectedArrival = delivery?.created_at
    ? new Date(new Date(delivery.created_at).getTime() + 2 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CustomerSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Track Delivery</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter the tracking number from your email to see full tracking and expected arrival.
          </p>

          <div className="flex gap-2 mb-8">
            <Input
              placeholder="Enter tracking number (e.g. PKG-...)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="max-w-md"
            />
            <Button onClick={handleTrack} disabled={loading}>
              {loading ? "Searching…" : "Track"}
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {delivery && (
            <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order</p>
                    <p className="text-xl font-bold text-[#3456FF]">{delivery.package_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Expected arrival</p>
                    <p className="font-semibold text-gray-900">
                      {expectedArrival ? expectedArrival.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" }) : "—"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-mono">{delivery.package_id}</p>
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
                    {delivery.shipping_label?.from && delivery.shipping_label?.to && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                        <p><strong>From:</strong> {delivery.shipping_label.from}</p>
                        <p className="mt-1"><strong>To:</strong> {delivery.shipping_label.to}</p>
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
      </main>
    </div>
  );
}
