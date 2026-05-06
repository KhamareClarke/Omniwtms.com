// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Map, Package } from "lucide-react";
import Barcode from "react-barcode";

interface Courier {
  id: string;
  // Personal Information
  name: string;
  email: string;
  phone: string;
  // Vehicle Information
  vehicle_type: string;
  vehicle_registration: string;
  max_capacity: number;
  // Zone Information
  assigned_region: string;
  default_zone: string;
  // Performance
  status: "active" | "inactive" | "delayed";
  deliveries_completed: number;
  created_at: string;
  client_id: string;
}

interface DeliveryStop {
  id: string;
  delivery_id: string;
  address: string;
  stop_type: "pickup" | "delivery";
  sequence: number;
  status: "pending" | "completed";
  estimated_time: string;
}

interface ShippingLabel {
  packageId: string;
  products: Array<{
    name: string;
    quantity: number;
    dimensions?: string;
    weight?: number;
  }>;
  pickup: {
    location: string;
    time: string;
  };
  delivery: {
    address: string;
    notes: string;
  };
  courier: {
    name: string;
    vehicle: string;
    phone: string;
  };
  priority: string;
  totalWeight: number;
  status: string;
  createdAt: string;
}

interface Delivery {
  id: string;
  courier_id: string;
  package_id: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: string;
  client_id: string;
  products: Array<{
    name: string;
    quantity: number;
    dimensions?: string;
    weight?: number;
  }>;
  delivery_stops?: DeliveryStop[];
  courier?: {
    name: string;
    vehicle_type: string;
    phone: string;
  };
  optimized_route?: any;
  shipping_label?: ShippingLabel;
  pod_file?: string;
  all_stops_completed?: boolean;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  client_id: string;
}

interface Product {
  product_id: string;
  name: string;
  quantity: number;
  dimensions?: string;
  weight?: number;
  sku?: string;
  category?: string;
}

interface RouteOption {
  id: number;
  name: string;
  description: string;
  distance: number;
  duration: number;
  fuelConsumption: number;
  totalFuelCost: number;
  stops: Array<{
    name: string;
    distance: number;
    duration: number;
    traffic: "Low" | "Medium" | "High";
    weather: "Clear" | "Rainy" | "Snowy" | "Foggy";
  }>;
  advantages: string[];
  roadType: "Highway" | "City" | "Mixed";
}

interface GoogleRouteResponse {
  distance: number;
  duration: number;
  steps: Array<{
    distance: number;
    duration: number;
    instructions: string;
    path: Array<{ lat: number; lng: number }>;
  }>;
}

interface Route {
  id: string;
  destination: string;
  notes?: string;
  priority: string;
  status: string;
}

// Create the Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const RouteOptionCard = ({
  option,
  selectedRoute,
}: {
  option: RouteOption;
  selectedRoute: RouteOption | null;
}) => (
  <div
    className={`flex items-center justify-between p-4 border rounded-lg ${
      selectedRoute?.id === option.id ? "border-blue-500" : ""
    }`}
  >
    <div>
      <h4 className="font-semibold">{option.name}</h4>
      <p className="text-sm text-gray-600">{option.description}</p>
    </div>
    <Badge variant={option.id === 1 ? "success" : "secondary"}>
      {option.id === 1 ? "Recommended" : "Alternative"}
    </Badge>
  </div>
);

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isDeliveriesLoading, setIsDeliveriesLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    phone: "",
    // Vehicle Information
    vehicle_type: "",
    vehicle_registration: "",
    max_capacity: "",
    // Zone Information
    assigned_region: "",
    default_zone: "",
  });
  const [showAssignDeliveryDialog, setShowAssignDeliveryDialog] =
    useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [deliveryType, setDeliveryType] = useState<"warehouse" | "client">(
    "warehouse"
  );
  const [deliveryFormData, setDeliveryFormData] = useState({
    package_id: "",
    priority: "medium",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    client_address: "",
    client_postal_code: "",
    pickup_time: "",
    notes: "",
    products: [{ name: "", quantity: 0 }],
  });
  const [deliveryStep, setDeliveryStep] = useState(1);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; contact_number?: string; email?: string }>>([]);
  const [selectedDeliveryCustomerId, setSelectedDeliveryCustomerId] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastDeliveryDetails, setLastDeliveryDetails] =
    useState<Delivery | null>(null);
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{
      product_id: string;
      name: string;
      quantity: number;
      dimensions?: string;
      weight?: number;
    }>
  >([]);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  );
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [assignWithoutRoute, setAssignWithoutRoute] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showRouteDetailsDialog, setShowRouteDetailsDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<ShippingLabel | null>(
    null
  );
  const [selectedRouteDetails, setSelectedRouteDetails] = useState<any>(null);
  // Add a new state for email error
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (deliveryType === "warehouse" && deliveryStep > 5) {
      setDeliveryStep(5);
    }
  }, [deliveryType, deliveryStep]);

  const checkAuthAndFetchData = async () => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("Please sign in to view couriers");
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      await Promise.all([
        fetchCouriers(userData.id),
        fetchWarehouses(userData.id),
        fetchDeliveries(userData.id),
        fetchCustomers(userData.id),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchCouriers = async (clientId: string) => {
    try {
      setIsTableLoading(true);
      const { data, error } = await supabaseClient
        .from("couriers")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCouriers(data || []);
    } catch (error) {
      console.error("Error fetching couriers:", error);
      toast.error("Failed to fetch couriers");
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchWarehouses = async (clientId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("warehouses")
        .select("*")
        .eq("client_id", clientId);

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to fetch warehouses");
    }
  };

  const fetchCustomers = async (clientId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("customers")
        .select("id, name, contact_number, email")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    }
  };

  const sendEmail = async (to: string | string[], subject: string, html: string) => {
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Send email failed:", data.error || res.statusText);
      }
    } catch (e) {
      console.error("Send email error:", e);
    }
  };

  const fetchDeliveries = async (clientId: string) => {
    try {
      setIsDeliveriesLoading(true);
      const { data, error } = await supabaseClient
        .from("deliveries")
        .select(
          `
          *,
          courier:courier_id (
            name,
            vehicle_type,
            phone
          ),
          delivery_stops (
            address,
            stop_type
          ),
          shipping_label,
          optimized_route
        `
        )
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to fetch deliveries");
    } finally {
      setIsDeliveriesLoading(false);
    }
  };

  const fetchWarehouseProducts = async (warehouseId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("warehouse_inventory")
        .select(
          `
          *,
          products:product_id (
            id,
            name,
            sku,
            category,
            dimensions,
            weight,
            client_id
          )
        `
        )
        .eq("warehouse_id", warehouseId);

      if (error) throw error;

      // Transform the data to match our Product interface
      const transformedProducts = (data || []).map((item) => ({
        product_id: item.product_id,
        name: item.products.name,
        quantity: item.quantity,
        dimensions: item.products.dimensions,
        weight: item.products.weight,
        sku: item.products.sku,
        category: item.products.category,
      }));

      setWarehouseProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching warehouse products:", error);
      toast.error("Failed to fetch warehouse products");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      vehicle_type: "",
      vehicle_registration: "",
      max_capacity: "",
      assigned_region: "",
      default_zone: "",
    });
  };

  const handleDialogChange = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError(""); // Clear any previous email error

    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("Please sign in to add couriers");
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(currentUser);

      // Validate password
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        setIsLoading(false);
        return;
      }

      // Check if courier email matches client email
      if (formData.email.toLowerCase() === userData.email.toLowerCase()) {
        toast.error("Courier's email cannot be the same as your email");
        setIsLoading(false);
        return;
      }

      // Check if courier email already exists
      const { data: existingCourier, error: checkError } = await supabaseClient
        .from("couriers")
        .select("id")
        .eq("email", formData.email)
        .single();

      if (existingCourier) {
        setEmailError("This email is already in use.");
        setIsLoading(false);
        return;
      }

      const { data: courierData, error: courierError } = await supabaseClient
        .from("couriers")
        .insert({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          vehicle_type: formData.vehicle_type,
          vehicle_registration: formData.vehicle_registration,
          max_capacity: parseInt(formData.max_capacity),
          assigned_region: formData.assigned_region,
          default_zone: formData.default_zone,
          status: "active",
          deliveries_completed: 0,
          client_id: userData.id,
        })
        .select()
        .single();

      if (courierError) {
        if (courierError.message.includes("password")) {
          toast.error(
            "Failed to set courier password. Please ensure the password column exists in the database."
          );
          console.error("Database error:", courierError);
          return;
        }
        throw courierError;
      }

      toast.success("Courier added successfully");
      toast.success(
        `Courier can sign in with email: ${formData.email} and password: ${formData.password}`
      );
      setShowAddDialog(false);
      resetForm();
      fetchCouriers(userData.id);

      // Email: notify new courier
      sendEmail(
        formData.email,
        "Welcome – OmniWTMS Courier account",
        `<p>Hello ${formData.name},</p>
        <p>Your courier account has been created.</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Password:</strong> ${formData.password}</p>
        <p>Sign in at the courier portal to view and complete deliveries.</p>`
      );
    } catch (error: any) {
      console.error("Error adding courier:", error);
      toast.error(error.message || "Failed to add courier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!selectedRoute && !assignWithoutRoute) {
        toast.error(
          "Please optimize and select a route, or use 'Assign with address only' to skip route."
        );
        setIsLoading(false);
        return;
      }

      // Get the selected courier and warehouse
      const selectedCourierData = couriers.find(
        (c) => c.id === selectedCourier
      );
      const selectedWarehouse = warehouses.find(
        (w) => w.id === deliveryFormData.source_warehouse_id
      );

      if (!selectedCourierData || !selectedWarehouse) {
        throw new Error("Selected courier or warehouse not found");
      }

      // Generate a unique package ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const packageId = `PKG-${timestamp}-${random}`;

      // Calculate total weight and format dimensions
      const productsWithDetails = selectedProducts.map((product) => ({
        name: product.name,
        quantity: product.quantity,
        dimensions: product.dimensions || "Not specified",
        weight: product.weight || 0,
      }));

      const totalWeight = productsWithDetails.reduce(
        (sum, product) => sum + (product.weight || 0) * product.quantity,
        0
      );

      // Generate shipping label for all deliveries
      const shippingLabel: ShippingLabel = {
        packageId,
        products: productsWithDetails,
        pickup: {
          location: selectedWarehouse.location,
          time: deliveryFormData.pickup_time,
        },
        delivery: {
          address:
            deliveryType === "warehouse"
              ? warehouses.find(
                  (w) => w.id === deliveryFormData.destination_warehouse_id
                )?.location || ""
              : [deliveryFormData.client_address, deliveryFormData.client_postal_code].filter(Boolean).join(", "),
          notes: deliveryFormData.notes || "No special instructions",
        },
        courier: {
          name: selectedCourierData.name,
          vehicle: selectedCourierData.vehicle_type,
          phone: selectedCourierData.phone,
        },
        priority: deliveryFormData.priority,
        totalWeight,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const optimizedRoute =
        selectedRoute && !assignWithoutRoute
          ? {
              name: selectedRoute.name,
              description: selectedRoute.description,
              distance: selectedRoute.distance,
              duration: selectedRoute.duration,
              fuelConsumption: selectedRoute.fuelConsumption,
              totalFuelCost: selectedRoute.totalFuelCost,
              stops: selectedRoute.stops,
              advantages: selectedRoute.advantages,
              roadType: selectedRoute.roadType,
            }
          : null;

      const deliveryPayload = {
        courier_id: selectedCourier,
        package_id: packageId,
        priority: deliveryFormData.priority,
        status: "pending",
        client_id: selectedCourierData.client_id,
        notes: deliveryFormData.notes || "",
        delivery_type: deliveryType,
        products: productsWithDetails,
        shipping_label: shippingLabel,
        ...(optimizedRoute && { optimized_route: optimizedRoute }),
        created_at: new Date().toISOString(),
        ...(deliveryType === "client" &&
          selectedDeliveryCustomerId && {
            customer_id: selectedDeliveryCustomerId,
          }),
      };

      // Create the delivery record
      const { data: deliveryData, error: deliveryError } = await supabaseClient
        .from("deliveries")
        .insert([deliveryPayload])
        .select(
          `
          *,
          courier:courier_id (
            name,
            vehicle_type,
            phone
          )
        `
        )
        .single();

      if (deliveryError) {
        console.error("Delivery Creation Error:", deliveryError);
        throw new Error(`Failed to create delivery: ${deliveryError.message}`);
      }

      // Insert optimized route waypoint stops only when we have a route
      if (
        optimizedRoute &&
        optimizedRoute.stops &&
        optimizedRoute.stops.length > 0
      ) {
        const stopsToInsert = optimizedRoute.stops.map((stop, idx) => ({
          delivery_id: deliveryData.id,
          address: stop.name,
          stop_type:
            idx === 0
              ? "pickup"
              : idx === optimizedRoute.stops.length - 1
              ? "delivery"
              : "intermediate",
          sequence: idx,
          status: "pending",
          latitude: stop.latitude || null,
          longitude: stop.longitude || null,
          estimated_time: null,
        }));
        const { error: stopsInsertError } = await supabaseClient
          .from("delivery_stops")
          .insert(stopsToInsert);
        if (stopsInsertError) {
          console.error(
            "Error inserting optimized route stops:",
            stopsInsertError
          );
        }
      }

      // Always insert pickup + delivery stops (required for courier to see address)
      const stops = [
        {
          delivery_id: deliveryData.id,
          warehouse_id: deliveryFormData.source_warehouse_id,
          address: selectedWarehouse.location,
          stop_type: "pickup" as const,
          sequence: 1,
          status: "pending" as const,
          estimated_time: deliveryFormData.pickup_time,
        },
        {
          delivery_id: deliveryData.id,
          warehouse_id:
            deliveryType === "warehouse"
              ? deliveryFormData.destination_warehouse_id
              : null,
          address:
            deliveryType === "warehouse"
              ? warehouses.find(
                  (w) => w.id === deliveryFormData.destination_warehouse_id
                )?.location
              : [deliveryFormData.client_address, deliveryFormData.client_postal_code].filter(Boolean).join(", "),
          stop_type: "delivery" as const,
          sequence: 2,
          status: "pending" as const,
          estimated_time: deliveryFormData.pickup_time,
        },
      ];

      // Create the delivery stops
      const { data: stopsData, error: stopsError } = await supabaseClient
        .from("delivery_stops")
        .insert(stops)
        .select();

      if (stopsError) {
        console.error("Delivery Stops Creation Error:", stopsError);
        await supabaseClient
          .from("deliveries")
          .delete()
          .eq("id", deliveryData.id);
        throw new Error(
          `Failed to create delivery stops: ${stopsError.message}`
        );
      }

      // Update the local state with the new delivery
      const newDelivery = {
        ...deliveryData,
        delivery_stops: stops,
        shipping_label: shippingLabel,
        optimized_route: optimizedRoute,
      };

      setDeliveries((prevDeliveries) => [newDelivery, ...prevDeliveries]);
      setLastDeliveryDetails(deliveryData);
      setShowSuccessDialog(true);
      setShowAssignDeliveryDialog(false);
      resetDeliveryForm();

      // Email: notify courier and customer (if delivery to customer)
      const deliveryAddress =
        deliveryType === "warehouse"
          ? warehouses.find((w) => w.id === deliveryFormData.destination_warehouse_id)?.location
          : [deliveryFormData.client_address, deliveryFormData.client_postal_code].filter(Boolean).join(", ");
      const courierEmail = selectedCourierData.email;
      if (courierEmail) {
        sendEmail(
          courierEmail,
          `Delivery assigned: ${packageId}`,
          `<p>You have been assigned a new delivery.</p>
          <p><strong>Package ID:</strong> ${packageId}</p>
          <p><strong>Pickup:</strong> ${selectedWarehouse.location}</p>
          <p><strong>Delivery to:</strong> ${deliveryAddress}</p>
          <p><strong>Pickup time:</strong> ${deliveryFormData.pickup_time}</p>
          <p><strong>Priority:</strong> ${deliveryFormData.priority}</p>
          <p>Log in to your courier dashboard to view details and start delivery.</p>`
        );
      }
      // Customer email only when org updates status (Customer Activity), not on assignment

      // Notify admin of new assignment
      try {
        await fetch("/api/notify-delivery-assigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delivery_id: deliveryData.id,
            package_id: packageId,
            pickup: selectedWarehouse?.location,
            delivery_to: deliveryAddress,
            courier_name: selectedCourierData?.name,
          }),
        });
      } catch (_) {}

      // Update courier's delivery count
      const { error: courierUpdateError } = await supabaseClient
        .from("couriers")
        .update({
          deliveries_completed: selectedCourierData.deliveries_completed + 1,
        })
        .eq("id", selectedCourier);

      if (courierUpdateError) {
        console.error(
          "Error updating courier delivery count:",
          courierUpdateError
        );
      }

      // Update local state
      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier.id === selectedCourier
            ? {
                ...courier,
                deliveries_completed: courier.deliveries_completed + 1,
              }
            : courier
        )
      );

      toast.success("Delivery assigned successfully");
    } catch (error: any) {
      console.error("Error in handleAssignDelivery:", error);
      toast.error(error.message || "Failed to assign delivery");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDeliveryForm = () => {
    setDeliveryFormData({
      package_id: "",
      priority: "medium",
      source_warehouse_id: "",
      destination_warehouse_id: "",
      client_address: "",
      client_postal_code: "",
      pickup_time: "",
      notes: "",
      products: [{ name: "", quantity: 0 }],
    });
    setSelectedCourier("");
    setDeliveryType("warehouse");
    setDeliveryStep(1);
    setSelectedDeliveryCustomerId("");
    setSelectedProducts([]);
    setSelectedRoute(null);
    setRouteOptions([]);
    setAssignWithoutRoute(false);
  };

  const totalDeliverySteps = deliveryType === "client" ? 6 : 5;

  const handleSourceWarehouseChange = (warehouseId: string) => {
    setDeliveryFormData((prev) => ({
      ...prev,
      source_warehouse_id: warehouseId,
    }));
    fetchWarehouseProducts(warehouseId);
    setSelectedProducts([]);
  };

  const geocodeWithNominatim = async (
    query: string,
    ...fallbackQueries: string[]
  ): Promise<{ lat: string; lon: string; display_name: string } | null> => {
    const opts: RequestInit = {
      headers: { "User-Agent": "OmniWTMS-Delivery/1.0 (Route Planning)" },
    };
    const tryQuery = async (q: string) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=1`,
        opts
      );
      const data = await res.json();
      return data && data[0] ? data[0] : null;
    };
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    let result = await tryQuery(query);
    if (result) return result;
    for (const fallback of fallbackQueries) {
      if (!fallback) continue;
      await delay(1100); // Nominatim allows 1 request per second
      result = await tryQuery(fallback);
      if (result) return result;
    }
    return null;
  };

  const calculateRouteOptions = async (pickup: string, delivery: string) => {
    setIsCalculatingRoute(true);
    setMapError(null);

    try {
      // Geocode pickup
      const pickupData = await geocodeWithNominatim(pickup);
      if (!pickupData) {
        throw new Error(
          "Could not find the pickup location. Check the source warehouse address."
        );
      }

      // Geocode delivery: try full address, then country-agnostic fallbacks
      const countryMatch = delivery.match(/\b(United Kingdom|UK|Pakistan|India|USA|United States|Bangladesh|Germany|France|Canada|Australia|UAE|Saudi Arabia|Iran|Turkey|Egypt|Nigeria|South Africa|China|Japan)\b/i);
      const country = countryMatch ? countryMatch[1] : "";
      // Postcode: numeric (e.g. 75210) or UK-style (e.g. ST1 4DR, SW1A 1AA)
      const postcodeNum = delivery.match(/\b(\d{4,6})\b/);
      const postcodeUK = delivery.match(/\b([A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s*\d[A-Za-z]{2})\b/i);
      const postcode = postcodeUK ? postcodeUK[1].replace(/\s+/g, " ").trim() : (postcodeNum ? postcodeNum[1] : null);
      const fallbacks: string[] = [];
      if (postcode && country) fallbacks.push(`${postcode}, ${country}`);
      else if (postcode) fallbacks.push(postcode);
      // City + country: take the last comma-separated part before country as city, or a known pattern
      const parts = delivery.split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2 && country) {
        const cityPart = parts.find((p, i) => i < parts.length - 1 && /^[A-Za-z\s\-']+$/.test(p) && p.length > 2);
        if (cityPart) fallbacks.push(`${cityPart}, ${country}`);
      }
      // Well-known city+country fallbacks when address mentions them
      if (/stoke-on-trent|stoke on trent/i.test(delivery) && /uk|united kingdom/i.test(delivery))
        fallbacks.push("Stoke-on-Trent, United Kingdom");
      if (/karachi/i.test(delivery)) {
        if (/malir/i.test(delivery)) fallbacks.push("Malir, Karachi, Pakistan");
        fallbacks.push("Karachi, Pakistan");
      }
      if (/lahore/i.test(delivery)) fallbacks.push("Lahore, Pakistan");
      if (/islamabad/i.test(delivery)) fallbacks.push("Islamabad, Pakistan");
      if (/rawalpindi/i.test(delivery)) fallbacks.push("Rawalpindi, Pakistan");
      if (/london/i.test(delivery) && /uk|united kingdom/i.test(delivery)) fallbacks.push("London, United Kingdom");
      if (/manchester/i.test(delivery) && /uk|united kingdom/i.test(delivery)) fallbacks.push("Manchester, United Kingdom");
      if (/birmingham/i.test(delivery) && /uk|united kingdom/i.test(delivery)) fallbacks.push("Birmingham, United Kingdom");
      const deliveryData = await geocodeWithNominatim(delivery, ...fallbacks);
      if (!deliveryData) {
        throw new Error(
          "Could not find the delivery address. Try adding city and country (e.g. 'London, United Kingdom') or use a well-known landmark."
        );
      }

      // Get coordinates
      const pickupCoords = `${pickupData.lon},${pickupData.lat}`;
      const deliveryCoords = `${deliveryData.lon},${deliveryData.lat}`;

      // Get routes using OSRM
      const mainRouteResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords};${deliveryCoords}?overview=full&alternatives=true&steps=true`
      );
      const mainRouteData = await mainRouteResponse.json();

      if (mainRouteData.code !== "Ok" || !mainRouteData.routes.length) {
        throw new Error("Could not calculate route");
      }

      // Transform OSRM results into our RouteOption format
      const options: RouteOption[] = mainRouteData.routes
        .slice(0, 2)
        .map(
          (
            route: { distance: number; duration: number; legs: any[] },
            index: number
          ) => {
            const distanceInKm = route.distance / 1000;
            const durationInMinutes = route.duration / 60;
            const fuelConsumption = (distanceInKm * 10) / 100; // Assuming 10L/100km
            const fuelCost = fuelConsumption * 250; // PKR 250 per liter

            // Filter and process steps to get meaningful stops
            const allSteps = route.legs[0].steps;
            const significantSteps = allSteps.filter((step: any, i: number) => {
              // Keep steps that are major turns or have significant distance
              const isSignificantDistance = step.distance > 5000; // More than 5km
              const isImportantManeuver =
                step.maneuver?.type === "turn" ||
                step.maneuver?.type === "merge" ||
                step.maneuver?.type === "motorway";
              const isEveryFifthStep = i % 5 === 0; // Take every 5th step for long routes
              return (
                isSignificantDistance || isImportantManeuver || isEveryFifthStep
              );
            });

            // Limit to maximum 5 intermediate stops
            const limitedSteps = significantSteps.slice(0, 5);

            // Calculate cumulative distances and durations
            let cumulativeDistance = 0;
            let cumulativeDuration = 0;

            const stops = [
              {
                name: pickupData.display_name.split(",")[0],
                distance: 0,
                duration: 0,
                traffic: "Low",
                weather: "Clear",
              },
              ...limitedSteps.map((step: any) => {
                cumulativeDistance += step.distance / 1000;
                cumulativeDuration += step.duration / 60;

                // Get a meaningful name for the stop
                const locationName =
                  step.name ||
                  (step.maneuver?.location
                    ? `Major Junction at ${step.maneuver.location[1].toFixed(
                        3
                      )}°N, ${step.maneuver.location[0].toFixed(3)}°E`
                    : "Major Waypoint");

                return {
                  name: locationName,
                  distance: cumulativeDistance,
                  duration: cumulativeDuration,
                  traffic: Math.random() > 0.7 ? "Medium" : "Low", // Randomize traffic for variety
                  weather: "Clear",
                };
              }),
              {
                name: deliveryData.display_name.split(",")[0],
                distance: distanceInKm,
                duration: durationInMinutes,
                traffic: "Low",
                weather: "Clear",
              },
            ];

            return {
              id: index + 1,
              name: index === 0 ? "Primary Route" : "Alternative Route",
              description:
                index === 0
                  ? "Recommended route based on distance and time"
                  : "Alternative route with different path",
              distance: distanceInKm,
              duration: durationInMinutes,
              fuelConsumption,
              stops,
              totalFuelCost: fuelCost,
              roadType: index === 0 ? "Primary roads" : "Secondary roads",
              advantages:
                index === 0
                  ? ["Shortest distance", "Optimal path", "Main roads"]
                  : ["Alternative path", "Less traffic", "Backup option"],
              disadvantages:
                index === 0
                  ? ["May have tolls", "Peak hour traffic", "Popular route"]
                  : ["Longer distance", "More turns", "Secondary roads"],
            };
          }
        );

      setRouteOptions(options);
    } catch (error) {
      console.error("Error calculating routes:", error);
      const message =
        error instanceof Error ? error.message : "Failed to calculate routes";
      setMapError(message);
      toast.error(message);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleOptimizeRoute = async (delivery: Delivery) => {
    const pickup =
      delivery.delivery_stops?.find((stop) => stop.stop_type === "pickup")
        ?.address || "";
    const deliveryAddress =
      delivery.delivery_stops?.find((stop) => stop.stop_type === "delivery")
        ?.address || "";

    if (!pickup || !deliveryAddress) {
      toast.error("Missing pickup or delivery address");
      return;
    }

    setSelectedDelivery(delivery);
    setShowRouteDialog(true);
    calculateRouteOptions(pickup, deliveryAddress);
  };

  const handleRouteSelect = (route: RouteOption) => {
    setSelectedRoute(route);
    setAssignWithoutRoute(false);
    toast.success(`Selected route: ${route.name}`);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!selectedCourier || !deliveryType) {
          toast.error("Please select a courier and delivery type");
          return false;
        }
        return true;

      case 2:
        if (!deliveryFormData.source_warehouse_id) {
          toast.error("Please select a source warehouse");
          return false;
        }
        if (
          deliveryType === "warehouse" &&
          !deliveryFormData.destination_warehouse_id
        ) {
          toast.error("Please select a destination warehouse");
          return false;
        }
        if (deliveryType === "client" && !selectedDeliveryCustomerId) {
          toast.error("Please select a customer");
          return false;
        }
        return true;

      case 3:
        if (selectedProducts.length === 0) {
          toast.error("Please select at least one product");
          return false;
        }
        return true;

      case 4:
        if (deliveryType === "client") {
          if (!deliveryFormData.client_address?.trim()) {
            toast.error("Please enter the full customer delivery address");
            return false;
          }
          if (!deliveryFormData.client_postal_code?.trim()) {
            toast.error("Please enter the full post code. You cannot proceed without it.");
            return false;
          }
          return true;
        }
        if (!selectedRoute && !assignWithoutRoute) {
          toast.error("Please calculate and select a route, or use 'Assign with address only' below");
          return false;
        }
        return true;

      case 5:
        if (deliveryType === "client") {
          if (!selectedRoute && !assignWithoutRoute) {
            toast.error("Please calculate and select a route, or use 'Assign with address only' below");
            return false;
          }
          return true;
        }
        if (!deliveryFormData.pickup_time) {
          toast.error("Please select a pickup time");
          return false;
        }
        if (!deliveryFormData.priority) {
          toast.error("Please select a priority level");
          return false;
        }
        return true;

      case 6:
        if (!deliveryFormData.pickup_time) {
          toast.error("Please select a pickup time");
          return false;
        }
        if (!deliveryFormData.priority) {
          toast.error("Please select a priority level");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handlePodUpload = async (deliveryId: string, file: File) => {
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${deliveryId}-pod.${fileExt}`;
      const { data: uploadData, error: uploadError } =
        await supabaseClient.storage.from("pod_files").upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("pod_files").getPublicUrl(fileName);

      // Update delivery record with POD file URL
      const { error: updateError } = await supabaseClient
        .from("deliveries")
        .update({
          pod_file: publicUrl,
          status: "completed",
        })
        .eq("id", deliveryId);

      if (updateError) throw updateError;

      // Update local state
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === deliveryId
            ? { ...delivery, pod_file: publicUrl, status: "completed" }
            : delivery
        )
      );

      toast.success("POD uploaded and delivery marked as completed");

      // Notify customer + org + admin, write audit + timeline
      try {
        await fetch("/api/notify-delivery-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delivery_id: deliveryId,
            new_status: "completed",
            triggered_by: "organization",
            pod_file: publicUrl,
          }),
        });
      } catch (_) {}
    } catch (error) {
      console.error("Error uploading POD:", error);
      toast.error("Failed to upload POD");
    }
  };

  const handleViewLabel = (delivery: Delivery) => {
    if (delivery.shipping_label) {
      setSelectedLabel(delivery.shipping_label);
      setShowLabelDialog(true);
    }
  };

  const handleViewRoute = (delivery: Delivery) => {
    if (delivery.optimized_route) {
      setSelectedRouteDetails(delivery.optimized_route);
      setShowRouteDetailsDialog(true);
    }
  };

  const handleEditCourier = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      email: courier.email,
      phone: courier.phone,
      vehicle_type: courier.vehicle_type,
      vehicle_registration: courier.vehicle_registration,
      max_capacity: courier.max_capacity.toString(),
      assigned_region: courier.assigned_region,
      default_zone: courier.default_zone,
      password: "", // Don't pre-fill password for security
    });
    setShowEditDialog(true);
  };

  const handleDeleteCourier = async (courierId: string) => {
    console.log("Starting courier deletion for ID:", courierId);

    try {
      setIsLoading(true);
      console.log("Checking for associated deliveries...");

      // First check if the courier has any associated deliveries
      const { data: deliveries, error: deliveriesError } = await supabaseClient
        .from("deliveries")
        .select("id, status")
        .eq("courier_id", courierId);

      console.log("Deliveries check result:", { deliveries, deliveriesError });

      if (deliveriesError) {
        console.error("Error checking deliveries:", deliveriesError);
        throw deliveriesError;
      }

      // Count active deliveries
      const activeDeliveries =
        deliveries?.filter(
          (d) => d.status === "pending" || d.status === "in_progress"
        ) || [];
      console.log("Active deliveries:", activeDeliveries);

      if (activeDeliveries.length > 0) {
        // Ask user if they want to force delete
        const forceDelete = confirm(
          `This courier has ${activeDeliveries.length} active delivery${
            activeDeliveries.length > 1 ? "ies" : ""
          }. ` +
            "Do you want to force delete the courier anyway? This will also delete all associated deliveries."
        );

        if (!forceDelete) {
          console.log("Deletion cancelled by user");
          return;
        }

        // If user confirms force delete, first delete the associated deliveries
        console.log("Deleting associated deliveries...");
        const { error: deliveriesDeleteError } = await supabaseClient
          .from("deliveries")
          .delete()
          .eq("courier_id", courierId);

        if (deliveriesDeleteError) {
          console.error(
            "Error deleting associated deliveries:",
            deliveriesDeleteError
          );
          throw deliveriesDeleteError;
        }
      }

      console.log("Proceeding with courier deletion...");
      // Delete the courier
      const { error } = await supabaseClient
        .from("couriers")
        .delete()
        .eq("id", courierId);

      console.log("Delete operation result:", { error });

      if (error) {
        console.error("Error during deletion:", error);
        throw error;
      }

      // Update local state
      setCouriers((prevCouriers) =>
        prevCouriers.filter((c) => c.id !== courierId)
      );
      console.log("Courier successfully deleted and state updated");
      toast.success("Courier deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteCourier:", error);
      toast.error("Failed to delete courier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourier) return;

    setIsLoading(true);

    try {
      const updateData: Partial<Courier> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle_type: formData.vehicle_type,
        vehicle_registration: formData.vehicle_registration,
        max_capacity: parseInt(formData.max_capacity),
        assigned_region: formData.assigned_region,
        default_zone: formData.default_zone,
      };

      // Only update password if a new one is provided
      if (formData.password) {
        // @ts-expect-error kjn kj
        updateData.password = formData.password;
      }

      const { error } = await supabaseClient
        .from("couriers")
        .update(updateData)
        .eq("id", editingCourier.id);

      if (error) throw error;

      // Update local state
      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier.id === editingCourier.id
            ? { ...courier, ...updateData }
            : courier
        )
      );

      toast.success("Courier updated successfully");
      setShowEditDialog(false);
      setEditingCourier(null);
      resetForm();
    } catch (error) {
      console.error("Error updating courier:", error);
      toast.error("Failed to update courier");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Courier Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Courier
          </Button>
          <Button
            onClick={() => setShowAssignDeliveryDialog(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
          >
            <Package className="h-4 w-4 mr-2" />
            Assign Delivery
          </Button>
        </div>
      </div>

      {/* Couriers Table */}
      <div className="border rounded-lg overflow-x-auto">
        <div className="min-w-[800px]">
          {" "}
          {/* Minimum width to prevent squishing */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Phone</TableHead>
                <TableHead className="whitespace-nowrap">Vehicle</TableHead>
                <TableHead className="whitespace-nowrap">Region</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Deliveries</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTableLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                      <p>Loading couriers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : couriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-gray-400" />
                      <p>
                        No couriers found. Add your first courier using the
                        button above.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                couriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell className="whitespace-nowrap">
                      {courier.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {courier.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {courier.phone}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{courier.vehicle_type}</span>
                        <span className="text-sm text-gray-500">
                          {courier.vehicle_registration}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {courier.assigned_region}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={
                          courier.status === "active"
                            ? "success"
                            : courier.status === "delayed"
                            ? "warning"
                            : "secondary"
                        }
                        className={
                          courier.status === "active"
                            ? "bg-green-100 text-green-800 border-green-200 font-medium"
                            : courier.status === "delayed"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200 font-medium"
                            : "bg-gray-100 text-gray-800 border-gray-200 font-medium"
                        }
                      >
                        {courier.status.charAt(0).toUpperCase() +
                          courier.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {courier.deliveries_completed}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
                          onClick={() => handleEditCourier(courier)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 border-red-200"
                          onClick={() => handleDeleteCourier(courier.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Assigned Deliveries Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assigned Deliveries</h2>
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-[1000px]">
            {" "}
            {/* Minimum width to prevent squishing */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    Package ID
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Courier</TableHead>
                  <TableHead className="whitespace-nowrap">Priority</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Pickup</TableHead>
                  <TableHead className="whitespace-nowrap">Delivery</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Shipping Label
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Route Details
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Created At
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDeliveriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        <p>Loading deliveries...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-gray-400" />
                        <p>
                          No deliveries found. Assign your first delivery using
                          the button above.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="whitespace-nowrap">
                        {delivery.package_id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{delivery.courier?.name}</span>
                          <span className="text-sm text-gray-500">
                            {delivery.courier?.vehicle_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={
                            delivery.priority === "high"
                              ? "destructive"
                              : delivery.priority === "medium"
                              ? "warning"
                              : "default"
                          }
                          className={
                            delivery.priority === "high"
                              ? "bg-red-100 text-red-800 border-red-200 font-medium"
                              : delivery.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200 font-medium"
                              : "bg-gray-100 text-gray-800 border-gray-200 font-medium"
                          }
                        >
                          {delivery.priority.charAt(0).toUpperCase() +
                            delivery.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={
                            delivery.status === "completed"
                              ? "success"
                              : delivery.status === "in_progress"
                              ? "warning"
                              : delivery.status === "failed"
                              ? "destructive"
                              : "default"
                          }
                          className={
                            delivery.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-200 font-medium"
                              : delivery.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200 font-medium"
                              : delivery.status === "failed"
                              ? "bg-red-100 text-red-800 border-red-200 font-medium"
                              : "bg-gray-100 text-gray-800 border-gray-200 font-medium"
                          }
                        >
                          {delivery.status
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="max-w-[200px] truncate">
                          {
                            delivery.delivery_stops?.find(
                              (stop) => stop.stop_type === "pickup"
                            )?.address
                          }
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="max-w-[200px] truncate">
                          {
                            delivery.delivery_stops?.find(
                              (stop) => stop.stop_type === "delivery"
                            )?.address
                          }
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {delivery.shipping_label && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
                            onClick={() => handleViewLabel(delivery)}
                          >
                            View Label
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {delivery.optimized_route && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 font-medium"
                            onClick={() => handleViewRoute(delivery)}
                          >
                            View Route
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(delivery.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {delivery.status !== "completed" && (
                          <div className="flex flex-wrap gap-2">
                            {!delivery.optimized_route && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOptimizeRoute(delivery)}
                                className="h-8 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
                              >
                                <Map className="h-4 w-4 mr-2" />
                                Optimize
                              </Button>
                            )}
                            {delivery.status === "in_progress" &&
                              !delivery.pod_file && (
                                <Label
                                  htmlFor={`pod-upload-${delivery.id}`}
                                  className="cursor-pointer"
                                >
                                  <Input
                                    id={`pod-upload-${delivery.id}`}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePodUpload(delivery.id, file);
                                      }
                                    }}
                                  />
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-200 cursor-pointer font-medium"
                                  >
                                    Upload POD
                                  </Badge>
                                </Label>
                              )}
                            {!delivery.all_stops_completed && (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-200 font-medium"
                              >
                                Complete Stops
                              </Badge>
                            )}
                          </div>
                        )}
                        {delivery.status === "completed" &&
                          delivery.pod_file && (
                            <div className="flex items-center gap-2">
                              <Badge variant="success">Completed</Badge>
                              <a
                                href={delivery.pod_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View POD
                              </a>
                            </div>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Courier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add New Courier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }));
                      setEmailError(""); // Clear error when user types
                    }}
                    required
                    autoComplete="off"
                    className={
                      emailError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Vehicle Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Input
                    id="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle_type: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_registration">Registration</Label>
                  <Input
                    id="vehicle_registration"
                    value={formData.vehicle_registration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle_registration: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Max Capacity (packages)</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_capacity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Zone Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Zone Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_region">Assigned Region</Label>
                  <Input
                    id="assigned_region"
                    value={formData.assigned_region}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_region: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_zone">Default Zone</Label>
                  <Input
                    id="default_zone"
                    value={formData.default_zone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        default_zone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
              >
                {isLoading ? "Adding..." : "Add Courier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog
        open={showAssignDeliveryDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetDeliveryForm();
            setSelectedRoute(null);
          }
          setShowAssignDeliveryDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Assign Delivery - Step {deliveryStep} of {totalDeliverySteps}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAssignDelivery} className="space-y-4">
            {/* Step 1: Delivery Type and Courier */}
            {deliveryStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Type</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={deliveryType}
                    onChange={(e) =>
                      setDeliveryType(e.target.value as "warehouse" | "client")
                    }
                    required
                  >
                    <option value="warehouse">Warehouse to Warehouse</option>
                    <option value="client">Warehouse to Customer Address</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Select Courier</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    required
                  >
                    <option value="">Select a courier</option>
                    {couriers.map((courier) => (
                      <option key={courier.id} value={courier.id}>
                        {courier.name} - {courier.vehicle_type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Location Details (Warehouse) or Source + Customer (Customer Address) */}
            {deliveryStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Warehouse</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={deliveryFormData.source_warehouse_id}
                    onChange={(e) =>
                      handleSourceWarehouseChange(e.target.value)
                    }
                    required
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                </div>

                {deliveryType === "warehouse" ? (
                  <div className="space-y-2">
                    <Label>Destination Warehouse</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={deliveryFormData.destination_warehouse_id}
                      onChange={(e) =>
                        setDeliveryFormData((prev) => ({
                          ...prev,
                          destination_warehouse_id: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select destination warehouse</option>
                      {warehouses
                        .filter(
                          (w) => w.id !== deliveryFormData.source_warehouse_id
                        )
                        .map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Customer</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedDeliveryCustomerId}
                      onChange={(e) => setSelectedDeliveryCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.contact_number ? ` - ${customer.contact_number}` : ""}
                          {customer.email ? ` (${customer.email})` : ""}
                        </option>
                      ))}
                    </select>
                    {customers.length === 0 && (
                      <p className="text-sm text-amber-600">
                        No customers added yet. Add customers from Dashboard → Customers first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Products (assign products to customer when client type) */}
            {deliveryStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {deliveryType === "client"
                      ? "Assign products to customer"
                      : "Select Products from Warehouse"}
                  </Label>
                  {warehouseProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No products available in selected warehouse
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {warehouseProducts.map((product) => (
                        <div
                          key={product.product_id}
                          className="flex items-center gap-4 p-2 border rounded-md"
                        >
                          <div className="flex-grow">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              SKU: {product.sku}
                            </p>
                            <p className="text-sm text-gray-500">
                              Available: {product.quantity}
                            </p>
                            {product.category && (
                              <p className="text-sm text-gray-500">
                                Category: {product.category}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-24"
                              placeholder="Qty"
                              min="1"
                              max={product.quantity}
                              value={
                                selectedProducts.find(
                                  (p) => p.product_id === product.product_id
                                )?.quantity || ""
                              }
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value);
                                if (
                                  quantity > 0 &&
                                  quantity <= product.quantity
                                ) {
                                  const newSelectedProducts =
                                    selectedProducts.filter(
                                      (p) => p.product_id !== product.product_id
                                    );
                                  if (quantity > 0) {
                                    newSelectedProducts.push({
                                      product_id: product.product_id,
                                      name: product.name,
                                      quantity: quantity,
                                      dimensions: product.dimensions,
                                      weight: product.weight,
                                    });
                                  }
                                  setSelectedProducts(newSelectedProducts);
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 (client only): Full customer address + Post code */}
            {deliveryStep === 4 && deliveryType === "client" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Customer Delivery Address</Label>
                  <Input
                    value={deliveryFormData.client_address}
                    onChange={(e) =>
                      setDeliveryFormData((prev) => ({
                        ...prev,
                        client_address: e.target.value,
                      }))
                    }
                    placeholder="Enter full address (street, city, area)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post Code (required)</Label>
                  <Input
                    value={deliveryFormData.client_postal_code}
                    onChange={(e) =>
                      setDeliveryFormData((prev) => ({
                        ...prev,
                        client_postal_code: e.target.value.trim(),
                      }))
                    }
                    placeholder="Enter full post code"
                    required
                  />
                  <p className="text-xs text-amber-600">
                    You cannot proceed to the next step without entering the post code.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4 (warehouse) / Step 5 (client): Route Optimization */}
            {deliveryStep === 4 && deliveryType === "warehouse" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Route Optimization</Label>
                  <div className="p-4 border rounded-md max-h-[400px] overflow-y-auto">
                    {isCalculatingRoute ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
                        <p>Calculating optimal routes...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {routeOptions.length === 0 ? (
                          <Button
                            type="button"
                            onClick={() => {
                              const pickup =
                                deliveryFormData.source_warehouse_id
                                  ? warehouses.find(
                                      (w) =>
                                        w.id ===
                                        deliveryFormData.source_warehouse_id
                                    )?.location
                                  : "";
                              const delivery =
                                deliveryType === "warehouse"
                                  ? warehouses.find(
                                      (w) =>
                                        w.id ===
                                        deliveryFormData.destination_warehouse_id
                                    )?.location
                                  : deliveryFormData.client_address;

                              if (!pickup || !delivery) {
                                toast.error(
                                  "Missing pickup or delivery location"
                                );
                                return;
                              }

                              calculateRouteOptions(pickup, delivery);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                          >
                            Calculate Routes
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            {routeOptions.map((route, index) => (
                              <div
                                key={index}
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  selectedRoute?.id === route.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "hover:border-gray-400"
                                }`}
                                onClick={() => handleRouteSelect(route)}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <p className="font-medium">{route.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {route.description}
                                    </p>
                                  </div>
                                  {route.id === 1 && (
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Recommended
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-xs mb-2 bg-gray-50 p-2 rounded">
                                  <div>
                                    <p className="text-gray-500">Distance</p>
                                    <p className="font-medium">
                                      {route.distance.toFixed(1)} km
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Duration</p>
                                    <p className="font-medium">
                                      {route.duration.toFixed(0)} min
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Fuel</p>
                                    <p className="font-medium">
                                      {route.fuelConsumption.toFixed(1)}L
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Cost</p>
                                    <p className="font-medium">
                                      ₨{route.totalFuelCost.toFixed(0)}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Map className="h-3 w-3" />
                                    <p className="font-medium">Stops:</p>
                                  </div>
                                  <div className="space-y-1 ml-4">
                                    {route.stops.map(
                                      (stop: any, currentIndex: number) => (
                                        <div
                                          key={currentIndex}
                                          className="flex items-start gap-3 p-2 border rounded-lg"
                                        >
                                          <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                                          ${
                                            currentIndex === 0
                                              ? "bg-blue-100 text-blue-600"
                                              : currentIndex ===
                                                route.stops.length - 1
                                              ? "bg-green-100 text-green-600"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                          >
                                            {currentIndex + 1}
                                          </div>
                                          <div className="flex-1 truncate">
                                            {stop.name}
                                            {currentIndex === 0 && (
                                              <span className="text-blue-600 ml-1">
                                                (Start)
                                              </span>
                                            )}
                                            {currentIndex ===
                                              route.stops.length - 1 && (
                                              <span className="text-green-600 ml-1">
                                                (End)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {route.advantages.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex gap-1 flex-wrap">
                                      {route.advantages.map((advantage, i) => (
                                        <Badge
                                          key={i}
                                          variant="outline"
                                          className="bg-green-50 text-xs py-0"
                                        >
                                          {advantage}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setRouteOptions([]);
                                setSelectedRoute(null);
                              }}
                              className="w-full mt-2 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
                            >
                              Recalculate Routes
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t mt-3">
                  <p className="text-sm text-muted-foreground mb-2">No route needed?</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssignWithoutRoute(true);
                      setSelectedRoute(null);
                      toast.success("Assign with address only. Click Next to continue.");
                    }}
                    className={assignWithoutRoute ? "border-green-500 bg-green-50 text-green-800" : ""}
                  >
                    {assignWithoutRoute ? "✓ Assign with address only (selected)" : "Assign with address only (no route)"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Courier will see the full address and can mark as completed.</p>
                </div>
              </div>
            )}

            {deliveryStep === 5 && deliveryType === "client" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Route Optimization</Label>
                  <div className="p-4 border rounded-md max-h-[400px] overflow-y-auto">
                    {isCalculatingRoute ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
                        <p>Calculating optimal routes...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {routeOptions.length === 0 ? (
                          <Button
                            type="button"
                            onClick={() => {
                              const pickup =
                                deliveryFormData.source_warehouse_id
                                  ? warehouses.find(
                                      (w) =>
                                        w.id ===
                                        deliveryFormData.source_warehouse_id
                                    )?.location
                                  : "";
                              const delivery = [deliveryFormData.client_address, deliveryFormData.client_postal_code].filter(Boolean).join(", ");

                              if (!pickup || !delivery) {
                                toast.error(
                                  "Missing pickup or delivery location"
                                );
                                return;
                              }

                              calculateRouteOptions(pickup, delivery);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                          >
                            Calculate Routes
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            {routeOptions.map((route, index) => (
                              <div
                                key={index}
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  selectedRoute?.id === route.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "hover:border-gray-400"
                                }`}
                                onClick={() => handleRouteSelect(route)}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <p className="font-medium">{route.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {route.description}
                                    </p>
                                  </div>
                                  {route.id === 1 && (
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Recommended
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-xs mb-2 bg-gray-50 p-2 rounded">
                                  <div>
                                    <p className="text-gray-500">Distance</p>
                                    <p className="font-medium">
                                      {route.distance.toFixed(1)} km
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Duration</p>
                                    <p className="font-medium">
                                      {route.duration.toFixed(0)} min
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Fuel</p>
                                    <p className="font-medium">
                                      {route.fuelConsumption.toFixed(1)}L
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Cost</p>
                                    <p className="font-medium">
                                      ₨{route.totalFuelCost.toFixed(0)}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Map className="h-3 w-3" />
                                    <p className="font-medium">Stops:</p>
                                  </div>
                                  <div className="space-y-1 ml-4">
                                    {route.stops.map(
                                      (stop: any, currentIndex: number) => (
                                        <div
                                          key={currentIndex}
                                          className="flex items-start gap-3 p-2 border rounded-lg"
                                        >
                                          <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                                          ${
                                            currentIndex === 0
                                              ? "bg-blue-100 text-blue-600"
                                              : currentIndex ===
                                                route.stops.length - 1
                                              ? "bg-green-100 text-green-600"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                          >
                                            {currentIndex + 1}
                                          </div>
                                          <div className="flex-1 truncate">
                                            {stop.name}
                                            {currentIndex === 0 && (
                                              <span className="text-blue-600 ml-1">
                                                (Start)
                                              </span>
                                            )}
                                            {currentIndex ===
                                              route.stops.length - 1 && (
                                              <span className="text-green-600 ml-1">
                                                (End)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {route.advantages.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex gap-1 flex-wrap">
                                      {route.advantages.map((advantage, i) => (
                                        <Badge
                                          key={i}
                                          variant="outline"
                                          className="bg-green-50 text-xs py-0"
                                        >
                                          {advantage}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setRouteOptions([]);
                                setSelectedRoute(null);
                              }}
                              className="w-full mt-2 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
                            >
                              Recalculate Routes
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t mt-3">
                  <p className="text-sm text-muted-foreground mb-2">No route needed?</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssignWithoutRoute(true);
                      setSelectedRoute(null);
                      toast.success("Assign with address only. Click Next to continue.");
                    }}
                    className={assignWithoutRoute ? "border-green-500 bg-green-50 text-green-800" : ""}
                  >
                    {assignWithoutRoute ? "✓ Assign with address only (selected)" : "Assign with address only (no route)"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Courier will see the full address and can mark as completed.</p>
                </div>
              </div>
            )}

            {/* Step 5 (warehouse) / Step 6 (client): Delivery Details */}
            {((deliveryStep === 5 && deliveryType === "warehouse") || (deliveryStep === 6 && deliveryType === "client")) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={deliveryFormData.priority}
                    onChange={(e) =>
                      setDeliveryFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as "low" | "medium" | "high",
                      }))
                    }
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Time</Label>
                  <Input
                    type="datetime-local"
                    value={deliveryFormData.pickup_time}
                    onChange={(e) =>
                      setDeliveryFormData((prev) => ({
                        ...prev,
                        pickup_time: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    value={deliveryFormData.notes}
                    onChange={(e) =>
                      setDeliveryFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Add any special instructions"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (deliveryStep === 1) {
                    setShowAssignDeliveryDialog(false);
                    resetDeliveryForm();
                  } else {
                    setDeliveryStep((prev) => prev - 1);
                  }
                }}
                className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
              >
                {deliveryStep === 1 ? "Cancel" : "Back"}
              </Button>

              {deliveryStep < totalDeliverySteps ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep(deliveryStep)) {
                      setDeliveryStep((prev) => prev + 1);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || !validateStep(totalDeliverySteps)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
                >
                  {isLoading ? "Assigning..." : "Assign Delivery"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delivery Assigned Successfully</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Delivery Details</h3>
              <p>Package ID: {lastDeliveryDetails?.package_id}</p>
              <p>Priority: {lastDeliveryDetails?.priority}</p>
              <p>Status: {lastDeliveryDetails?.status}</p>
            </div>
            <div>
              <h3 className="font-medium">Selected Products</h3>
              <ul className="list-disc pl-4">
                {selectedProducts.map((product, index) => (
                  <li key={index}>
                    {product.name} - Quantity: {product.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Route Optimization Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="sticky top-0 bg-white pb-4 z-10">
            <DialogTitle className="text-2xl">Route Optimization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isCalculatingRoute ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
                <p className="text-lg">Calculating optimal routes...</p>
              </div>
            ) : mapError ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-lg mb-4">{mapError}</p>
                <Button
                  onClick={() => {
                    setMapError(null);
                    const pickup =
                      selectedDelivery?.delivery_stops?.find(
                        (stop) => stop.stop_type === "pickup"
                      )?.address || "";
                    const delivery =
                      selectedDelivery?.delivery_stops?.find(
                        (stop) => stop.stop_type === "delivery"
                      )?.address || "";
                    calculateRouteOptions(pickup, delivery);
                  }}
                  size="lg"
                >
                  Retry Calculation
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 p-4 rounded-lg shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Package ID
                      </p>
                      <p className="font-medium">
                        {selectedDelivery?.package_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Priority
                      </p>
                      <Badge
                        variant={
                          selectedDelivery?.priority === "high"
                            ? "destructive"
                            : selectedDelivery?.priority === "medium"
                            ? "warning"
                            : "default"
                        }
                      >
                        {selectedDelivery?.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {routeOptions.map((option: RouteOption) => (
                    <RouteOptionCard
                      key={option.id}
                      option={option}
                      selectedRoute={selectedRoute}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowRouteDialog(false)}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Shipping Label Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
          </DialogHeader>
          {selectedLabel && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      Package ID: {selectedLabel.packageId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created:{" "}
                      {new Date(selectedLabel.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedLabel.status === "pending" ? "warning" : "success"
                    }
                  >
                    {selectedLabel.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Pickup Details</h4>
                    <p>{selectedLabel.pickup.location}</p>
                    <p className="text-sm text-gray-500">
                      Time: {selectedLabel.pickup.time}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Delivery Details</h4>
                    <p>{selectedLabel.delivery.address}</p>
                    {selectedLabel.delivery.notes && (
                      <p className="text-sm text-gray-500">
                        Notes: {selectedLabel.delivery.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Courier Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <p>Name: {selectedLabel.courier.name}</p>
                    <p>Vehicle: {selectedLabel.courier.vehicle}</p>
                    <p>Phone: {selectedLabel.courier.phone}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Products</h4>
                  <div className="border rounded-lg divide-y">
                    {selectedLabel.products.map((product, index) => (
                      <div
                        key={index}
                        className="p-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            Quantity: {product.quantity}
                            {product.dimensions &&
                              ` • Dimensions: ${product.dimensions}`}
                            {product.weight && ` • Weight: ${product.weight}kg`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total Weight</p>
                    <p className="font-semibold">
                      {selectedLabel.totalWeight} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <Badge
                      variant={
                        selectedLabel.priority === "high"
                          ? "destructive"
                          : selectedLabel.priority === "medium"
                          ? "warning"
                          : "default"
                      }
                    >
                      {selectedLabel.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Route Details Dialog */}
      <Dialog
        open={showRouteDetailsDialog}
        onOpenChange={setShowRouteDetailsDialog}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
          </DialogHeader>
          {selectedRouteDetails && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedRouteDetails.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedRouteDetails.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {selectedRouteDetails.roadType}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-semibold">
                      {selectedRouteDetails.distance.toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">
                      {selectedRouteDetails.duration.toFixed(0)} min
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel</p>
                    <p className="font-semibold">
                      {typeof selectedRouteDetails.fuelConsumption === "number"
                        ? selectedRouteDetails.fuelConsumption.toFixed(1) + "L"
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel Cost</p>
                    <p className="font-semibold">
                      ₨{selectedRouteDetails.totalFuelCost.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Route Stops</h4>
                  <div className="space-y-2">
                    {selectedRouteDetails.stops.map(
                      (stop: any, currentIndex: number) => (
                        <div
                          key={currentIndex}
                          className="flex items-start gap-3 p-2 border rounded-lg"
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                          ${
                            currentIndex === 0
                              ? "bg-blue-100 text-blue-600"
                              : currentIndex ===
                                selectedRouteDetails.stops.length - 1
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          >
                            {currentIndex + 1}
                          </div>
                          <div className="flex-1 truncate">
                            {stop.name}
                            {currentIndex === 0 && (
                              <span className="text-blue-600 ml-1">
                                (Start)
                              </span>
                            )}
                            {currentIndex ===
                              selectedRouteDetails.stops.length - 1 && (
                              <span className="text-green-600 ml-1">(End)</span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Route Advantages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedRouteDetails.advantages) &&
                    selectedRouteDetails.advantages.length > 0 ? (
                      selectedRouteDetails.advantages.map(
                        (advantage: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-green-50"
                          >
                            {advantage}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No advantages listed.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Courier Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCourier(null);
            resetForm();
          }
          setShowEditDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Courier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCourier} className="space-y-4">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Vehicle Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicle_type">Vehicle Type</Label>
                  <Input
                    id="edit-vehicle_type"
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle_type: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicle_registration">
                    Registration
                  </Label>
                  <Input
                    id="edit-vehicle_registration"
                    value={formData.vehicle_registration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle_registration: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max_capacity">
                    Max Capacity (packages)
                  </Label>
                  <Input
                    id="edit-max_capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_capacity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Zone Information Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Zone Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assigned_region">Assigned Region</Label>
                  <Input
                    id="edit-assigned_region"
                    value={formData.assigned_region}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_region: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-default_zone">Default Zone</Label>
                  <Input
                    id="edit-default_zone"
                    value={formData.default_zone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        default_zone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingCourier(null);
                  resetForm();
                }}
                className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
              >
                {isLoading ? "Updating..." : "Update Courier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
