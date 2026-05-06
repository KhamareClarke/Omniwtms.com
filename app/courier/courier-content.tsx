// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Package,
  Clock,
  Map as MapIcon,
  ArrowUpFromLine,
  ArrowDownToLine,
  CheckCircle,
  AlertCircle,
  Truck,
  Box,
  Navigation,
  Timer,
  ClipboardList,
  Camera,
  Search,
  RefreshCw,
  X,
  FlipHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React from "react";
import Barcode from "react-barcode";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

// Initialize Supabase client
const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";
const supabase = createClient(supabaseUrl, supabaseKey);

interface DeliveryStop {
  id?: string;
  delivery_id?: string;
  address: string;
  stop_type: "pickup" | "delivery";
  status: "pending" | "completed";
  sequence: number;
  actual_arrival_time?: string;
  estimated_time?: string;
  route_info?: {
    distance: number;
    duration: number;
    traffic: string;
    weather: string;
    distanceFromPrevious?: number;
    durationFromPrevious?: number;
    estimated_time?: string;
  };
  latitude: number;
  longitude: number;
}

interface FailureReason {
  reason: string;
  details: string;
}

interface Product {
  name: string;
  quantity: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weight?: {
    value: number;
    unit: string;
  };
}

interface Delivery {
  id: string;
  package_id: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: string;
  notes?: string;
  delivery_stops?: DeliveryStop[];
  optimized_route?: {
    name: string;
    distance: number;
    duration: number;
    stops: Array<{
      name: string;
      distance: number;
      duration: number;
      traffic: string;
      weather: string;
    }>;
    totalFuelCost?: number;
  };
  products: Product[];
  failure_details?: {
    reason_code: string;
    description: string;
    failed_at: string;
  };
  pod_file?: string;
}

// Define icons for completed and pending
const completedIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x-green.png",
  iconRetinaUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pendingIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Add DeliveryMap component
const DeliveryMap = ({ stops }: { stops: DeliveryStop[] }) => {
  if (!stops || stops.length === 0) return null;

  // Filter out stops with invalid coordinates and validate coordinates
  const validStops = stops.filter(
    (stop: DeliveryStop) =>
      typeof stop.latitude === "number" &&
      typeof stop.longitude === "number" &&
      !isNaN(stop.latitude) &&
      !isNaN(stop.longitude) &&
      stop.latitude >= -90 &&
      stop.latitude <= 90 &&
      stop.longitude >= -180 &&
      stop.longitude <= 180
  );

  if (validStops.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">
          No valid coordinates available for this route
        </p>
      </div>
    );
  }

  // Calculate center position from first valid stop
  const center: [number, number] = [
    validStops[0].latitude,
    validStops[0].longitude,
  ];

  // Create array of positions for the polyline from valid stops
  const positions: [number, number][] = validStops.map((stop) => [
    stop.latitude,
    stop.longitude,
  ]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {validStops.map((stop: DeliveryStop, index: number) => (
          <Marker
            key={stop.id || index}
            position={[stop.latitude, stop.longitude]}
            icon={stop.status === "completed" ? completedIcon : pendingIcon}
          >
            <Popup>
              <div className="font-semibold">Stop {index + 1}</div>
              <div>{stop.address || stop.name}</div>
              <div>
                {stop.status === "completed" ? (
                  <span className="text-green-600">Completed</span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

// Add ShippingLabelDisplay component
const ShippingLabelDisplay = ({ delivery }: { delivery: Delivery }) => {
  const labelRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = async (format: "png" | "pdf") => {
    if (!labelRef.current) return;

    try {
      if (format === "png") {
        const canvas = await html2canvas(labelRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `shipping-label-${delivery.package_id}.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === "pdf") {
        const canvas = await html2canvas(labelRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`shipping-label-${delivery.package_id}.pdf`);
      }
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Failed to generate document");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload("png")}
        >
          Download as PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload("pdf")}
        >
          Download as PDF
        </Button>
      </div>

      <div ref={labelRef} className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">Package Details</h3>
            <p className="text-sm text-gray-500">ID: {delivery.package_id}</p>
          </div>
          <Badge
            variant={
              delivery.priority === "high"
                ? "destructive"
                : delivery.priority === "medium"
                ? "warning"
                : "secondary"
            }
          >
            {delivery.priority.toUpperCase()}
          </Badge>
        </div>

        <div className="mt-4 flex justify-center">
          <Barcode
            value={delivery.package_id}
            width={1.5}
            height={50}
            fontSize={14}
            margin={10}
            background="#ffffff"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-medium">Pickup Location</h4>
            <p className="text-sm">
              {
                delivery.delivery_stops?.find(
                  (stop) => stop.stop_type === "pickup"
                )?.address
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium">Delivery Location</h4>
            <p className="text-sm">
              {
                delivery.delivery_stops?.find(
                  (stop) => stop.stop_type === "delivery"
                )?.address
              }
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium">Products</h4>
          <div className="space-y-2">
            {delivery.products?.map((product, index) => (
              <div key={index} className="border rounded p-2">
                <p className="font-medium">{product.name}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Quantity: {product.quantity}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      Dimensions:{" "}
                      {product.dimensions?.length
                        ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.unit}`
                        : "Not specified"}
                    </p>
                    <p>
                      Weight:{" "}
                      {product.weight?.value
                        ? `${product.weight.value} ${product.weight.unit}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium">Receiver's Signature</h4>
          <div className="mt-2 border-b border-dashed border-gray-400 py-8">
            <p className="text-center text-gray-500 text-sm">Sign here</p>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>Date: _________________</span>
            <span>Time: _________________</span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t mt-4 pt-4">
          <div>
            <p className="text-sm">
              Created: {new Date(delivery.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add utility function for date formatting
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper to check if a string is a valid UUID
const isValidUUID = (id: string | undefined) => {
  return (
    !!id &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      id
    )
  );
};

// Helper to extract lat/lng from stop name if present
function extractLatLngFromName(name: string) {
  const match = name.match(/at ([\d.]+)°N, ([\d.]+)°E/);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    };
  }
  return {};
}

// Utility function for reverse geocoding
async function getAddressFromCoords(lat, lng) {
  const apiKey = "6e23ca9357c04213b74f5dce9f441761";
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].properties.formatted;
    }
    return `Lat: ${lat}, Lng: ${lng}`;
  } catch {
    return `Lat: ${lat}, Lng: ${lng}`;
  }
}

export default function CourierContent() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courierData, setCourierData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    failedDeliveries: 0,
    totalDistance: 0,
    lastDeliveryTime: null,
  });
  const [failureDialogOpen, setFailureDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null
  );
  const [failureReason, setFailureReason] = useState<FailureReason>({
    reason: "",
    details: "",
  });
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanningStatus, setScanningStatus] = useState<
    "idle" | "scanning" | "found"
  >("idle");
  const [cameraMode, setCameraMode] = useState<"environment" | "user">(
    "environment"
  );
  const [isScanningLoading, setIsScanningLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [currentAddresses, setCurrentAddresses] = useState<{
    [deliveryId: string]: string;
  }>({});
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  // Add a new useEffect to save deliveries to localStorage when they change
  useEffect(() => {
    if (deliveries.length > 0) {
      console.log("Saving deliveries to localStorage cache");
      localStorage.setItem("courierDeliveries", JSON.stringify(deliveries));
    }
  }, [deliveries]);

  const checkAuthAndFetchData = async () => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      router.push("/dashboard");
      return;
    }
    const currentCourier = localStorage.getItem("currentCourier");
    if (!currentCourier) {
      toast.error("Please sign in to view your deliveries");
      router.push("/auth/login");
      return;
    }

    try {
      const courierInfo = JSON.parse(currentCourier);
      setCourierData(courierInfo);
      await fetchCourierDeliveries(courierInfo.id);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchCourierDeliveries = async (courierId: string) => {
    try {
      setIsLoading(true);
      console.log("Fetching deliveries for courier:", courierId);

      // Try to load from cache first while we fetch fresh data
      const cachedData = localStorage.getItem("courierDeliveries");
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          console.log(
            "Loaded data from cache:",
            parsedCache.length,
            "deliveries"
          );
          setDeliveries(parsedCache);

          // Update stats from cache
          const cachedStats = {
            totalDeliveries: parsedCache.length,
            completedDeliveries: parsedCache.filter(
              (d: any) => d.status === "completed"
            ).length,
            pendingDeliveries: parsedCache.filter(
              (d: any) => d.status === "pending"
            ).length,
            failedDeliveries: parsedCache.filter(
              (d: any) => d.status === "failed"
            ).length,
            totalDistance: parsedCache.reduce(
              (acc: any, d: any) => acc + (d.optimized_route?.distance || 0),
              0
            ),
            lastDeliveryTime: parsedCache[0]?.created_at || null,
          };
          setStats(cachedStats);
        } catch (error) {
          console.error("Error parsing cached data:", error);
        }
      }

      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          optimized_route,
          delivery_stops (*)
        `
        )
        .eq("courier_id", courierId)
        .order("created_at", { ascending: false });

      if (deliveriesError) {
        console.error("Error fetching deliveries:", deliveriesError);
        throw deliveriesError;
      }

      // Process each delivery
      const deliveriesWithStops = (deliveriesData || []).map((delivery) => {
        const routeInfo = delivery.optimized_route || {};
        console.log("Route info for delivery:", delivery.id, routeInfo);
        // Use the real DB stops from Supabase for actionable UI
        // Only use synthetic stops for route visualization if needed
        return {
          ...delivery,
          // delivery_stops: delivery.delivery_stops (already present from Supabase)
          optimized_route: {
            name: routeInfo.name || "Primary Route",
            distance: Number(routeInfo.distance) || 0,
            duration: Number(routeInfo.duration) || 0,
            stops: routeInfo.stops || [],
            totalFuelCost: routeInfo.totalFuelCost,
          },
        };
      });

      console.log("Processed deliveries with stops:", deliveriesWithStops);

      // If there's cached data, merge it with the fresh data to preserve local state updates
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);

          // For each delivery in the fresh data, prefer status from cache if it exists
          const mergedDeliveries = deliveriesWithStops.map((freshDelivery) => {
            const cachedDelivery = parsedCache.find(
              (d: any) => d.id === freshDelivery.id
            );
            if (cachedDelivery) {
              // If the cached status is 'completed' or 'failed', use that status
              if (
                cachedDelivery.status === "completed" ||
                cachedDelivery.status === "failed"
              ) {
                console.log(
                  `Using cached status '${cachedDelivery.status}' for delivery ${freshDelivery.id}`
                );
                return {
                  ...freshDelivery,
                  status: cachedDelivery.status,
                  pod_file: cachedDelivery.pod_file || freshDelivery.pod_file,
                };
              }
            }
            return freshDelivery;
          });

          setDeliveries(mergedDeliveries);

          // Calculate statistics based on merged data
          const stats = {
            totalDeliveries: mergedDeliveries.length,
            completedDeliveries: mergedDeliveries.filter(
              (d) => d.status === "completed"
            ).length,
            pendingDeliveries: mergedDeliveries.filter(
              (d) => d.status === "pending"
            ).length,
            failedDeliveries: mergedDeliveries.filter(
              (d) => d.status === "failed"
            ).length,
            totalDistance: mergedDeliveries.reduce(
              (acc, d) => acc + (d.optimized_route?.distance || 0),
              0
            ),
            lastDeliveryTime: mergedDeliveries[0]?.created_at || null,
          };
          setStats(stats);

          // Save the merged deliveries back to localStorage
          localStorage.setItem(
            "courierDeliveries",
            JSON.stringify(mergedDeliveries)
          );
        } catch (error) {
          console.error("Error merging with cached data:", error);
          setDeliveries(deliveriesWithStops);

          // Calculate stats from fresh data
          const stats = {
            totalDeliveries: deliveriesWithStops.length,
            completedDeliveries: deliveriesWithStops.filter(
              (d) => d.status === "completed"
            ).length,
            pendingDeliveries: deliveriesWithStops.filter(
              (d) => d.status === "pending"
            ).length,
            failedDeliveries: deliveriesWithStops.filter(
              (d) => d.status === "failed"
            ).length,
            totalDistance: deliveriesWithStops.reduce(
              (acc, d) => acc + (d.optimized_route?.distance || 0),
              0
            ),
            lastDeliveryTime: deliveriesWithStops[0]?.created_at || null,
          };
          setStats(stats);
        }
      } else {
        setDeliveries(deliveriesWithStops);

        // Calculate statistics based on fresh data
        const stats = {
          totalDeliveries: deliveriesWithStops.length,
          completedDeliveries: deliveriesWithStops.filter(
            (d) => d.status === "completed"
          ).length,
          pendingDeliveries: deliveriesWithStops.filter(
            (d) => d.status === "pending"
          ).length,
          failedDeliveries: deliveriesWithStops.filter(
            (d) => d.status === "failed"
          ).length,
          totalDistance: deliveriesWithStops.reduce(
            (acc, d) => acc + (d.optimized_route?.distance || 0),
            0
          ),
          lastDeliveryTime: deliveriesWithStops[0]?.created_at || null,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error in fetchCourierDeliveries:", error);
      toast.error("Failed to fetch deliveries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    deliveryId: string,
    newStatus: "in_progress" | "completed" | "failed"
  ) => {
    try {
      console.log("=== Starting Status Update ===");
      console.log("Delivery ID:", deliveryId);
      console.log("New Status:", newStatus);

      if (newStatus === "failed") {
        console.log("Opening failure dialog");
        setSelectedDeliveryId(deliveryId);
        setFailureDialogOpen(true);
        return;
      }

      const delivery = deliveries.find((d) => d.id === deliveryId);
      console.log("Found delivery:", delivery);

      if (!delivery) {
        console.error("Delivery not found with ID:", deliveryId);
        toast.error("Delivery not found");
        return;
      }

      if (newStatus === "completed") {
        // Check if POD is uploaded
        if (!delivery?.pod_file) {
          setCompleteError(
            "Please upload Proof of Delivery (POD) before marking as completed."
          );
          return;
        }

        // Check stops: for address-only deliveries (no route) we only require POD
        const allStops = delivery.optimized_route?.stops || [];
        const hasRouteStops = allStops.length > 0;
        const completedStops = allStops.filter(
          (stop) => stop.status === "completed"
        );

        if (hasRouteStops && completedStops.length !== allStops.length) {
          const pendingStops = allStops.length - completedStops.length;
          setCompleteError(
            `Cannot complete delivery. ${pendingStops} stop(s) still pending. Please mark all stops as completed first.`
          );
          return;
        }

        setCompleteError(null);
      }

      console.log("Attempting database update...");

      // Create update object
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      console.log("Update data:", updateData);

      // First, try without returning data to avoid any potential issues with the return format
      const { error: updateError } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }

      console.log("Database update successful");

      // Verify the update was applied
      const { data: checkData, error: checkError } = await supabase
        .from("deliveries")
        .select("status, id")
        .eq("id", deliveryId)
        .single();

      if (checkError) {
        console.error("Error checking update result:", checkError);
        throw checkError;
      }

      console.log("Current status in database:", checkData);

      if (checkData.status !== newStatus) {
        console.error(
          "Status mismatch! Expected:",
          newStatus,
          "Actual:",
          checkData.status
        );
        toast.error("Status update failed, please try again");
        return;
      }

      // Update local state
      console.log("Updating local state...");
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === deliveryId
            ? { ...delivery, status: newStatus }
            : delivery
        )
      );

      // Update stats
      console.log("Updating stats...");
      setStats((prevStats) => {
        const newStats = { ...prevStats };
        if (newStatus === "completed") {
          newStats.completedDeliveries += 1;
          newStats.pendingDeliveries -= 1;
        } else if (newStatus === "in_progress") {
          newStats.pendingDeliveries -= 1;
        }
        return newStats;
      });

      console.log("Status update completed successfully");
      toast.success(
        `Delivery status updated to ${newStatus.replace("_", " ")}`
      );

      // Notify: audit + timeline + admin only (no customer/org email when courier updates)
      try {
        await fetch("/api/notify-delivery-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_id: deliveryId, new_status: newStatus, triggered_by: "courier" }),
        });
      } catch (e) {
        console.error("Notify delivery status failed:", e);
      }

      // Refresh data completely
      setTimeout(checkAuthAndFetchData, 500);
    } catch (error) {
      console.error("Error in handleStatusUpdate:", error);
      toast.error("Failed to update delivery status. Please try again.");
    }
  };

  const handlePODUpload = async (deliveryId: string, file: File) => {
    try {
      const BUCKET_NAME = "delivery-pods";
      const fileExt = file.name.split(".").pop();
      const fileName = `${deliveryId}-pod.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file with proper headers
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      console.log("File uploaded successfully, public URL:", publicUrl);

      // Create update object
      const updateData = {
        pod_file: publicUrl,
        status: "completed",
        updated_at: new Date().toISOString(),
      };

      console.log("Updating delivery with POD data:", updateData);

      // Update without returning data to avoid format issues
      const { error: updateError } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Error updating delivery with POD:", updateError);
        throw updateError;
      }

      // Verify the update was applied
      const { data: checkData, error: checkError } = await supabase
        .from("deliveries")
        .select("status, pod_file, id")
        .eq("id", deliveryId)
        .single();

      if (checkError) {
        console.error("Error checking POD update:", checkError);
        throw checkError;
      }

      console.log("Current delivery state in database:", checkData);

      if (checkData.status !== "completed" || !checkData.pod_file) {
        console.error("POD update verification failed!", checkData);
        toast.error("Status update may not have been saved correctly");
        return;
      }

      // Update local state
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                pod_file: publicUrl,
                status: "completed",
              }
            : delivery
        )
      );

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        completedDeliveries: prevStats.completedDeliveries + 1,
        pendingDeliveries: prevStats.pendingDeliveries - 1,
      }));

      toast.success("POD uploaded and delivery marked as completed");

      // Notify: audit + timeline + admin only (no customer/org email when courier completes)
      try {
        await fetch("/api/notify-delivery-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_id: deliveryId, new_status: "completed", triggered_by: "courier" }),
        });
      } catch (e) {
        console.error("Notify delivery status failed:", e);
      }

      // Force complete data refresh
      setTimeout(checkAuthAndFetchData, 500);

      setCompleteError(null);
    } catch (error: any) {
      console.error("Error uploading POD:", error);
      toast.error(
        "Failed to upload POD file: " + (error.message || "Unknown error")
      );
    }
  };

  const handleStopUpdate = async (
    stops: DeliveryStop[],
    stop: DeliveryStop,
    index: number
  ): Promise<void> => {
    try {
      const currentTime = new Date().toISOString();
      console.log("Starting stop update process:", {
        stopId: stop.id,
        deliveryId: stop.delivery_id,
        index,
        currentStop: stop,
        allStops: stops,
      });

      // Find the delivery
      const delivery = deliveries.find((d) => d.id === stop.delivery_id);
      if (!delivery) {
        console.error("Delivery not found for ID:", stop.delivery_id);
        throw new Error("Delivery not found");
      }

      console.log("Found delivery:", {
        deliveryId: delivery.id,
        currentRoute: delivery.optimized_route,
      });

      // Update the delivery_stops table for this stop
      if (stop.id) {
        const { error: stopUpdateError } = await supabase
          .from("delivery_stops")
          .update({
            status: "completed",
            actual_arrival_time: currentTime,
          })
          .eq("id", stop.id);
        if (stopUpdateError) {
          console.error(
            "Error updating delivery_stops table:",
            stopUpdateError
          );
          throw stopUpdateError;
        }
      }

      // Create updated stops array with proper typing
      const updatedStops = delivery.optimized_route?.stops.map((s, i) => {
        if (i === index) {
          console.log("Updating stop at index:", i);
          return {
            ...s,
            status: "completed",
            actual_arrival_time: currentTime,
          };
        }
        return s;
      });

      console.log("Updated stops array:", updatedStops);

      // Prepare the update data
      const updateData = {
        optimized_route: {
          ...delivery.optimized_route,
          stops: updatedStops,
        },
      };

      console.log("Update data:", updateData);

      // Update the delivery's optimized_route
      const { data, error: updateError } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("id", stop.delivery_id)
        .select();

      if (updateError) {
        console.error("Error updating delivery route:", updateError);
        throw updateError;
      }

      console.log("Successfully updated delivery in database:", data);

      // Update local state with proper typing
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((d) => {
          if (d.id === stop.delivery_id && d.delivery_stops) {
            console.log("Updating local state for delivery:", d.id);
            const updatedStops: DeliveryStop[] = d.delivery_stops.map((s, i) =>
              i === index
                ? {
                    ...s,
                    status: "completed" as const,
                    actual_arrival_time: currentTime,
                  }
                : s
            );
            const updatedDelivery: Delivery = {
              ...d,
              delivery_stops: updatedStops,
            };
            console.log("Updated delivery:", updatedDelivery);
            return updatedDelivery;
          }
          return d;
        })
      );

      toast.success("Stop marked as completed");
    } catch (error) {
      console.error("Error in handleStopUpdate:", error);
      toast.error("Failed to update stop status");
    }
  };

  const handleDeliveryUpdate = (
    updatedDelivery: Partial<Delivery> & { id: string }
  ): void => {
    setDeliveries((prevDeliveries) =>
      prevDeliveries.map((delivery) =>
        delivery.id === updatedDelivery.id
          ? {
              ...delivery,
              ...updatedDelivery,
              status: (updatedDelivery.status ||
                delivery.status) as Delivery["status"],
              delivery_stops:
                updatedDelivery.delivery_stops?.map((stop) => ({
                  ...stop,
                  status: stop.status as DeliveryStop["status"],
                })) || delivery.delivery_stops,
            }
          : delivery
      )
    );
  };

  const calculateRemainingTime = (estimatedTime: string) => {
    const estimated = new Date(estimatedTime).getTime();
    const now = new Date().getTime();
    const diff = estimated - now;

    if (diff < 0) return "Overdue";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const handleDeliveryFailure = async () => {
    if (!selectedDeliveryId || !failureReason.reason) return;

    try {
      const currentTime = new Date().toISOString();
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "failed",
          notes: `Failed Delivery - Reason: ${failureReason.reason
            .replace(/_/g, " ")
            .toUpperCase()}\nDetails: ${failureReason.details}`,
        })
        .eq("id", selectedDeliveryId);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === selectedDeliveryId
            ? {
                ...delivery,
                status: "failed",
                notes: `Failed Delivery - Reason: ${failureReason.reason
                  .replace(/_/g, " ")
                  .toUpperCase()}\nDetails: ${failureReason.details}`,
              }
            : delivery
        )
      );

      toast.success("Delivery marked as failed");
      setFailureDialogOpen(false);
      setSelectedDeliveryId(null);
      setFailureReason({ reason: "", details: "" });

      // Notify: audit + timeline + admin only (no customer/org email when courier marks failed)
      try {
        await fetch("/api/notify-delivery-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_id: selectedDeliveryId, new_status: "failed", triggered_by: "courier" }),
        });
      } catch (e) {
        console.error("Notify delivery status failed:", e);
      }
    } catch (error) {
      console.error("Error marking delivery as failed:", error);
      toast.error("Failed to update delivery status");
    }
  };

  const handleOptimizedStopComplete = async (
    deliveryId: string,
    stopIndex: number
  ) => {
    try {
      // Fetch the current optimized_route
      const { data: deliveryData, error: fetchError } = await supabase
        .from("deliveries")
        .select("optimized_route")
        .eq("id", deliveryId)
        .single();

      if (fetchError || !deliveryData?.optimized_route) {
        toast.error("Failed to fetch delivery route");
        return;
      }

      // Update the stop status
      const updatedStops = [...deliveryData.optimized_route.stops];
      if (updatedStops[stopIndex]) {
        updatedStops[stopIndex].status = "completed";
      }

      // Update the DB
      const { error: updateError } = await supabase
        .from("deliveries")
        .update({
          optimized_route: {
            ...deliveryData.optimized_route,
            stops: updatedStops,
          },
        })
        .eq("id", deliveryId);

      if (updateError) {
        toast.error("Failed to update stop status");
        return;
      }

      // Optionally, update local state for instant UI feedback
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                optimized_route: {
                  ...d.optimized_route,
                  stops: updatedStops,
                },
              }
            : d
        )
      );

      toast.success("Stop marked as completed!");
    } catch (err) {
      toast.error("Error updating stop");
    }
  };

  // Helper to get stops with type-safe coordinates for a delivery
  const getStopsWithCoords = (delivery: Delivery) =>
    delivery.optimized_route?.stops?.map((stop) => {
      let lat = stop.latitude;
      let lng = stop.longitude;
      if ((lat === undefined || lng === undefined) && stop.name) {
        const extracted = extractLatLngFromName(stop.name);
        lat = lat ?? extracted.latitude;
        lng = lng ?? extracted.longitude;
      }
      return {
        ...stop,
        latitude: typeof lat === "string" ? parseFloat(lat) : lat,
        longitude: typeof lng === "string" ? parseFloat(lng) : lng,
        status: stop.status ?? "pending",
      };
    }) || [];

  const renderDeliveryList = (deliveries: Delivery[]) => {
    return (
      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Accordion
            type="single"
            collapsible
            key={delivery.id}
            value={openAccordionId === delivery.id ? "item-1" : undefined}
            onValueChange={(val) => {
              if (val === "item-1") {
                setOpenAccordionId(delivery.id);
                if (!currentAddresses[delivery.id]) {
                  setAddressModalOpen(delivery.id);
                }
              } else {
                // Only allow closing if address is filled
                if (currentAddresses[delivery.id]) {
                  setOpenAccordionId(null);
                } else {
                  setAddressModalOpen(delivery.id);
                }
              }
            }}
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center gap-4">
                    <Package className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-left">
                        Package ID: {delivery.package_id}
                      </p>
                      <p className="text-sm text-muted-foreground text-left">
                        {new Date(delivery.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {delivery.status === "pending" && (
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 cursor-pointer select-none touch-manipulation bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-semibold shadow-md hover:shadow-lg min-h-[40px] px-4 relative z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusUpdate(delivery.id, "in_progress");
                        }}
                      >
                        Start delivery
                      </Button>
                    )}
                    <Badge
                      variant={
                        delivery.priority === "high"
                          ? "destructive"
                          : delivery.priority === "medium"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {delivery.priority.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={
                        delivery.status === "completed"
                          ? "success"
                          : delivery.status === "in_progress"
                          ? "warning"
                          : delivery.status === "failed"
                          ? "destructive"
                          : "secondary"
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
                      {delivery.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* Add Shipping Label Display */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4" />
                      Shipping Label
                    </h3>
                    <ShippingLabelDisplay delivery={delivery} />
                  </div>

                  {/* Products Section */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Box className="h-4 w-4" />
                      Products
                    </h3>
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-2">
                        {delivery.products.map((product, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span>{product.name}</span>
                            <Badge variant="outline">
                              {product.quantity} units
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Notes Section */}
                  {delivery.notes && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium flex items-center gap-2 mb-2">
                        <ClipboardList className="h-4 w-4" />
                        Delivery Notes
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {delivery.notes}
                      </p>
                    </div>
                  )}

                  {/* Route Summary for Completed/Failed Deliveries */}
                  {(delivery.status === "completed" ||
                    delivery.status === "failed") && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <Navigation className="h-4 w-4" />
                        Delivery Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Distance:</span>
                          <span>
                            {delivery.optimized_route?.distance.toFixed(2)} km
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Duration:</span>
                          <span>
                            {Math.floor(
                              delivery.optimized_route?.duration || 0
                            )}
                            h{" "}
                            {Math.round(
                              ((delivery.optimized_route?.duration || 0) % 1) *
                                60
                            )}
                            m
                          </span>
                        </div>
                        {delivery.optimized_route?.totalFuelCost && (
                          <div className="flex justify-between text-sm">
                            <span>Total Fuel Cost:</span>
                            <span>
                              Rs.{" "}
                              {Math.round(
                                delivery.optimized_route.totalFuelCost
                              )}
                            </span>
                          </div>
                        )}
                        {delivery.status === "failed" &&
                          delivery.notes?.startsWith("Failed Delivery") && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">
                                Failure Information:
                              </span>
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                                {delivery.notes}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Route and Stops Section for Active Deliveries */}
                  {delivery.status === "in_progress" && (
                    <div className="space-y-3 mt-6">
                      {delivery.optimized_route?.stops?.map((stop, index) => {
                        const stopWithStatus = {
                          ...stop,
                          status: stop.status ?? "pending",
                        };
                        return (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-background"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  Stop {index + 1}:{" "}
                                  {index === 0
                                    ? "Pickup"
                                    : index ===
                                      delivery.optimized_route.stops.length - 1
                                    ? "Delivery"
                                    : "Intermediate"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {stopWithStatus.name}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  stopWithStatus.status === "completed"
                                    ? "success"
                                    : "secondary"
                                }
                                className={
                                  stopWithStatus.status === "completed"
                                    ? "bg-green-100 text-green-800 border-green-200 font-medium"
                                    : "bg-gray-100 text-gray-800 border-gray-200 font-medium"
                                }
                              >
                                {stopWithStatus.status
                                  ? stopWithStatus.status.toUpperCase()
                                  : "PENDING"}
                              </Badge>
                            </div>
                            {stopWithStatus.status !== "completed" && (
                              <div className="mt-2 space-y-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleOptimizedStopComplete(
                                      delivery.id,
                                      index
                                    )
                                  }
                                >
                                  Mark as Completed
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* POD Section - show when in progress or out for delivery */}
                  {(delivery.status === "in_progress" || delivery.status === "out_for_delivery") && (
                    <div className="bg-muted/50 p-4 rounded-lg mt-4">
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4" />
                        Proof of Delivery (POD)
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-4">
                            Instructions: 1. Download the shipping label with
                            receiver's signature section 2. Get the receiver's
                            signature on the printed label 3. Take a clear photo
                            of the signed label 4. Upload the photo here as POD
                            <br />
                            <strong>
                              Note: Order will be automatically marked as
                              completed upon POD upload
                            </strong>
                          </p>
                          {!delivery.pod_file ? (
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handlePODUpload(delivery.id, file);
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Accepted formats: PNG, JPG, JPEG
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-green-600">
                                ✓ POD uploaded successfully - Delivery completed
                              </p>
                              <a
                                href={delivery.pod_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View uploaded POD
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Requirements Section */}
                  {(delivery.status === "in_progress" || delivery.status === "out_for_delivery") && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-medium flex items-center gap-2 mb-3 text-blue-800">
                        <CheckCircle className="h-4 w-4" />
                        Completion Requirements
                      </h3>
                      <div className="space-y-3">
                        {/* Stops Progress */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            Stops Completion:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-800">
                              {delivery.optimized_route?.stops?.filter(
                                (stop) => stop.status === "completed"
                              ).length || 0}{" "}
                              / {delivery.optimized_route?.stops?.length || 0}
                            </span>
                            <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{
                                  width: `${
                                    delivery.optimized_route?.stops?.length
                                      ? (delivery.optimized_route.stops.filter(
                                          (stop) => stop.status === "completed"
                                        ).length /
                                          delivery.optimized_route.stops
                                            .length) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* POD Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            POD Upload:
                          </span>
                          <div className="flex items-center gap-2">
                            {delivery.pod_file ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Uploaded
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Required
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Overall Status */}
                        <div className="mt-3 p-3 rounded-lg bg-white border">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const routeStops = delivery.optimized_route?.stops || [];
                              const hasRouteStops = routeStops.length > 0;
                              const allStopsCompleted = !hasRouteStops || routeStops.every(
                                (stop) => stop.status === "completed"
                              );
                              const podUploaded = !!delivery.pod_file;
                              const canComplete =
                                allStopsCompleted && podUploaded;

                              return (
                                <>
                                  {canComplete ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <CheckCircle className="h-5 w-5" />
                                      <span className="font-medium">
                                        Ready to Complete
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-yellow-600">
                                      <AlertCircle className="h-5 w-5" />
                                      <span className="font-medium">
                                        Requirements Pending
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 ml-auto">
                                    {hasRouteStops && !allStopsCompleted && (
                                      <div>• Mark all stops as completed</div>
                                    )}
                                    {!podUploaded && (
                                      <div>• Upload POD document</div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address-only delivery: show full address when no route stops */}
                  {(!delivery.optimized_route?.stops?.length) && (delivery.shipping_label?.delivery?.address || delivery.delivery_stops?.length) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <h3 className="font-medium flex items-center gap-2 mb-2 text-amber-800">
                        <MapIcon className="h-4 w-4" />
                        Delivery address (no route — use your own navigation)
                      </h3>
                      <p className="text-sm text-amber-900 font-medium">
                        {delivery.shipping_label?.delivery?.address ||
                          delivery.delivery_stops
                            ?.filter((s) => s.stop_type === "delivery")
                            .map((s) => s.address)
                            .join(", ") ||
                          "—"}
                      </p>
                      {delivery.shipping_label?.delivery?.notes && (
                        <p className="text-xs text-amber-700 mt-1">
                          {delivery.shipping_label.delivery.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(["pending", "in_progress", "out_for_delivery"] as const).includes(
                    delivery.status
                  ) && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {delivery.status === "pending" && (
                        <Button
                          type="button"
                          className="w-full min-h-[48px] sm:min-h-[44px] cursor-pointer select-none touch-manipulation relative z-10 bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:from-[#3456FF]/90 hover:to-[#8763FF]/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStatusUpdate(delivery.id, "in_progress");
                          }}
                        >
                          Start delivery
                        </Button>
                      )}
                      {(delivery.status === "in_progress" || delivery.status === "out_for_delivery") && (
                        <>
                          {completeError && (
                            <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-center font-semibold">
                              {completeError}
                            </div>
                          )}
                          <Button
                            type="button"
                            className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:from-[#3456FF]/90 hover:to-[#8763FF]/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusUpdate(delivery.id, "completed");
                            }}
                            disabled={(() => {
                              const routeStops = delivery.optimized_route?.stops || [];
                              const hasRouteStops = routeStops.length > 0;
                              const allStopsCompleted = !hasRouteStops || routeStops.every(
                                (stop) => stop.status === "completed"
                              );
                              const podUploaded = !!delivery.pod_file;
                              return !allStopsCompleted || !podUploaded;
                            })()}
                            title={(() => {
                              const routeStops = delivery.optimized_route?.stops || [];
                              const hasRouteStops = routeStops.length > 0;
                              const allStopsCompleted = !hasRouteStops || routeStops.every(
                                (stop) => stop.status === "completed"
                              );
                              const podUploaded = !!delivery.pod_file;
                              if (!allStopsCompleted && !podUploaded) {
                                return "Complete all stops and upload POD to enable this button";
                              } else if (!allStopsCompleted) {
                                return "Mark all stops as completed to enable this button";
                              } else if (!podUploaded) {
                                return "Upload POD document to enable this button";
                              }
                              return "Complete delivery";
                            })()}
                          >
                            Complete Delivery
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusUpdate(delivery.id, "failed");
                            }}
                          >
                            Mark as Failed
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    );
  };

  const failureDialog = (
    <Dialog open={failureDialogOpen} onOpenChange={setFailureDialogOpen}>
      <DialogContent className="bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
            Report Delivery Failure
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Failure</label>
            <Select
              value={failureReason.reason}
              onValueChange={(value) =>
                setFailureReason((prev) => ({ ...prev, reason: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_unavailable">
                  Customer Unavailable
                </SelectItem>
                <SelectItem value="wrong_address">Wrong Address</SelectItem>
                <SelectItem value="package_damaged">Package Damaged</SelectItem>
                <SelectItem value="vehicle_breakdown">
                  Vehicle Breakdown
                </SelectItem>
                <SelectItem value="weather_conditions">
                  Bad Weather Conditions
                </SelectItem>
                <SelectItem value="traffic_issues">
                  Severe Traffic Issues
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Details</label>
            <Textarea
              value={failureReason.details}
              onChange={(e) =>
                setFailureReason((prev) => ({
                  ...prev,
                  details: e.target.value,
                }))
              }
              placeholder="Provide more details about the failure..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFailureDialogOpen(false);
              setSelectedDeliveryId(null);
              setFailureReason({ reason: "", details: "" });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeliveryFailure}
            disabled={!failureReason.reason}
          >
            Mark as Failed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Handler to update address in state and DB
  const handleAddressChange = async (deliveryId: string, address: string) => {
    setCurrentAddresses((prev) => ({ ...prev, [deliveryId]: address }));
    // Save to DB
    await supabase
      .from("deliveries")
      .update({ current_address: address })
      .eq("id", deliveryId);
  };

  const handleDetectLocation = (deliveryId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await getAddressFromCoords(lat, lng);
          setCurrentAddresses((prev) => ({ ...prev, [deliveryId]: address }));
          // Save to DB
          await supabase
            .from("deliveries")
            .update({ current_address: address })
            .eq("id", deliveryId);
          setAddressModalOpen(null); // Close the modal after saving
        },
        (error) => {
          alert("Unable to detect location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#3456FF]/10 flex flex-col justify-between py-6 px-4">
        <div>
          <div className="flex flex-col items-start mb-8">
            <span className="font-bold text-lg bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent flex items-center gap-2">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 7v4a1 1 0 001 1h3m10-5h3a1 1 0 011 1v4a1 1 0 01-1 1h-3m-10 0v6a2 2 0 002 2h8a2 2 0 002-2v-6m-10 0h10"
                />
              </svg>
            </span>
            <span className="text-xs text-gray-400 mt-1">Courier Portal</span>
            <Button
              onClick={() => {
                localStorage.removeItem("currentCourier");
                router.push("/auth/login");
              }}
              className="w-full mt-4 bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10 hover:from-[#3456FF]/20 hover:to-[#8763FF]/20 text-[#3456FF] flex items-center gap-2 justify-center transition-all duration-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
              Sign Out
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "w-full justify-start gap-2 text-gray-700",
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                  : "hover:bg-gradient-to-r hover:from-[#3456FF]/10 hover:to-[#8763FF]/10 hover:text-[#3456FF]"
              )}
            >
              <Package className="h-5 w-5" />
              Dashboard
            </Button>
            <Button
              onClick={() => setActiveTab("assigned")}
              className={cn(
                "w-full justify-start gap-2 text-gray-700",
                activeTab === "assigned"
                  ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                  : "hover:bg-gradient-to-r hover:from-[#3456FF]/10 hover:to-[#8763FF]/10 hover:text-[#3456FF]"
              )}
            >
              <Truck className="h-5 w-5" />
              Assigned Deliveries
            </Button>
            <Button
              onClick={() => setActiveTab("completed")}
              className={cn(
                "w-full justify-start gap-2 text-gray-700",
                activeTab === "completed"
                  ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                  : "hover:bg-gradient-to-r hover:from-[#3456FF]/10 hover:to-[#8763FF]/10 hover:text-[#3456FF]"
              )}
            >
              <CheckCircle className="h-5 w-5" />
              Completed Deliveries
            </Button>
            <Button
              onClick={() => setActiveTab("failed")}
              className={cn(
                "w-full justify-start gap-2 text-gray-700",
                activeTab === "failed"
                  ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                  : "hover:bg-gradient-to-r hover:from-[#3456FF]/10 hover:to-[#8763FF]/10 hover:text-[#3456FF]"
              )}
            >
              <AlertCircle className="h-5 w-5" />
              Failed Deliveries
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
            Welcome back, {courierData?.name}!
          </h1>
          <p className="text-gray-500">
            Managing deliveries for {courierData?.email}
          </p>
        </div>

        {/* Add Barcode Scanner Button */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/courier/barcode-scanner")}
            className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:from-[#3456FF]/90 hover:to-[#8763FF]/90 text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Open Barcode Scanner
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm border-[#3456FF]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {stats.totalDeliveries}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-[#3456FF]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {stats.completedDeliveries}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-[#3456FF]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {stats.pendingDeliveries}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-[#3456FF]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {stats.failedDeliveries}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-[#3456FF]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {Math.round(stats.totalDistance)} km
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              {activeTab === "dashboard" && "Recent Deliveries"}
              {activeTab === "assigned" && "Assigned Deliveries"}
              {activeTab === "completed" && "Completed Deliveries"}
              {activeTab === "failed" && "Failed Deliveries"}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === "dashboard" &&
                "Your latest delivery assignments and updates"}
              {activeTab === "assigned" &&
                "Currently assigned and pending deliveries"}
              {activeTab === "completed" && "Successfully completed deliveries"}
              {activeTab === "failed" && "Failed delivery attempts"}
            </p>
          </div>

          <div className="space-y-4">
            {renderDeliveryList(
              deliveries.filter((delivery) => {
                switch (activeTab) {
                  case "assigned":
                    return (
                      delivery.status === "pending" ||
                      delivery.status === "in_progress"
                    );
                  case "completed":
                    return delivery.status === "completed";
                  case "failed":
                    return delivery.status === "failed";
                  default:
                    return true; // Show all deliveries in dashboard
                }
              })
            )}
          </div>
        </div>

        {/* Delivery Details Dialog */}
        <Dialog
          open={selectedDeliveryId !== null}
          onOpenChange={() => setSelectedDeliveryId(null)}
        >
          <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                Delivery Details
              </DialogTitle>
            </DialogHeader>
            {/* Rest of the dialog content remains unchanged */}
          </DialogContent>
        </Dialog>

        {/* Failure Dialog */}
        <Dialog open={failureDialogOpen} onOpenChange={setFailureDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                Report Delivery Failure
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason for Failure
                </label>
                <Select
                  value={failureReason.reason}
                  onValueChange={(value) =>
                    setFailureReason((prev) => ({ ...prev, reason: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_unavailable">
                      Customer Unavailable
                    </SelectItem>
                    <SelectItem value="wrong_address">Wrong Address</SelectItem>
                    <SelectItem value="package_damaged">
                      Package Damaged
                    </SelectItem>
                    <SelectItem value="vehicle_breakdown">
                      Vehicle Breakdown
                    </SelectItem>
                    <SelectItem value="weather_conditions">
                      Bad Weather Conditions
                    </SelectItem>
                    <SelectItem value="traffic_issues">
                      Severe Traffic Issues
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Details
                </label>
                <Textarea
                  value={failureReason.details}
                  onChange={(e) =>
                    setFailureReason((prev) => ({
                      ...prev,
                      details: e.target.value,
                    }))
                  }
                  placeholder="Provide more details about the failure..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setFailureDialogOpen(false);
                  setSelectedDeliveryId(null);
                  setFailureReason({ reason: "", details: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeliveryFailure}
                disabled={!failureReason.reason}
              >
                Mark as Failed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Address Modal */}
        <Dialog open={!!addressModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Your Current Location</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <input
                type="text"
                className="w-full border rounded px-2 py-1"
                value={currentAddresses[addressModalOpen ?? ""] || ""}
                onChange={(e) =>
                  handleAddressChange(addressModalOpen ?? "", e.target.value)
                }
                placeholder="Enter your current address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDetectLocation(addressModalOpen ?? "")}
                className="mt-2"
              >
                Detect My Location
              </Button>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setAddressModalOpen(null)}
                disabled={!currentAddresses[addressModalOpen ?? ""]}
              >
                Save & Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
