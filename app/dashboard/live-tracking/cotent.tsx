// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Package,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Navigation,
  XCircle,
  Download,
} from "lucide-react";
import { supabase } from "@/components/warehouses/SupabaseClient";
import L from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

interface CourierDelivery {
  id: string;
  package_id?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  courier_id: string;
  courier_name: string;
  current_location: {
    latitude: number;
    longitude: number;
    last_updated: string;
  };
  current_delivery: {
    id: string;
    pickup_address: string;
    delivery_address: string;
    status: string;
    estimated_delivery_time: string;
    priority: "high" | "medium" | "low";
    pod_file?: string;
    failure_reason?: string;
  };
  stops: {
    id: string;
    address: string;
    status: "completed" | "pending" | "current";
    estimated_arrival: string;
    actual_arrival?: string;
    latitude: number;
    longitude: number;
  }[];
  messages?: {
    id: string;
    sender: "client" | "courier";
    content: string;
    timestamp: string;
  }[];
  current_address?: string;
}

// Update the Completed Deliveries section
const CompletedDeliveries = ({
  deliveries,
}: {
  deliveries: CourierDelivery[];
}) => {
  // Ensure we only show deliveries that are completed
  const completedDeliveries = deliveries.filter(
    (d) => d.current_delivery.status === "completed"
  );

  if (completedDeliveries.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No completed deliveries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedDeliveries.map((delivery) => (
        <Card key={delivery.id} className="bg-white">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Delivery #{delivery.current_delivery.id.slice(0, 8)}
              </CardTitle>
              <Badge
                variant="success"
                className="bg-green-100 text-green-800 border-green-200"
              >
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">From</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.pickup_address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">To</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.delivery_address}
                  </p>
                </div>
              </div>

              {delivery.current_delivery.pod_file && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Proof of Delivery
                  </p>
                  <div className="border rounded-lg p-3">
                    <a
                      href={delivery.current_delivery.pod_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Package className="h-4 w-4" />
                      <span className="text-sm">View POD</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Add Failed Deliveries Component
const FailedDeliveries = ({
  deliveries,
}: {
  deliveries: CourierDelivery[];
}) => {
  // Ensure we only show deliveries that are failed
  const failedDeliveries = deliveries.filter(
    (d) => d.current_delivery.status === "failed"
  );

  if (failedDeliveries.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No failed deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {failedDeliveries.map((delivery) => (
        <Card key={delivery.id} className="bg-white">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Delivery #{delivery.current_delivery.id.slice(0, 8)}
              </CardTitle>
              <Badge
                variant="destructive"
                className="bg-red-100 text-red-800 border-red-200"
              >
                Failed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">From</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.pickup_address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">To</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.delivery_address}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700">
                  Failure Reason
                </p>
                <p className="text-sm mt-1 text-red-600">
                  {delivery.current_delivery.failure_reason ||
                    "Delivery attempt failed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Add Pending Deliveries Component
const PendingDeliveries = ({
  deliveries,
}: {
  deliveries: CourierDelivery[];
}) => {
  // Ensure we only show deliveries that are pending
  const pendingDeliveries = deliveries.filter(
    (d) => d.current_delivery.status === "pending"
  );

  if (pendingDeliveries.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No pending deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDeliveries.map((delivery) => (
        <Card key={delivery.id} className="bg-white">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Delivery #{delivery.current_delivery.id.slice(0, 8)}
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">From</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.pickup_address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">To</p>
                  <p className="text-sm mt-1">
                    {delivery.current_delivery.delivery_address}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-center">
                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-700">
                  Courier not started yet
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Scheduled Delivery
                </p>
                <p className="text-sm mt-1">
                  {new Date(
                    delivery.current_delivery.estimated_delivery_time
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Update the mapStyles constant with improved scrollbar styles
const mapStyles = `
  .leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .leaflet-control-container .leaflet-control {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .leaflet-control-zoom {
    border: none !important;
  }
  .leaflet-control-zoom a {
    border: none !important;
    color: #374151 !important;
  }
  .leaflet-control-zoom a:hover {
    background-color: #f3f4f6 !important;
  }

  /* Custom Scrollbar Styles */
  .scrollbar-custom {
    scrollbar-width: thin;
    scrollbar-color: #3b82f6 #e2e8f0;
    overflow-y: scroll !important;
    -webkit-overflow-scrolling: touch;
  }
  
  .scrollbar-custom::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
    display: block !important;
    background-color: #e2e8f0;
  }
  
  .scrollbar-custom::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 4px;
  }
  
  .scrollbar-custom::-webkit-scrollbar-thumb {
    background-color: #3b82f6;
    border-radius: 4px;
    border: 2px solid #e2e8f0;
    min-height: 40px;
  }
  
  .scrollbar-custom::-webkit-scrollbar-thumb:hover {
    background-color: #2563eb;
  }

  /* Mobile-specific scrollbar styles */
  @media (max-width: 768px) {
    .scrollbar-custom {
      overflow-y: scroll !important;
      -webkit-overflow-scrolling: touch;
    }
    
    .scrollbar-custom::-webkit-scrollbar {
      width: 8px !important;
      height: 8px !important;
      display: block !important;
      background-color: #e2e8f0;
    }
    
    .scrollbar-custom::-webkit-scrollbar-thumb {
      background-color: #3b82f6;
      border: 1px solid #e2e8f0;
      min-height: 40px;
    }
  }
`;

// Custom map controls component
function MapControls({
  selectedCourier,
  activeCouriers,
}: {
  selectedCourier: string | null;
  activeCouriers: CourierDelivery[];
}) {
  const map = useMap();

  const fitBounds = () => {
    if (selectedCourier) {
      const courier = activeCouriers.find((c) => c.id === selectedCourier);
      if (courier) {
        const bounds = L.latLngBounds([
          [
            courier.current_location.latitude,
            courier.current_location.longitude,
          ],
          ...courier.stops.map(
            (stop) => [stop.latitude, stop.longitude] as [number, number]
          ),
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      const bounds = L.latLngBounds(
        activeCouriers.flatMap((courier) => [
          [
            courier.current_location.latitude,
            courier.current_location.longitude,
          ] as [number, number],
          ...courier.stops.map(
            (stop) => [stop.latitude, stop.longitude] as [number, number]
          ),
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={fitBounds}
        className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        title="Fit to delivery"
      >
        <Navigation className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}

// Add this component at the top of your file, after the imports
function CourierMap({
  courier,
  addressCoordinates,
  stopCoordinates,
}: {
  courier: CourierDelivery;
  addressCoordinates: Record<string, { lat: number; lng: number }>;
  stopCoordinates: Record<string, Record<string, { lat: number; lng: number }>>;
}) {
  // Debug logging
  console.log("CourierMap render:", {
    courierId: courier.id,
    courierName: courier.courier_name,
    stops: courier.stops,
    addressCoordinates: addressCoordinates[courier.id],
    stopCoordinates: stopCoordinates[courier.id],
  });

  // Get current location coordinates (prioritize converted address coordinates)
  const currentCoords =
    addressCoordinates[courier.id] ||
    (courier.current_location.latitude !== null &&
    courier.current_location.longitude !== null
      ? {
          lat: courier.current_location.latitude,
          lng: courier.current_location.longitude,
        }
      : null);

  // Get stop coordinates (prioritize converted coordinates)
  const getStopCoords = (stop: any) => {
    const convertedCoords = stopCoordinates[courier.id]?.[stop.id];
    if (convertedCoords) return convertedCoords;

    if (stop.latitude !== null && stop.longitude !== null) {
      return { lat: stop.latitude, lng: stop.longitude };
    }

    return null;
  };

  // Use the stops array from transformed data
  const allStops = courier.stops || [];

  // Calculate center from all available coordinates
  const allCoords = [];

  if (currentCoords) {
    allCoords.push([currentCoords.lat, currentCoords.lng]);
  }

  allStops.forEach((stop) => {
    const coords = getStopCoords(stop);
    if (coords) {
      allCoords.push([coords.lat, coords.lng]);
    }
  });

  const center =
    allCoords.length > 0
      ? [
          allCoords.reduce((sum, [lat]) => sum + lat, 0) / allCoords.length,
          allCoords.reduce((sum, [_, lng]) => sum + lng, 0) / allCoords.length,
        ]
      : [51.5074, -0.1278]; // Default to London

  return (
    <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center as [number, number]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {/* Courier Marker */}
        {currentCoords && (
          <Marker
            position={[currentCoords.lat, currentCoords.lng]}
            icon={L.divIcon({
              className: "custom-div-icon",
              html: `
                <div class="relative">
                  <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>
                  <div style="position: absolute; top: -8px; left: -8px; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.2); animation: pulse 2s infinite;"></div>
                </div>
                <style>
                  @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                  }
                </style>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <div className="p-3">
                <h3 className="font-bold text-gray-900">
                  {courier.courier_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Current Location: {courier.current_address || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">
                  Last updated:{" "}
                  {new Date(
                    courier.current_location.last_updated
                  ).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Stop Markers */}
        {allStops.map((stop, index) => {
          const coords = getStopCoords(stop);
          console.log(`Stop ${index + 1}:`, { stop, coords });

          if (!coords) {
            console.log(`No coordinates for stop ${index + 1}:`, stop);
            return null;
          }

          return (
            <Marker
              key={stop.id}
              position={[coords.lat, coords.lng]}
              icon={L.divIcon({
                className: "custom-div-icon",
                html: `
                  <div class="relative">
                    <div style="background-color: ${
                      stop.status === "completed"
                        ? "#22c55e"
                        : stop.status === "current"
                        ? "#3b82f6"
                        : "#f59e0b"
                    }; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>
                    <div style="position: absolute; top: -6px; left: -6px; width: 26px; height: 26px; border-radius: 50%; background-color: ${
                      stop.status === "completed"
                        ? "rgba(34, 197, 94, 0.2)"
                        : stop.status === "current"
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(245, 158, 11, 0.2)"
                    };"></div>
                  </div>
                `,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            >
              <Popup>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900">Stop {index + 1}</h3>
                  <p className="text-sm text-gray-600">{stop.address}</p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        stop.status === "completed"
                          ? "default"
                          : stop.status === "current"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {stop.status}
                    </Badge>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route Line */}
        {currentCoords && (
          <Polyline
            positions={[
              [currentCoords.lat, currentCoords.lng] as [number, number],
              ...allStops
                .map((stop) => getStopCoords(stop))
                .filter((coords) => coords !== null)
                .map(
                  (coords) => [coords!.lat, coords!.lng] as [number, number]
                ),
            ]}
            color="#3b82f6"
            weight={3}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}

// Delivery Failure Dialog Component
const DeliveryFailureDialog = ({
  delivery,
  isOpen,
  onClose,
  onReportFailure,
}: {
  delivery: CourierDelivery | null;
  isOpen: boolean;
  onClose: () => void;
  onReportFailure: (id: string, reason: string) => void;
}) => {
  const [failureReason, setFailureReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!delivery || !failureReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onReportFailure(delivery.id, failureReason.trim());
      onClose();
    } catch (error) {
      console.error("Error reporting failure:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset reason when dialog opens with new delivery
  useEffect(() => {
    if (isOpen && delivery) {
      setFailureReason("");
    }
  }, [isOpen, delivery]);

  // Add debug logging
  useEffect(() => {
    console.log("Dialog state:", { isOpen, delivery, failureReason });
  }, [isOpen, delivery, failureReason]);

  if (!delivery) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange called with:", open);
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="sm:max-w-[500px] z-[9999] bg-white fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-2" />
              Report Delivery Failure
            </DialogTitle>
            <DialogDescription>
              Please provide details about why this delivery failed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Delivery Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Delivery ID</p>
                  <p className="font-medium">
                    {delivery.current_delivery.id.slice(0, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Courier</p>
                  <p className="font-medium">{delivery.courier_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">
                    {delivery.current_delivery.pickup_address}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">
                    {delivery.current_delivery.delivery_address}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="failure-reason" className="text-sm font-medium">
                Reason for Failure
              </Label>
              <Textarea
                id="failure-reason"
                placeholder="Enter the reason why the delivery failed..."
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className="mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!failureReason.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Reporting..." : "Report Failure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

// Function to convert address to coordinates using reverse geocoding
async function getCoordinatesFromAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use Geoapify with the provided API key
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address
      )}&apiKey=6e23ca9357c04213b74f5dce9f441761`
    );

    if (!response.ok) {
      console.error("Geocoding API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      console.log("Converted address to coordinates:", { lat, lng });
      return { lat, lng };
    }

    console.log("No coordinates found for address:", address);
    return null;
  } catch (error) {
    console.error("Error converting address to coordinates:", error);
    return null;
  }
}

export default function LiveTracking() {
  const [activeCouriers, setActiveCouriers] = useState<CourierDelivery[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "completed" | "failed" | "pending"
  >("completed");
  const [failureDialogOpen, setFailureDialogOpen] = useState(false);
  const [selectedDeliveryForFailure, setSelectedDeliveryForFailure] =
    useState<CourierDelivery | null>(null);
  const { toast: uiToast } = useToast();
  const [addressCoordinates, setAddressCoordinates] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [stopCoordinates, setStopCoordinates] = useState<
    Record<string, Record<string, { lat: number; lng: number }>>
  >({});
  const [convertingAddresses, setConvertingAddresses] = useState(false);

  // Function to convert addresses to coordinates
  const convertAddressesToCoordinates = async (deliveries: any[]) => {
    setConvertingAddresses(true);
    const newCoordinates: Record<string, { lat: number; lng: number }> = {};
    const newStopCoordinates: Record<
      string,
      Record<string, { lat: number; lng: number }>
    > = {};

    for (const delivery of deliveries) {
      // Convert current address
      if (delivery.current_address && !addressCoordinates[delivery.id]) {
        console.log(
          "Converting current address to coordinates:",
          delivery.current_address
        );
        const coords = await getCoordinatesFromAddress(
          delivery.current_address
        );
        if (coords) {
          newCoordinates[delivery.id] = coords;
          console.log("Converted current address coordinates:", coords);
        }
      }

      // Convert stop addresses from the transformed data structure
      if (delivery.stops && delivery.stops.length > 0) {
        newStopCoordinates[delivery.id] = {};
        for (const stop of delivery.stops) {
          if (
            stop.address &&
            (stop.latitude === null || stop.longitude === null)
          ) {
            console.log(
              "Converting stop address to coordinates:",
              stop.address
            );
            const coords = await getCoordinatesFromAddress(stop.address);
            if (coords) {
              newStopCoordinates[delivery.id][stop.id] = coords;
              console.log("Converted stop coordinates:", coords);
            }
          }
        }
      }
    }

    if (Object.keys(newCoordinates).length > 0) {
      setAddressCoordinates((prev) => ({ ...prev, ...newCoordinates }));
    }

    if (Object.keys(newStopCoordinates).length > 0) {
      setStopCoordinates((prev) => ({ ...prev, ...newStopCoordinates }));
    }

    setConvertingAddresses(false);
  };

  // Calculate time remaining until estimated delivery
  const getTimeRemaining = (estimatedTime: string) => {
    const remaining = new Date(estimatedTime).getTime() - new Date().getTime();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate completion percentage
  const getCompletionPercentage = (stops: CourierDelivery["stops"]) => {
    const completed = stops.filter(
      (stop) => stop.status === "completed"
    ).length;
    return (completed / stops.length) * 100;
  };

  // Function to send message
  const sendMessage = async (courierId: string) => {
    if (!newMessage.trim()) return;

    setMessageError(null);
    try {
      console.log("Sending message:", {
        delivery_id: courierId,
        sender: "client",
        content: newMessage.trim(),
      });

      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            delivery_id: courierId,
            sender: "client",
            content: newMessage.trim(),
            timestamp: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      console.log("Message sent successfully:", data);

      // Update local state
      setActiveCouriers((prev) =>
        prev.map((courier) => {
          if (courier.id === courierId) {
            return {
              ...courier,
              messages: [
                ...(courier.messages || []),
                {
                  id: data[0].id,
                  sender: data[0].sender,
                  content: data[0].content,
                  timestamp: data[0].timestamp,
                },
              ],
            };
          }
          return courier;
        })
      );

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessageError("Failed to send message. Please try again.");
    }
  };

  // Function to fetch messages for a delivery
  const fetchMessages = async (deliveryId: string) => {
    try {
      console.log("Fetching messages for delivery:", deliveryId);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("delivery_id", deliveryId)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }

      console.log("Fetched messages:", data);
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  // Fetch messages when courier is selected
  useEffect(() => {
    if (selectedCourier) {
      console.log(
        "Selected courier changed, fetching messages for:",
        selectedCourier
      );
      fetchMessages(selectedCourier).then((messages) => {
        console.log("Setting messages for courier:", messages);
        setActiveCouriers((prev) =>
          prev.map((courier) => {
            if (courier.id === selectedCourier) {
              return { ...courier, messages };
            }
            return courier;
          })
        );
      });
    }
  }, [selectedCourier]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (selectedCourier) {
      console.log(
        "Setting up message subscription for courier:",
        selectedCourier
      );

      const messageSubscription = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `delivery_id=eq.${selectedCourier}`,
          },
          (payload) => {
            console.log("Received message update:", payload);
            if (payload.eventType === "INSERT") {
              setActiveCouriers((prev) =>
                prev.map((courier) => {
                  if (courier.id === selectedCourier) {
                    return {
                      ...courier,
                      messages: [
                        ...(courier.messages || []),
                        {
                          id: payload.new.id,
                          sender: payload.new.sender,
                          content: payload.new.content,
                          timestamp: payload.new.timestamp,
                        },
                      ],
                    };
                  }
                  return courier;
                })
              );
            }
          }
        )
        .subscribe();

      return () => {
        console.log("Cleaning up message subscription");
        messageSubscription.unsubscribe();
      };
    }
  }, [selectedCourier, supabase]);

  // Fetch active couriers and their deliveries
  useEffect(() => {
    const fetchActiveCouriers = async () => {
      try {
        // Get current client ID from localStorage
        const currentUser = localStorage.getItem("currentUser");
        console.log("Current user from localStorage:", currentUser);

        if (!currentUser) {
          console.log("No user found in localStorage");
          return;
        }

        const userData = JSON.parse(currentUser);
        console.log("Parsed user data:", userData);

        if (!userData.id) {
          console.log("No user ID found in user data");
          return;
        }

        const clientId = userData.id;
        console.log("Fetching deliveries for client:", clientId);
        console.log("User data:", userData);

        const { data: deliveries, error: deliveriesError } = await supabase
          .from("deliveries")
          .select(
            `
            id,
            package_id,
            status,
            courier_id,
            pod_file,
            client_id,
            notes,
            current_address,
            created_at,
            shipping_label,
            couriers!courier_id (
              id,
              name,
              current_latitude,
              current_longitude,
              last_location_update
            ),
            delivery_stops (
              id,
              address,
              status,
              estimated_arrival,
              actual_arrival,
              latitude,
              longitude,
              stop_order
            )
          `
          )
          .eq("client_id", clientId)
          .or(
            "status.eq.in_progress,status.eq.out_for_delivery,status.eq.completed,status.eq.failed,status.eq.pending"
          )
          .order("created_at", { ascending: false });

        if (deliveriesError) {
          console.error("Error fetching deliveries:", deliveriesError);
          return;
        }

        console.log("Raw deliveries data:", deliveries);
        console.log("Number of raw deliveries:", deliveries?.length || 0);

        if (!deliveries || deliveries.length === 0) {
          console.log("No deliveries found for this client");
          return;
        }

        // Transform the data for our UI
        const transformedData = deliveries.map((delivery) => {
          console.log("Processing delivery:", delivery);

          // Generate coordinates for stops - use whatever coordinates are available
          const stops = (delivery.delivery_stops || []).map((stop, index) => {
            // Use coordinates if available, otherwise use null
            const lat = stop.latitude || null;
            const lng = stop.longitude || null;

            return {
              ...stop,
              latitude: lat,
              longitude: lng,
              stop_order: stop.stop_order || index,
            };
          });

          // Use courier coordinates if available (Supabase may return relation as object or array)
          const courierObj = Array.isArray(delivery.couriers)
            ? delivery.couriers[0]
            : delivery.couriers;
          const courierLat = courierObj?.current_latitude || null;
          const courierLng = courierObj?.current_longitude || null;

          const pickupAddress = stops[0]?.address || "Unknown";
          const deliveryAddress = stops[stops.length - 1]?.address || "Unknown";

          const customerName = (delivery.shipping_label as any)?.delivery?.address
            ? "Customer delivery"
            : null;

          return {
            id: delivery.id,
            package_id: delivery.package_id || null,
            created_at: delivery.created_at || null,
            customer_name: customerName,
            courier_id: delivery.courier_id,
            courier_name:
              (courierObj?.name && String(courierObj.name).trim()) || "Courier",
            current_location: {
              latitude: courierLat,
              longitude: courierLng,
              last_updated:
                courierObj?.last_location_update || new Date().toISOString(),
            },
            current_delivery: {
              id: delivery.id,
              pickup_address: pickupAddress,
              delivery_address: deliveryAddress,
              status: delivery.status,
              estimated_delivery_time:
                stops[stops.length - 1]?.estimated_arrival ||
                new Date(Date.now() + 3600000).toISOString(),
              priority: "medium" as const,
              pod_file: delivery.pod_file,
              failure_reason: delivery.notes,
            },
            stops: stops.map((stop, index) => ({
              id: stop.id,
              address: stop.address,
              status:
                delivery.status === "completed"
                  ? "completed"
                  : (stop.status || "pending"),
              estimated_arrival:
                stop.estimated_arrival ||
                new Date(Date.now() + (index + 1) * 1800000).toISOString(),
              actual_arrival: stop.actual_arrival,
              latitude: stop.latitude,
              longitude: stop.longitude,
              order: stop.stop_order,
            })),
            messages: [],
            current_address: delivery.current_address,
          };
        });

        console.log("Transformed data:", transformedData);
        console.log(
          "Number of deliveries after transformation:",
          transformedData.length
        );
        setActiveCouriers(transformedData);

        // Convert addresses to coordinates using transformed data
        convertAddressesToCoordinates(transformedData);
      } catch (error) {
        console.error("Error in fetchActiveCouriers:", error);
      }
    };

    // Initial fetch
    fetchActiveCouriers();

    // Set up real-time subscription
    const deliverySubscription = supabase
      .channel("courier-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
        },
        (payload) => {
          console.log("Received delivery update:", payload);
          fetchActiveCouriers();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up delivery subscription");
      deliverySubscription.unsubscribe();
    };
  }, [supabase]);

  // Add this script to handle scroll indicators
  useEffect(() => {
    const scrollContainers = document.querySelectorAll(
      ".scroll-area-container"
    );

    const handleScroll = (container: Element) => {
      const hasScroll = container.scrollHeight > container.clientHeight;
      container.classList.toggle("has-scroll", hasScroll);
    };

    scrollContainers.forEach((container) => {
      handleScroll(container);
      container.addEventListener("scroll", () => handleScroll(container));
    });

    return () => {
      scrollContainers.forEach((container) => {
        container.removeEventListener("scroll", () => handleScroll(container));
      });
    };
  }, [activeCouriers]);

  // Get active (in_progress), completed, failed, and pending deliveries
  const inProgressDeliveries = activeCouriers.filter(
    (d) => d.current_delivery.status === "in_progress" || d.current_delivery.status === "out_for_delivery"
  );
  const completedDeliveries = activeCouriers.filter(
    (d) => d.current_delivery.status === "completed"
  );
  const failedDeliveries = activeCouriers.filter(
    (d) => d.current_delivery.status === "failed"
  );
  const pendingDeliveries = activeCouriers.filter(
    (d) => d.current_delivery.status === "pending"
  );

  // Function to handle reporting a delivery failure
  const handleReportFailure = async (deliveryId: string, reason: string) => {
    try {
      // Update the delivery status to failed in the database
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "failed",
          notes: reason,
        })
        .eq("id", deliveryId);

      if (error) throw error;

      // Use sonner toast instead of shadcn/ui toast
      toast.success("Delivery marked as failed");

      // Update local state
      setActiveCouriers((prev) =>
        prev.map((courier) =>
          courier.id === deliveryId
            ? {
                ...courier,
                current_delivery: {
                  ...courier.current_delivery,
                  status: "failed",
                  failure_reason: reason,
                },
              }
            : courier
        )
      );

      // Switch to failed tab
      setActiveTab("failed");
    } catch (error) {
      console.error("Error reporting delivery failure:", error);
      // Use sonner toast instead of shadcn/ui toast
      toast.error("Error reporting failure. Please try again.");
    }
  };

  // Function to open the failure dialog for a specific delivery
  const openFailureDialog = (delivery: CourierDelivery) => {
    console.log("Opening failure dialog for delivery:", delivery.id);
    setSelectedDeliveryForFailure(delivery);
    setFailureDialogOpen(true);
  };

  // Show loading state
  if (activeCouriers.length === 0) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Deliveries</h2>
          <p className="text-muted-foreground">
            When a courier starts delivering or starts a route, you can see live
            tracking here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gray-50 relative">
      {/* Include the failure dialog with a key to force re-render when dialog state changes */}
      <DeliveryFailureDialog
        key={`dialog-${failureDialogOpen ? "open" : "closed"}-${
          selectedDeliveryForFailure?.id || "none"
        }`}
        delivery={selectedDeliveryForFailure}
        isOpen={failureDialogOpen}
        onClose={() => {
          console.log("Dialog onClose called");
          setFailureDialogOpen(false);
        }}
        onReportFailure={handleReportFailure}
      />

      {/* Header Section */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time delivery tracking and status monitoring
          </p>
        </div>
      </div>

      {/* Transformed Data Display */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeCouriers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                No transformed data available
              </p>
            </div>
          ) : (
            activeCouriers.map((delivery, index) => (
              <div
                key={delivery.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Status Banner */}
                <div
                  className={`px-6 py-3 ${
                    delivery.current_delivery.status === "completed"
                      ? "bg-green-500"
                      : delivery.current_delivery.status === "failed"
                      ? "bg-red-500"
                      : delivery.current_delivery.status === "in_progress" || delivery.current_delivery.status === "out_for_delivery"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {delivery.current_delivery.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : delivery.current_delivery.status === "failed" ? (
                        <XCircle className="h-5 w-5 text-white" />
                      ) : delivery.current_delivery.status === "in_progress" || delivery.current_delivery.status === "out_for_delivery" ? (
                        <Clock className="h-5 w-5 text-white" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-white" />
                      )}
                      <span className="text-white font-bold text-lg">
                        {delivery.current_delivery.status === "completed"
                          ? "DELIVERY COMPLETED"
                          : delivery.current_delivery.status === "failed"
                          ? "DELIVERY FAILED"
                          : delivery.current_delivery.status === "out_for_delivery"
                          ? "OUT FOR DELIVERY"
                          : delivery.current_delivery.status === "in_progress"
                          ? "DELIVERY IN PROGRESS"
                          : "DELIVERY PENDING"}
                      </span>
                    </div>
                    <div className="text-white text-sm font-medium">
                      {delivery.current_delivery.status === "completed"
                        ? "✓ Success"
                        : delivery.current_delivery.status === "failed"
                        ? "✗ Failed"
                        : delivery.current_delivery.status === "in_progress" || delivery.current_delivery.status === "out_for_delivery"
                        ? "⏳ Active"
                        : "⏸ Pending"}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {delivery.package_id || `Delivery #${delivery.id.slice(0, 8)}`}
                  </h2>
                  {delivery.created_at && (
                    <p className="text-blue-100 text-sm mt-1">
                      {new Date(delivery.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Package ID:</span>
                            <span className="font-mono text-sm font-medium text-gray-800">
                              {delivery.package_id || delivery.id.slice(0, 8)}
                            </span>
                          </div>
                          {delivery.created_at && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Date & time:</span>
                              <span className="font-medium text-gray-800">
                                {new Date(delivery.created_at).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          )}
                          {delivery.customer_name && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Customer:</span>
                              <span className="font-medium text-gray-800">
                                {delivery.customer_name}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Courier Name:
                            </span>
                            <span className="font-medium text-gray-800">
                              {delivery.courier_name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Delivery Status:
                            </span>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded-full ${
                                  delivery.current_delivery.status ===
                                  "completed"
                                    ? "bg-green-500"
                                    : delivery.current_delivery.status ===
                                      "failed"
                                    ? "bg-red-500"
                                    : delivery.current_delivery.status ===
                                      "in_progress" || delivery.current_delivery.status === "out_for_delivery"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                              <Badge
                                variant={
                                  delivery.current_delivery.status ===
                                  "completed"
                                    ? "default"
                                    : delivery.current_delivery.status ===
                                      "failed"
                                    ? "destructive"
                                    : delivery.current_delivery.status ===
                                      "in_progress" || delivery.current_delivery.status === "out_for_delivery"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="capitalize font-semibold text-sm px-3 py-1"
                              >
                                {delivery.current_delivery.status ===
                                "completed" ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-white">
                                      COMPLETED
                                    </span>
                                  </div>
                                ) : delivery.current_delivery.status ===
                                  "failed" ? (
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-white">FAILED</span>
                                  </div>
                                ) : delivery.current_delivery.status ===
                                  "out_for_delivery" ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>OUT FOR DELIVERY</span>
                                  </div>
                                ) : delivery.current_delivery.status ===
                                  "in_progress" ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>IN PROGRESS</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>PENDING</span>
                                  </div>
                                )}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Priority:
                            </span>
                            <Badge
                              variant={
                                delivery.current_delivery.priority === "high"
                                  ? "destructive"
                                  : delivery.current_delivery.priority ===
                                    "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {delivery.current_delivery.priority}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Estimated Delivery:
                            </span>
                            <span className="font-medium text-gray-800">
                              {new Date(
                                delivery.current_delivery.estimated_delivery_time
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Progress */}
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                          Delivery Progress
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Overall Progress:
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {getCompletionPercentage(delivery.stops)}%
                            </span>
                          </div>
                          <Progress
                            value={getCompletionPercentage(delivery.stops)}
                            className="h-2"
                          />
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-green-100 rounded-lg p-2">
                              <div className="text-lg font-bold text-green-700">
                                {
                                  delivery.stops.filter(
                                    (s) => s.status === "completed"
                                  ).length
                                }
                              </div>
                              <div className="text-xs text-green-600">
                                Completed
                              </div>
                            </div>
                            <div className="bg-yellow-100 rounded-lg p-2">
                              <div className="text-lg font-bold text-yellow-700">
                                {
                                  delivery.stops.filter(
                                    (s) => s.status === "current"
                                  ).length
                                }
                              </div>
                              <div className="text-xs text-yellow-600">
                                Current
                              </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-2">
                              <div className="text-lg font-bold text-gray-700">
                                {
                                  delivery.stops.filter(
                                    (s) => s.status === "pending"
                                  ).length
                                }
                              </div>
                              <div className="text-xs text-gray-600">
                                Pending
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Map for Current Address and Stops */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Delivery Map
                        </h3>
                        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200">
                          {(() => {
                            // Check if we have any real coordinates
                            const hasCoordinates =
                              delivery.current_location.latitude !== null ||
                              delivery.stops.some(
                                (stop) => stop.latitude !== null
                              ) ||
                              addressCoordinates[delivery.id];

                            if (convertingAddresses && !hasCoordinates) {
                              return (
                                <div className="h-full flex items-center justify-center bg-gray-50">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-gray-600">
                                      Converting addresses to coordinates...
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      This may take a few moments
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            if (!hasCoordinates) {
                              return (
                                <div className="h-full flex items-center justify-center bg-gray-50">
                                  <div className="text-center">
                                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">
                                      No coordinates available
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      Map will appear when coordinates are added
                                    </p>
                                    {delivery.current_address && (
                                      <p className="text-xs text-gray-400 mt-2">
                                        Address: {delivery.current_address}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <CourierMap
                                courier={delivery}
                                addressCoordinates={addressCoordinates}
                                stopCoordinates={stopCoordinates}
                              />
                            );
                          })()}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Current Location
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Current Stop
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Pending
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Address */}
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-green-600" />
                          Current Address
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Current Address:
                            </p>
                            <p className="text-sm font-medium text-gray-800 bg-white rounded-lg p-2 border">
                              {delivery.current_address ||
                                "No address available"}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Last Updated:
                            </span>
                            <span className="font-medium text-gray-800">
                              {new Date(
                                delivery.current_location.last_updated
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Proof of Delivery Section - Only show for completed deliveries */}
                      {delivery.current_delivery.status === "completed" && (
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Package className="h-5 w-5 text-emerald-600" />
                            Proof of Delivery (POD)
                          </h3>
                          <div className="space-y-3">
                            {delivery.current_delivery.pod_file ? (
                              <div className="space-y-3">
                                <div className="bg-emerald-100 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-medium">
                                      POD Available
                                    </span>
                                  </div>
                                  <p className="text-sm text-emerald-600">
                                    Proof of delivery document has been uploaded
                                    and is ready for download.
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={delivery.current_delivery.pod_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                  >
                                    <Package className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      View POD
                                    </span>
                                  </a>
                                  <a
                                    href={delivery.current_delivery.pod_file}
                                    download
                                    className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Download
                                    </span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-yellow-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="font-medium">
                                    POD Pending
                                  </span>
                                </div>
                                <p className="text-sm text-yellow-600">
                                  Proof of delivery document is being processed
                                  or uploaded.
                                </p>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Delivery ID:
                              </span>
                              <span className="font-mono font-medium text-gray-800">
                                {delivery.current_delivery.id}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Completion Time:
                              </span>
                              <span className="font-medium text-gray-800">
                                {new Date(
                                  delivery.current_location.last_updated
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Failure Reason Section - Only show for failed deliveries */}
                      {delivery.current_delivery.status === "failed" &&
                        delivery.current_delivery.failure_reason && (
                          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              Failure Details
                            </h3>
                            <div className="space-y-3">
                              <div className="bg-red-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-700 mb-2">
                                  <XCircle className="h-4 w-4" />
                                  <span className="font-medium">
                                    Delivery Failed
                                  </span>
                                </div>
                                <p className="text-sm text-red-600">
                                  {delivery.current_delivery.failure_reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Stops and Messages */}
                    <div className="space-y-6">
                      {/* Stops */}
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-600" />
                          Stops ({delivery.stops.length})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {delivery.stops.map((stop, stopIndex) => (
                            <div
                              key={stop.id}
                              className="bg-white rounded-lg p-3 border border-orange-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      stop.status === "completed"
                                        ? "bg-green-500"
                                        : stop.status === "current"
                                        ? "bg-yellow-500"
                                        : "bg-gray-400"
                                    }`}
                                  ></div>
                                  <h4 className="font-medium text-gray-800">
                                    Stop {stopIndex + 1}
                                  </h4>
                                </div>
                                <Badge
                                  variant={
                                    stop.status === "completed"
                                      ? "default"
                                      : stop.status === "current"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="capitalize"
                                >
                                  {stop.status === "completed" ? (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      {stop.status}
                                    </div>
                                  ) : stop.status === "current" ? (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {stop.status}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      {stop.status}
                                    </div>
                                  )}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">ID:</span>
                                  <span className="font-mono font-medium text-gray-800">
                                    {stop.id}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Address:</p>
                                  <p className="font-medium text-gray-800 bg-gray-50 rounded p-2">
                                    {stop.address}
                                  </p>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Estimated Arrival:
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {new Date(
                                      stop.estimated_arrival
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                {stop.actual_arrival && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Actual Arrival:
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {new Date(
                                        stop.actual_arrival
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {stop.status === "completed" && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        Successfully completed
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {stop.status === "current" && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                      <Clock className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        Currently at this stop
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {stop.status === "pending" && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <AlertCircle className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        Awaiting arrival
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-indigo-600" />
                          Messages ({delivery.messages?.length || 0})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {delivery.messages && delivery.messages.length > 0 ? (
                            delivery.messages.map((message) => (
                              <div
                                key={message.id}
                                className="bg-white rounded-lg p-3 border border-indigo-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-800 capitalize">
                                    {message.sender}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      message.timestamp
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">ID:</span>
                                    <span className="font-mono font-medium text-gray-800">
                                      {message.id}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      Content:
                                    </p>
                                    <p className="font-medium text-gray-800 bg-gray-50 rounded p-2">
                                      {message.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No messages available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
