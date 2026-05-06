// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Package,
  Truck,
  Upload,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/lib/auth/SupabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { AIParticleEffect } from "@/components/ui/ai-particle-effect";

function getCustomerInfo(activity: any) {
  // If customer is an object
  if (activity.customer && typeof activity.customer === "object") {
    return {
      name: activity.customer.name || "-",
      company: activity.customer.company || "-",
    };
  }
  // If customer is a string (try to parse JSON)
  if (activity.customer && typeof activity.customer === "string") {
    try {
      const parsed = JSON.parse(activity.customer);
      return {
        name: parsed.name || "-",
        company: parsed.company || "-",
      };
    } catch {
      // Not JSON, just show as string
      return {
        name: activity.customer,
        company: "-",
      };
    }
  }
  // Fallbacks
  return {
    name: activity.customer_id || activity.client_id || "-",
    company: "-",
  };
}

const headerMap: { [key: string]: string } = {
  accountn: "account",
  action: "action",
  address1: "address1",
  address2: "address2",
  address3: "address3",
  assemble: "assembly",
  assistedl: "assisted",
  delivery: "delivery",
  deliveryid: "deliveryid",
  emailadd: "emailadd",
  hub: "hub",
  ordernumbr: "order_numbr",
  postcode: "postcod",
  productcode: "productcode",
  productdescription: "productref",
  recipient: "recipient",
  telephone: "telephon",
  towncity: "towncity",
  warehouse: "warehou",
  cube: "cube",
  weightk: "weight_k",
  maxparts: "max_par",
  quantity: "quantity",
  accountname: "Account Name",
};

export default function CustomerActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [customerDeliveries, setCustomerDeliveries] = useState<any[]>([]);
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) {
        toast.error("Please log in to view customers");
        router.push("/auth/login");
        return;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.id) {
        toast.error("Invalid user data. Please log in again.");
        router.push("/auth/login");
        return;
      }

      // Fetch customers for this client
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (customersError) {
        console.error("Error fetching customers:", customersError);
        toast.error("Failed to load customers");
        return;
      }

      setCustomers(customersData || []);

      // Fetch inventory (optional – don’t block page if table missing or RLS blocks)
      const { data: inventory, error: inventoryError } = await supabase
        .from("customer_inventory")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (inventoryError) {
        console.warn("Customer inventory fetch skipped:", inventoryError);
        setInventory([]);
      } else {
        setInventory(inventory || []);
      }

      // Fetch activities (optional – warehouse_operations may not exist)
      const { data: activities, error: activitiesError } = await supabase
        .from("warehouse_operations")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (activitiesError) {
        console.warn("Activities fetch skipped:", activitiesError);
        setActivities([]);
      } else {
        setActivities(activities || []);
      }

      // Deliveries assigned to customers (for status update and visibility)
      try {
        const { data: deliveriesData, error: delError } = await supabase
          .from("deliveries")
          .select("id, package_id, status, created_at, customer_id, products, shipping_label")
          .eq("client_id", user.id)
          .not("customer_id", "is", null)
          .order("created_at", { ascending: false });
        if (delError) {
          console.warn("Deliveries fetch error:", delError);
          setCustomerDeliveries([]);
        } else {
          const list = Array.isArray(deliveriesData) ? deliveriesData : [];
          const withNames = list.map((d: any) => {
            const cust = customersData?.find((c: any) => c.id === d.customer_id);
            return { ...d, customers: cust ? { name: cust.name, email: cust.email } : null };
          });
          setCustomerDeliveries(withNames);
        }
      } catch (e) {
        console.warn("Deliveries fetch skipped:", e);
        setCustomerDeliveries([]);
      }
    } catch (error) {
      console.error("Error in fetchCustomerData:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredActivities = () => {
    return activities.filter((activity) => {
      if (filterType !== "all" && activity.operation_type !== filterType) {
        return false;
      }
      if (dateRange.start && new Date(activity.created_at) < dateRange.start) {
        return false;
      }
      if (dateRange.end && new Date(activity.created_at) > dateRange.end) {
        return false;
      }
      return true;
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "inventory_upload":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "delivery":
        return <Truck className="h-5 w-5 text-green-600" />;
      case "order":
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "inventory_upload":
        return "bg-blue-100";
      case "delivery":
        return "bg-green-100";
      case "order":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  // Filter inventory based on selected customer
  const filteredInventory =
    selectedCustomer === "all"
      ? inventory
      : inventory.filter((item) => item.customer_id === selectedCustomer);

  // Fetch orders for the selected customer
  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("simple_orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch customer orders");
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Exception fetching orders:", error);
      toast.error("Failed to fetch customer orders");
      return [];
    }
  };

  // Update activities when customer is selected
  useEffect(() => {
    if (selectedCustomer !== "all") {
      fetchCustomerOrders(selectedCustomer).then((orders) => {
        const orderActivities = orders.map((order) => ({
          ...order,
          type: "order",
        }));
        setActivities(orderActivities);
      });
    }
  }, [selectedCustomer]);

  const deliveryStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "completed", label: "Delivered" },
    { value: "failed", label: "Failed" },
  ] as const;

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    const dbStatus = newStatus;
    setUpdatingDeliveryId(deliveryId);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq("id", deliveryId);
      if (error) throw error;
      setCustomerDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: dbStatus } : d))
      );
      toast.success("Status updated. Customer will be notified.");
      await fetch("/api/notify-delivery-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_id: deliveryId,
          new_status: dbStatus,
          notify_organization: false,
          triggered_by: "organization",
        }),
      });
    } catch (e) {
      console.error("Update delivery status:", e);
      toast.error("Failed to update status");
    } finally {
      setUpdatingDeliveryId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AnimatedGradientBackground className="min-h-screen">
      <AIParticleEffect particleColor="#3456FF" density="low" />

      <div className="container mx-auto p-4 space-y-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Activity
          </h1>
          <div className="flex gap-4">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="all">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name ||
                    customer["Account Name"] ||
                    "Unnamed Customer"}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Activities</option>
              <option value="inventory_upload">Inventory Uploads</option>
              <option value="delivery">Deliveries</option>
              <option value="order">Orders</option>
            </select>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Filtered Items</p>
                <p className="text-2xl font-bold">{filteredInventory.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a) => a.type === "order").length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <Card className="glass-card border-gray-200 shadow-md relative mb-6">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold flex items-center">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Organization Customers
                </span>
                <Badge className="ml-2 bg-[#3456FF]/10 text-[#3456FF] border-[#3456FF]/20">
                  {customers.length} customers
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Contact
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Created At
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center">
                            <Users className="h-10 w-10 text-[#3456FF]" />
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3456FF]/0 via-[#3456FF]/30 to-[#3456FF]/0 rounded-full opacity-50 animate-scan"></div>
                          </div>
                          <p className="font-sans text-lg text-gray-600">
                            No customers found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors"
                      >
                        <TableCell className="font-medium font-sans">
                          {customer.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {customer.contact_number}
                        </TableCell>
                        <TableCell className="font-sans text-sm">
                          {customer.email || "-"}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-gray-600">
                          {new Date(customer.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Orders & Deliveries – update status (reflects in customer portal + email) */}
        <Card className="glass-card border-gray-200 shadow-md relative mb-6">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold flex items-center">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Customer Orders & Deliveries
                </span>
                <Badge className="ml-2 bg-[#3456FF]/10 text-[#3456FF] border-[#3456FF]/20">
                  {customerDeliveries.length} assigned
                </Badge>
              </div>
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Update status here; the customer sees it in their portal and receives an email.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 font-heading">Customer Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">Order / Package ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">Products</TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">Current Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">Update Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No deliveries assigned to customers yet. Assign from <strong>Couriers</strong> → Warehouse to Customer Address and select a customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerDeliveries.map((d) => {
                      const customer = Array.isArray(d.customers) ? d.customers[0] : d.customers;
                      const customerName = customer?.name ?? "—";
                      const customerEmail = customer?.email ?? "";
                      const products = d.products || [];
                      const productsSummary = Array.isArray(products)
                        ? products.map((p: any) => `${p.name || p.sku || "Item"} × ${p.quantity ?? 1}`).join("; ")
                        : "—";
                      const statusLabel =
                        d.status === "completed"
                          ? "Delivered"
                          : d.status === "out_for_delivery"
                          ? "Out for Delivery"
                          : d.status === "in_progress"
                          ? "In Progress"
                          : d.status === "failed"
                          ? "Failed"
                          : "Pending";
                      const statusValue =
                        d.status === "completed"
                          ? "completed"
                          : d.status === "out_for_delivery"
                          ? "out_for_delivery"
                          : d.status === "in_progress"
                          ? "in_progress"
                          : d.status === "failed"
                          ? "failed"
                          : "pending";
                      return (
                        <TableRow key={d.id} className="hover:bg-gray-50/70">
                          <TableCell className="font-medium">{customerName}</TableCell>
                          <TableCell className="font-mono text-sm">{d.package_id || d.id?.slice(0, 8) || "—"}</TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={productsSummary}>
                            {productsSummary}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                d.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : d.status === "in_progress" || d.status === "out_for_delivery"
                                  ? "bg-blue-100 text-blue-800"
                                  : d.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }
                            >
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <select
                              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white min-w-[160px]"
                              value={statusValue}
                              disabled={updatingDeliveryId === d.id}
                              onChange={(e) => updateDeliveryStatus(d.id, e.target.value)}
                            >
                              {deliveryStatusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {updatingDeliveryId === d.id && (
                              <span className="ml-2 text-xs text-gray-500">Updating…</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Activities Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
          </div>
          <div className="divide-y">
            {getFilteredActivities().map((activity) => {
              const isExpanded = expandedActivity === activity.id;

              return (
                <div key={activity.id} className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedActivity(isExpanded ? null : activity.id)
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`${getActivityColor(
                          activity.operation_type
                        )} p-2 rounded-full`}
                      >
                        {getActivityIcon(activity.operation_type)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-12">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">
                          Activity Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Operation Type
                            </p>
                            <p className="font-medium">
                              {activity.operation_type
                                ? activity.operation_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()
                                : activity.type === "order"
                                ? "ORDER"
                                : "UNKNOWN"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium">
                              {activity.status || "Completed"}
                            </p>
                          </div>
                          {activity.metadata && (
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">
                                Additional Information
                              </p>
                              <pre className="mt-1 text-sm bg-gray-100 p-2 rounded">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Inventory Section */}
        <Card className="glass-card border-gray-200 shadow-md relative">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold flex items-center">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  {selectedCustomer === "all"
                    ? "All Customer Inventory"
                    : `Inventory for ${
                        customers.find((c) => c.id === selectedCustomer)
                          ?.name || "Selected Customer"
                      }`}
                </span>
                <Badge className="ml-2 bg-[#3456FF]/10 text-[#3456FF] border-[#3456FF]/20">
                  {filteredInventory.length} items
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Product Details
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Customer Info
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Address
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Delivery
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Specifications
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Timestamps
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center">
                            <Package className="h-10 w-10 text-[#3456FF]" />
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3456FF]/0 via-[#3456FF]/30 to-[#3456FF]/0 rounded-full opacity-50 animate-scan"></div>
                          </div>
                          <p className="font-sans text-lg text-gray-600">
                            {selectedCustomer === "all"
                              ? "No inventory items found"
                              : "No inventory items found for this customer"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              Ref: {item.productref || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Code: {item.productcode || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity || "0"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Warehouse: {item.warehou || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item["Account Name"] || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Account: {item.account || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Email: {item.emailadd || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Phone: {item.telephon || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{item.address1 || "-"}</p>
                            <p className="text-sm">{item.address2 || "-"}</p>
                            <p className="text-sm">{item.address3 || "-"}</p>
                            <p className="text-sm">{item.towncity || "-"}</p>
                            <p className="text-sm">{item.postcod || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              Order: {item.order_numbr || "-"}
                            </p>
                            <p className="text-sm">
                              Delivery ID: {item.deliveryid || "-"}
                            </p>
                            <p className="text-sm">Hub: {item.hub || "-"}</p>
                            <p className="text-sm">
                              Assisted: {item.assisted || "No"}
                            </p>
                            <p className="text-sm">
                              Assembly: {item.assembly || "No"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">Cube: {item.cube || "-"}</p>
                            <p className="text-sm">
                              Weight: {item.weight_k || "-"} kg
                            </p>
                            <p className="text-sm">
                              Max Parts: {item.max_par || "-"}
                            </p>
                            <Badge
                              className={`
                              ${
                                item.action === "active"
                                  ? "bg-green-100 text-green-800"
                                  : item.action === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            `}
                            >
                              {item.action || "Unknown"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              Created:{" "}
                              {item.created_at
                                ? new Date(item.created_at).toLocaleString()
                                : "-"}
                            </p>
                            <p className="text-sm">
                              Updated:{" "}
                              {item.updated_at
                                ? new Date(item.updated_at).toLocaleString()
                                : "-"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Orders Section */}
        <Card className="glass-card border-gray-200 shadow-md relative">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
          <CardHeader>
            <CardTitle className="text-xl font-heading font-semibold flex items-center">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  {selectedCustomer === "all"
                    ? "All Customer Orders"
                    : `Orders for ${
                        customers.find((c) => c.id === selectedCustomer)
                          ?.name || "Selected Customer"
                      }`}
                </span>
                <Badge className="ml-2 bg-[#3456FF]/10 text-[#3456FF] border-[#3456FF]/20">
                  {activities.filter((a) => a.type === "order").length} orders
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Order ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Quantity
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 font-heading">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.filter((a) => a.type === "order").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center">
                            <ShoppingCart className="h-10 w-10 text-[#3456FF]" />
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3456FF]/0 via-[#3456FF]/30 to-[#3456FF]/0 rounded-full opacity-50 animate-scan"></div>
                          </div>
                          <p className="font-sans text-lg text-gray-600">
                            {selectedCustomer === "all"
                              ? "No orders found"
                              : "No orders found for this customer"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities
                      .filter((a) => a.type === "order")
                      .map((order) => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors"
                        >
                          <TableCell className="font-medium">
                            {order.id}
                          </TableCell>
                          <TableCell>{order.description}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedGradientBackground>
  );
}
