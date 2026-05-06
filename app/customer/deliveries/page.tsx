// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerSidebar from "../CustomerSidebar";
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerDeliveriesPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    const customerStr = localStorage.getItem("currentCustomer");
    if (!customerStr) {
      router.push("/auth/login");
      return;
    }
    setCustomer(JSON.parse(customerStr));
  }, [router]);

  const fetchDeliveries = async (customerId: string) => {
    setLoading(true);
    setSetupRequired(false);
    try {
      const res = await fetch(
        `/api/customer/deliveries?customer_id=${encodeURIComponent(customerId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Error fetching deliveries:", data.error || res.statusText);
        setDeliveries([]);
        return;
      }
      const list = data.deliveries ?? (Array.isArray(data) ? data : []);
      setDeliveries(list);
      setSetupRequired(Boolean(data.setupRequired));
    } catch (e) {
      console.error("Error fetching deliveries:", e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.id) {
      fetchDeliveries(customer.id);
      const interval = setInterval(() => fetchDeliveries(customer.id), 30000);
      return () => clearInterval(interval);
    }
  }, [customer?.id]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Delivered", color: "bg-green-100 text-green-800 border-green-200" };
      case "out_for_delivery":
        return { label: "Out for delivery", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "in_progress":
        return { label: "In progress", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "failed":
        return { label: "Failed", color: "bg-red-100 text-red-800 border-red-200" };
      default:
        return { label: "Out for delivery", color: "bg-amber-100 text-amber-800 border-amber-200" };
    }
  };

  if (!customer) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CustomerSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Deliveries</h1>
          <p className="text-sm text-gray-500 mb-6">
            When a delivery is assigned to you, it appears here as <strong>Out for delivery</strong> with date and time. Status updates when the courier marks progress; <strong>Delivered</strong> means order delivered.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : setupRequired ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="font-semibold text-amber-900 mb-2">One-time setup required</p>
              <p className="text-sm text-amber-800 mb-4">
                So that your deliveries show here, your organisation needs to run this once in <strong>Supabase Dashboard → SQL Editor</strong>:
              </p>
              <pre className="bg-white border border-amber-200 rounded p-3 text-xs overflow-x-auto mb-4">
                ALTER TABLE deliveries{"\n"}
                ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
              </pre>
              <p className="text-sm text-amber-800 mb-2">
                Then when assigning a delivery, they must choose <strong>Warehouse to Customer Address</strong> and <strong>select your name</strong> in the customer list. After that, your delivery will appear here as <strong>Out for delivery</strong> with date and time.
              </p>
              <button
                type="button"
                onClick={() => customer?.id && fetchDeliveries(customer.id)}
                className="mt-2 text-sm font-medium text-amber-800 underline hover:no-underline"
              >
                Refresh after setup
              </button>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No deliveries yet</p>
              <p className="text-sm text-gray-500 mt-1">
                As soon as a delivery is assigned to you, it will show here as <strong>Out for delivery</strong> with date, time, from/to address and courier details.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Make sure you’re logged in with the same account that the organisation selects when they assign the delivery.
              </p>
              <button
                type="button"
                onClick={() => customer?.id && fetchDeliveries(customer.id)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((d) => {
                const courier = Array.isArray(d.couriers) ? d.couriers[0] : d.couriers;
                const statusInfo = getStatusLabel(d.status);
                const pickupLocation = d.shipping_label?.pickup?.location;
                const deliveryAddress =
                  d.shipping_label?.delivery?.address || "—";
                const createdAt = d.created_at
                  ? new Date(d.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—";

                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {d.package_id || `Delivery #${d.id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            {createdAt}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${statusInfo.color} border font-medium`}
                      >
                        {d.status === "completed" && (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {d.status === "failed" && (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                      {pickupLocation && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-700">From (pickup): </span>
                            {pickupLocation}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-700">To (delivery address): </span>
                          {deliveryAddress}
                        </span>
                      </div>
                      {courier?.name && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-700">Courier: </span>
                            {courier.name}
                            {courier.phone ? ` • ${courier.phone}` : ""}
                          </span>
                        </div>
                      )}
                      {d.priority && (
                        <div className="text-gray-500">
                          Priority: <span className="capitalize">{d.priority}</span>
                        </div>
                      )}
                      {d.notes && (
                        <p className="text-gray-500 italic">Note: {d.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
