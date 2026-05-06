// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth/SupabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { AIParticleEffect } from "@/components/ui/ai-particle-effect";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { WarehouseMap } from "@/components/warehouses/warehouse-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warehouse3DShowcase } from "@/components/warehouses/warehouse-3d-showcase";

const ITEMS_PER_PAGE = 10;

interface Warehouse {
  id: string;
  client_id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  capacity: number;
  utilization: number;
  revenue: number;
  products: number;
  manager: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  location_code: string;
  status: string;
  last_updated: string;
}

interface InventoryMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  movement_type: "in" | "out" | "transfer";
  reference_number: string;
  notes: string;
  performed_by: string;
  timestamp: string;
  warehouses?: {
    name: string;
  };
  products?: {
    name: string;
    sku: string;
  };
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  sku: string;
  category: string;
  condition: string;
  price: number;
  status: string;
  client_id: string;
}

interface LocationSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

interface WarehouseFormData {
  name: string;
  location: string;
  capacity: number;
  manager: string;
}

interface WarehouseFormProps {
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  warehouse?: Warehouse | null;
  isLoading: boolean;
  locationSuggestions: LocationSuggestion[];
  onLocationChange: (location: string) => Promise<void>;
  isValidatingLocation: boolean;
}

type Quantities = Record<string, number>;

// Enhanced formatting functions
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null
  );
  const [deletingWarehouseId, setDeletingWarehouseId] = useState<string | null>(
    null
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [warehouseInventory, setWarehouseInventory] = useState<
    WarehouseInventory[]
  >([]);
  const [stockMovements, setStockMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingLocationWarehouse, setEditingLocationWarehouse] =
    useState<Warehouse | null>(null);
  const [newLocation, setNewLocation] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const handleDeleteWarehouse = async () => {
    if (!deletingWarehouseId) return;

    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("Please sign in to delete warehouses");
      return;
    }

    try {
      setIsLoading(true);
      const userData = JSON.parse(currentUser);

      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", deletingWarehouseId)
        .eq("client_id", userData.id);

      if (error) throw error;

      setWarehouses((prev) => prev.filter((w) => w.id !== deletingWarehouseId));
      setDeletingWarehouseId(null);
      toast.success("Warehouse deleted successfully");
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      toast.error("Failed to delete warehouse");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          quantity,
          sku,
          category,
          condition,
          price,
          status,
          client_id
        `
        )
        .eq("client_id", clientId)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const fetchMovements = async () => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        toast.error("Please sign in to view stock movements");
        return;
      }

      const userData = JSON.parse(currentUser);

      // First, let's try a simple query without joins
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("client_id", userData.id)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching movements:", error);
        throw error;
      }

      console.log("Raw movements data:", data);

      // If we have data, now fetch the related warehouse and product info
      if (data && data.length > 0) {
        const { data: movementsWithDetails, error: detailsError } =
          await supabase
            .from("inventory_movements")
            .select(
              `
            *,
            warehouses:warehouse_id (
              name
            ),
            products:product_id (
              name,
              sku
            )
          `
            )
            .eq("client_id", userData.id)
            .order("timestamp", { ascending: false });

        if (detailsError) {
          console.error("Error fetching movement details:", detailsError);
          throw detailsError;
        }

        console.log("Movements with details:", movementsWithDetails);
        setStockMovements(movementsWithDetails || []);
      } else {
        setStockMovements([]);
      }
    } catch (error) {
      console.error("Error in fetchMovements:", error);
      toast.error("Failed to fetch movement history");
    }
  };

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from("warehouse_inventory")
        .select(`
          *,
          warehouses (name),
          products (name, sku)
        `);
      if (error) throw error;
      setWarehouseInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory");
    }
  };

  const checkAuthAndFetchData = async () => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("Please sign in to view warehouses");
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      await Promise.all([
        fetchWarehouses(userData.id),
        fetchProducts(userData.id),
        fetchInventory(),
        fetchMovements(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchWarehouses = async (clientId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to fetch warehouses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignStock = async (quantity: number) => {
    if (!selectedWarehouse || !selectedProduct) {
      toast.error("Please select a warehouse and product");
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        toast.error("Please sign in to assign stock");
        return;
      }
      const userData = JSON.parse(currentUser);

      // Get product details for the movement record
      const selectedProductDetails = products.find(
        (p) => p.id === selectedProduct
      );
      const selectedWarehouseDetails = warehouses.find(
        (w) => w.id === selectedWarehouse
      );

      console.log("Starting stock assignment:", {
        warehouse: selectedWarehouseDetails?.name,
        product: selectedProductDetails?.name,
        quantity,
        userId: userData.id,
      });

      // Check if inventory record already exists
      const { data: existingInventory, error: checkError } = await supabase
        .from("warehouse_inventory")
        .select("quantity")
        .eq("warehouse_id", selectedWarehouse)
        .eq("product_id", selectedProduct)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error checking existing inventory:", checkError);
        throw checkError;
      }

      // 1. Insert or update warehouse_inventory
      if (existingInventory) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("warehouse_inventory")
          .update({
            quantity: existingInventory.quantity + quantity,
            status: "assigned",
            assigned_at: new Date().toISOString(),
          })
          .eq("warehouse_id", selectedWarehouse)
          .eq("product_id", selectedProduct);

        if (updateError) {
          console.error("Error updating inventory record:", updateError);
          throw updateError;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("warehouse_inventory")
          .insert([
            {
              warehouse_id: selectedWarehouse,
              product_id: selectedProduct,
              quantity,
              status: "assigned",
              assigned_at: new Date().toISOString(),
              client_id: userData.id,
            },
          ]);

        if (insertError) {
          console.error("Error creating inventory record:", insertError);
          throw insertError;
        }
      }

      // 2. Record the movement in inventory_movements
      const movementData = {
        id: crypto.randomUUID(),
        warehouse_id: selectedWarehouse,
        product_id: selectedProduct,
        quantity,
        movement_type: "in",
        reference_number: `ASSIGN-${Date.now()}`,
        notes: `Assigned ${quantity} units of ${
          selectedProductDetails?.name || "product"
        } to ${selectedWarehouseDetails?.name || "warehouse"}`,
        performed_by: userData.email || "System",
        timestamp: new Date().toISOString(),
        client_id: userData.id,
      };

      console.log("Creating movement record:", movementData);

      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert([movementData]);

      if (movementError) {
        console.error("Error creating movement record:", movementError);
        throw movementError;
      }

      console.log("Stock assignment completed successfully");

      setShowAssignDialog(false);
      toast.success("Stock assigned successfully!");

      // Refresh both tables
      await Promise.all([fetchInventory(), fetchMovements()]);
    } catch (error) {
      console.error("Error in handleAssignStock:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to assign stock");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setSelectedQuantity(value);
    }
  };

  // Filter and pagination logic
  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredWarehouses.length / ITEMS_PER_PAGE);
  const paginatedWarehouses = filteredWarehouses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Add handler for updating warehouse location
  const handleUpdateWarehouseLocation = async () => {
    if (!editingLocationWarehouse) return;
    setIsUpdatingLocation(true);
    try {
      // Geocode the new address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          newLocation
        )}&limit=1`
      );
      const locationData = await response.json();
      if (!locationData || locationData.length === 0) {
        toast.error("Invalid location. Please enter a valid address.");
        setIsUpdatingLocation(false);
        return;
      }
      const coords = [
        parseFloat(locationData[0].lat),
        parseFloat(locationData[0].lon),
      ];
      // Prevent saving if coordinates are default London
      if (coords[0] === 51.5074 && coords[1] === -0.1278) {
        toast.error("Please enter a unique location, not the default.");
        setIsUpdatingLocation(false);
        return;
      }
      // Update in Supabase
      const { error } = await supabase
        .from("warehouses")
        .update({ location: newLocation, coordinates: coords })
        .eq("id", editingLocationWarehouse.id);
      if (error) throw error;
      toast.success("Warehouse location updated!");
      setEditingLocationWarehouse(null);
      setNewLocation("");
      await fetchWarehouses(editingLocationWarehouse.client_id);
    } catch (error) {
      toast.error("Failed to update location.");
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleAddWarehouse = async (data: WarehouseFormData) => {
    try {
      setIsLoading(true);
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        toast.error("Please sign in to add a warehouse");
        return;
      }
      const userData = JSON.parse(currentUser);

      // Geocode the address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          data.location
        )}&limit=1`
      );
      const locationData = await response.json();
      if (!locationData || locationData.length === 0) {
        toast.error(
          "Invalid address. Please enter a valid, full warehouse address."
        );
        return;
      }
      const coords = [
        parseFloat(locationData[0].lat),
        parseFloat(locationData[0].lon),
      ];

      const { error } = await supabase.from("warehouses").insert([
        {
          client_id: userData.id,
          name: data.name,
          location: data.location,
          capacity: data.capacity,
          manager: data.manager,
          coordinates: coords,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      await fetchWarehouses(userData.id);
      toast.success("Warehouse added successfully!");
    } catch (error) {
      console.error("Error adding warehouse:", error);
      toast.error("Failed to add warehouse");
    } finally {
      setIsLoading(false);
      setShowAddDialog(false);
    }
  };

  const handleEditWarehouse = async (data: WarehouseFormData) => {
    if (!editingWarehouse) return;

    try {
      setIsLoading(true);
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        toast.error("Please sign in to edit a warehouse");
        return;
      }
      const userData = JSON.parse(currentUser);

      // Geocode the address if it was changed
      let coordinates = editingWarehouse.coordinates;
      if (data.location !== editingWarehouse.location) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            data.location
          )}&limit=1`
        );
        const locationData = await response.json();
        if (!locationData || locationData.length === 0) {
          toast.error(
            "Invalid address. Please enter a valid, full warehouse address."
          );
          return;
        }
        coordinates = [
          parseFloat(locationData[0].lat),
          parseFloat(locationData[0].lon),
        ];
      }

      const { error } = await supabase
        .from("warehouses")
        .update({
          name: data.name,
          location: data.location,
          capacity: data.capacity,
          manager: data.manager,
          coordinates: coordinates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingWarehouse.id)
        .eq("client_id", userData.id);

      if (error) throw error;

      // Update the warehouse in the local state
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === editingWarehouse.id
            ? {
                ...w,
                name: data.name,
                location: data.location,
                capacity: data.capacity,
                manager: data.manager,
                coordinates: coordinates,
                updated_at: new Date().toISOString(),
              }
            : w
        )
      );

      setEditingWarehouse(null);
      toast.success("Warehouse updated successfully!");
    } catch (error) {
      console.error("Error updating warehouse:", error);
      toast.error("Failed to update warehouse");
    } finally {
      setIsLoading(false);
    }
  };

  const validLocations = warehouses
    .filter(
      (w) =>
        Array.isArray(w.coordinates) &&
        w.coordinates.length === 2 &&
        w.coordinates.every((coord) => typeof coord === "number")
    )
    .map((w) => ({
      id: w.id,
      name: w.name,
      coordinates: w.coordinates,
      location: w.location,
    }));
  console.log("Map locations:", validLocations);

  return (
    <AnimatedGradientBackground className="min-h-screen">
      <AIParticleEffect particleColor="#3456FF" density="low" />

      <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 relative min-h-screen">
        {/* Page Header with enhanced styling */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              Warehouse Management
            </h1>
            <p className="text-gray-500 mt-1 font-sans text-sm sm:text-base">
              Manage your warehouse locations and inventory
            </p>
          </div>
        </div>

        {/* Tabs for Warehouse Organization and Visualization */}
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-gray-50/80 rounded-xl overflow-hidden p-1 border border-gray-100 backdrop-blur-sm">
            <TabsTrigger
              value="organization"
              className="text-sm py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3456FF] data-[state=active]:to-[#8763FF] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-medium"
            >
              Warehouse Organization
            </TabsTrigger>
            <TabsTrigger
              value="visualization"
              className="text-sm py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3456FF] data-[state=active]:to-[#8763FF] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-medium"
            >
              Warehouse Visualization
            </TabsTrigger>
          </TabsList>

          {/* Warehouse Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            {/* Warehouse Map at the top */}
            <div className="w-full mb-6">
              <div
                className="rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white/80 backdrop-blur-sm"
                style={{ minHeight: "250px", height: "40vw", maxHeight: 400 }}
              >
                <WarehouseMap locations={validLocations} />
              </div>
              {validLocations.length === 0 && (
                <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                  <strong>
                    No warehouses with valid coordinates to show on the map.
                  </strong>
                  <br />
                  Please add or edit a warehouse and set its location.
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Add Warehouse Button */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md font-medium"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-md">
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shimmer" />
                  </div>
                  <Plus className="mr-2 h-4 w-4" /> Add Warehouse
                </Button>
              </div>

                    {/* Search & Filter with glass effect */}
              <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-2 sm:p-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all text-sm sm:text-base"
            />
          </div>
        </div>

              {/* Warehouses Table with enhanced styling */}
              <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-2 sm:p-5 overflow-x-auto relative">
          {/* Background patterns */}
          <div className="absolute inset-0 bg-circuit-pattern opacity-5 pointer-events-none"></div>

          <div className="min-w-[600px] sm:min-w-0">
            <Table className="w-full text-xs sm:text-sm">
              <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Location
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Manager
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Capacity
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-16 text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-20 h-20 rounded-lg bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center animate-pulse-slow">
                          <Building2 className="h-10 w-10 text-[#3456FF]" />
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3456FF]/0 via-[#3456FF]/30 to-[#3456FF]/0 rounded-lg opacity-50 animate-scan"></div>
                        </div>
                        <p className="font-sans text-lg">No warehouses found</p>
                        <p className="font-sans text-sm max-w-md text-center text-gray-400">
                          Add a new warehouse to get started with inventory
                          management
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWarehouses.map((warehouse) => (
                    <TableRow
                      key={warehouse.id}
                      className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors group"
                    >
                      <TableCell className="font-medium font-sans group-hover:text-[#3456FF] transition-colors">
                        {warehouse.name}
                      </TableCell>
                      <TableCell
                        className="font-sans max-w-[200px] truncate"
                        title={warehouse.location}
                      >
                        {warehouse.location}
                      </TableCell>
                      <TableCell className="font-sans">
                        {warehouse.manager}
                      </TableCell>
                      <TableCell className="font-sans whitespace-nowrap">
                        <span className="font-mono text-sm">
                          {formatNumber(warehouse.capacity)}
                        </span>{" "}
                        units
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            warehouse.status === "active"
                              ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 hover:bg-green-100 border-green-200"
                              : "bg-gradient-to-r from-red-100 to-red-50 text-red-800 hover:bg-red-100 border-red-200"
                          }
                        >
                          <span className="relative flex h-2 w-2 mr-1.5">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                warehouse.status === "active"
                                  ? "bg-green-400"
                                  : "bg-red-400"
                              } opacity-75`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${
                                warehouse.status === "active"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></span>
                          </span>
                          <span className="font-sans">{warehouse.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-[#3456FF] hover:bg-[#3456FF]/5 transition-colors"
                          onClick={() => setEditingWarehouse(warehouse)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => setDeletingWarehouseId(warehouse.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setEditingLocationWarehouse(warehouse);
                            setNewLocation(warehouse.location);
                          }}
                        >
                          <span className="sr-only">Edit Location</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487a5.25 5.25 0 11-9.724 0M12 2.25v9.75m0 0c-3.728 0-6.75 2.343-6.75 5.25v.75a.75.75 0 00.75.75h12a.75.75 0 00.75-.75v-.75c0-2.907-3.022-5.25-6.75-5.25z"
                            />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination with updated styling */}
          {filteredWarehouses.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-5 px-2 pt-2 border-t border-gray-100 gap-2">
              <div className="text-xs sm:text-sm text-gray-500 font-sans">
                {`Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="h-8 px-3 border-gray-200 bg-white hover:bg-gray-50 hover:border-[#3456FF]/30 text-gray-600 font-sans transition-colors w-1/2 sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 border-gray-200 bg-white hover:bg-gray-50 hover:border-[#3456FF]/30 text-gray-600 font-sans transition-colors w-1/2 sm:w-auto"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stock Movement History with enhanced styling */}
        <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-5 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-[#3456FF] to-[#8763FF]"></div>
          <div className="absolute right-0 top-0 w-1/4 h-full bg-gradient-to-br from-[#3456FF]/3 to-transparent pointer-events-none"></div>

          <h2 className="text-xl font-heading font-semibold text-gray-800 mb-4 pl-3 flex items-center">
            <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              Stock Movement History
            </span>
          </h2>

          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Warehouse
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Product
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Quantity
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Reference
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Performed By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-gray-500 font-sans"
                    >
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 animate-pulse-slow"></div>
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <p className="font-sans">No movement history found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  stockMovements.map((movement) => (
                    <TableRow
                      key={movement.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <TableCell className="font-sans whitespace-nowrap text-sm">
                        {new Date(movement.timestamp).toLocaleString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </TableCell>
                      <TableCell className="font-sans">
                        {movement.warehouses?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="font-sans">
                        {movement.products?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {movement.products?.sku || "Unknown"}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {movement.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            movement.movement_type === "in"
                              ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                              : movement.movement_type === "out"
                              ? "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200"
                              : "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200"
                          }
                        >
                          <span className="font-sans">
                            {movement.movement_type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {movement.reference_number}
                      </TableCell>
                      <TableCell className="font-sans text-sm">
                        {movement.performed_by}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Available Products with enhanced styling */}
        <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-bl from-[#3456FF]/5 to-transparent -z-5"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#3456FF]/5 rounded-full blur-3xl"></div>

          <h2 className="text-xl font-heading font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
            <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              Available Products
            </span>
          </h2>

          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Condition
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Available Quantity
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Price
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 font-heading text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-gray-500 font-sans"
                    >
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 animate-pulse-slow"></div>
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <p className="font-sans">No products available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors group"
                    >
                      <TableCell className="font-medium font-sans group-hover:text-[#3456FF] transition-colors">
                        {product.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-sans">
                        <Badge
                          variant="outline"
                          className="bg-gray-100/80 text-gray-800 backdrop-blur-sm border-gray-200"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.condition === "New"
                              ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                              : product.condition === "Like New"
                              ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200"
                              : "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-200"
                          }
                        >
                          <span className="font-sans">{product.condition}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {product.quantity}
                          </span>
                          {product.quantity < 10 && (
                            <Badge
                              variant="outline"
                              className="bg-red-100/80 text-red-800 border-red-200 text-xs py-0 px-1.5"
                            >
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-sans">
                        <span className="font-mono font-medium text-gray-900">
                          £{product.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                        >
                          <span className="relative flex h-2 w-2 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="font-sans">{product.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWarehouse("");
                            setSelectedProduct(product.id);
                            setSelectedQuantity(1);
                            setShowAssignDialog(true);
                          }}
                          className="h-8 text-xs border-[#3456FF]/30 text-[#3456FF] hover:bg-[#3456FF]/5 font-sans transition-all hover:scale-105 active:scale-95"
                        >
                          <span className="relative overflow-hidden">
                            <span className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shimmer" />
                          </span>
                          Assign to Warehouse
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
            </div>
          </TabsContent>

          {/* Warehouse Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <div className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <h1 className="text-4xl font-bold text-gray-800">Hello World</h1>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Warehouse Dialog with enhanced styling */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[600px] glass-card border-gray-200 max-h-[90vh] overflow-y-auto p-4 md:p-8">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="absolute -z-10 top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-[#3456FF]/10 to-transparent blur-xl"></div>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                Add New Warehouse
              </DialogTitle>
            </DialogHeader>
            <WarehouseForm
              onSubmit={handleAddWarehouse}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Warehouse Dialog with enhanced styling */}
        <Dialog
          open={!!editingWarehouse}
          onOpenChange={(open) => !open && setEditingWarehouse(null)}
        >
          <DialogContent className="sm:max-w-[600px] glass-card border-gray-200 max-h-[90vh] overflow-y-auto p-4 md:p-8">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="absolute -z-10 top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-[#3456FF]/10 to-transparent blur-xl"></div>

            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                Edit Warehouse
              </DialogTitle>
            </DialogHeader>

            {editingWarehouse && (
              <WarehouseForm
                onSubmit={handleEditWarehouse}
                initialData={{
                  name: editingWarehouse.name,
                  location: editingWarehouse.location,
                  capacity: editingWarehouse.capacity,
                  manager: editingWarehouse.manager,
                }}
                isLoading={isLoading}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog with enhanced styling */}
        <AlertDialog
          open={!!deletingWarehouseId}
          onOpenChange={(open) => !open && setDeletingWarehouseId(null)}
        >
          <AlertDialogContent className="glass-card border-gray-200 max-w-md">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/3 via-transparent to-[#8763FF]/3 rounded-lg opacity-30"></div>

            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-heading font-semibold text-gray-900">
                Confirm Deletion
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription className="font-sans text-gray-700">
              Are you sure you want to delete this warehouse? This action cannot
              be undone and all inventory data associated with this warehouse
              will be lost.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-sans border-gray-200 bg-white hover:bg-gray-50">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteWarehouse}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 font-sans font-medium transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Product Dialog with enhanced styling */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-[600px] glass-card border-gray-200 max-h-[90vh] overflow-y-auto p-4 md:p-8">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="absolute -z-10 bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-[#3456FF]/10 to-transparent blur-xl"></div>

            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                Assign Products to Warehouse
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-sans">
                  Select Warehouse
                </label>
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all">
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg font-sans max-h-[300px] overflow-y-auto">
                    {warehouses.map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={warehouse.id}
                        className="font-sans focus:bg-[#3456FF]/5"
                      >
                        {warehouse.name} - {warehouse.location.split(",")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-sans">
                  Product Quantities
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto p-3 rounded-lg bg-gray-50/80 backdrop-blur-sm border border-gray-200 custom-scrollbar">
                  {products.filter((p) => selectedProduct === p.id).length ===
                  0 ? (
                    <div className="text-center flex flex-col items-center text-gray-500 py-5 font-sans space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 animate-pulse-slow rounded-full"></div>
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <p>No products selected</p>
                    </div>
                  ) : (
                    products
                      .filter((product) => selectedProduct === product.id)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-md border border-gray-200 bg-white hover:border-[#3456FF]/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 font-sans">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {product.sku}
                            </p>
                          </div>
                          <div className="flex items-center w-32">
                            <label className="sr-only">Quantity</label>
                            <Input
                              type="number"
                              min="1"
                              max={product.quantity}
                              value={selectedQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (isNaN(val) || val < 1) {
                                  setSelectedQuantity(1);
                                  return;
                                }

                                setSelectedQuantity(
                                  Math.min(val, product.quantity)
                                );
                              }}
                              className="w-full border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"
                            />
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                  className="font-sans border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={
                    !selectedWarehouse || selectedQuantity === 0 || isLoading
                  }
                  onClick={() => handleAssignStock(selectedQuantity)}
                  className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 font-sans font-medium transition-all"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-md">
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shimmer" />
                  </div>
                  {isLoading ? "Assigning..." : "Assign Stock"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Location Dialog with enhanced styling */}
        <Dialog
          open={!!editingLocationWarehouse}
          onOpenChange={(open) => !open && setEditingLocationWarehouse(null)}
        >
          <DialogContent className="sm:max-w-[400px] glass-card border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-heading font-bold">
                Edit Warehouse Location
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Enter new address/location"
                className="w-full"
              />
              <Button
                onClick={handleUpdateWarehouseLocation}
                disabled={isUpdatingLocation || !newLocation.trim()}
                className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
              >
                {isUpdatingLocation ? "Updating..." : "Update Location"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedGradientBackground>
  );
}
