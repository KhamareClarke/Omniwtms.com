// @ts-nocheck

"use client";



import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import * as XLSX from "xlsx";

import { toast, Toaster } from "react-hot-toast";

import {

  Plus,

  Upload,

  Pencil,

  Trash2,

  Truck,

  Download,

  Check,

  RefreshCw,

  Edit,

  FileText,

  Package,

  ArrowRight,

} from "lucide-react";

import { supabase } from "@/lib/auth/SupabaseClient";

import jsPDF from "jspdf";

import "jspdf-autotable";

import JsBarcode from "jsbarcode";

import { useForm } from "react-hook-form";



// Import your UI components

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import {

  Dialog,

  DialogContent,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

  DialogClose,

  DialogDescription,

} from "@/components/ui/dialog";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";



// Constants

const CATEGORIES = [

  "Container load",

  "Truck loads",

  "Pallets",

  "Boxes",

  "Returns",

  "Waste removal",

  "Asset removal",

];

const CONDITIONS = ["New", "Like New", "Used", "Refurbished", "For Parts"];



// Types

interface Product {

  id: string | number;

  client_id: string;

  name: string;

  sku: string;

  barcode: string;

  price: number;

  quantity: number;

  category: string;

  condition: string;

  height: number | null;

  weight: number | null;

  dimensions: string | null;

  length?: number | null;

  width?: number | null;

  status: "pending" | "saved";

  selected?: boolean;

}



interface UploadedProduct extends Omit<Product, "id"> {

  id?: number;

}



interface ShippingLabel {

  packageId: string;

  products: Array<{

    name: string;

    quantity: number;

    dimensions: string | null;

    weight: number | null;

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

  status: string;

  // ... add other delivery fields as needed

}



// Add new interface for barcode download options

interface BarcodeDownloadOptions {

  format: "image" | "pdf";

  selectedProducts: Product[];

}



// Main component

export default function InventoriesPage() {

  console.log("InventoriesPage mounted");

  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);

  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<{

    id: string;

    email: string;

  } | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [lastDeliveryDetails, setLastDeliveryDetails] =

    useState<ShippingLabel | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const [deliveryType, setDeliveryType] = useState<"client" | "warehouse">(

    "client"

  );

  const [deliveryFormData, setDeliveryFormData] = useState({

    source_warehouse_id: "",

    destination_warehouse_id: "",

    pickup_time: "",

    client_address: "",

    notes: "",

    priority: "medium",

  });

  const [couriers, setCouriers] = useState<

    {

      id: string;

      name: string;

      vehicle_type: string;

      phone: string;

      client_id: string;

    }[]

  >([]);

  const [warehouses, setWarehouses] = useState<

    { id: string; location: string; client_id: string }[]

  >([]);

  const [editingWarehouseItem, setEditingWarehouseItem] = useState<any | null>(

    null

  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const [truckArrivals, setTruckArrivals] = useState<any[]>([]);

  const [truckItems, setTruckItems] = useState<any[]>([]);

  const [editingTruckItem, setEditingTruckItem] = useState<any | null>(null);
  const [showMoveToSectionDialog, setShowMoveToSectionDialog] = useState(false);
  const [showBulkMoveToSectionDialog, setShowBulkMoveToSectionDialog] = useState(false);
  const [productToMove, setProductToMove] = useState<Product | null>(null);
  const [warehouseLayouts, setWarehouseLayouts] = useState<any[]>([]);
  const [warehousesForMove, setWarehousesForMove] = useState<any[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [selectedWarehouseForMove, setSelectedWarehouseForMove] = useState<string>("");
  const [selectedLayoutForMove, setSelectedLayoutForMove] = useState<string>("");
  const [selectedSectionForMove, setSelectedSectionForMove] = useState<string>("");
  const [moveQuantity, setMoveQuantity] = useState<number>(1);
  const [bulkMoveQuantities, setBulkMoveQuantities] = useState<Record<string, number>>({});
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [availableLayouts, setAvailableLayouts] = useState<any[]>([]);

  const [showDeleteTruckDialog, setShowDeleteTruckDialog] = useState(false);

  const [truckItemToDelete, setTruckItemToDelete] = useState<any | null>(null);

  const [labelItem, setLabelItem] = useState<any | null>(null);

  // Add currency state with default as GBP instead of USD

  const [currency, setCurrency] = useState<"USD" | "GBP">("GBP");

  const [selectedCourierData, setSelectedCourierData] = useState<string>("");

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const [showAssignDeliveryDialog, setShowAssignDeliveryDialog] =

    useState(false);

  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);

  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);



  // Exchange rate - this would ideally come from an API

  const exchangeRate = 0.79; // 1 USD = 0.79 GBP (approximate)



  // Function to format price based on selected currency

  const formatPrice = (price: number) => {

    if (currency === "USD") {

      // Convert from GBP to USD and format

      const usdPrice = price / exchangeRate;

      return `$${usdPrice.toFixed(2)}`;

    } else {

      // Display the price in GBP directly

      return `£${price.toFixed(2)}`;

    }

  };



  // Toggle currency function

  const toggleCurrency = () => {

    setCurrency((prev) => (prev === "USD" ? "GBP" : "USD"));

  };



  // Move this function to top-level scope

  const fetchTruckItemsWithArrival = async () => {

    if (!currentUser) {

      console.log("No current user, skipping fetch");

      return;

    }



    console.log("Fetching truck items for client:", currentUser.id);

    const { data, error } = await supabase

      .from("warehouse_items")

      .select(

        `

        *,

        truck_arrival:truck_arrival_id (

          vehicle_registration,

          customer_name,

          driver_name,

          vehicle_size,

          load_type,

          arrival_time,

          warehouse_id

        )

      `

      )

      .eq("client_id", currentUser.id)

      .order("created_at", { ascending: false });



    if (error) {

      console.error("Error fetching truck_items with arrival:", error);

    } else {

      console.log("Fetched truck items:", data);

      // Transform the data to match our table structure

      const transformedData = data.map((item) => ({

        ...item,

        truck_arrival: item.truck_arrival,

      }));

      setTruckItems(transformedData);

      console.log("Updated truckItems state:", transformedData);

    }

  };



  // Fetch current user and their products

  useEffect(() => {

    const fetchUserAndProducts = async () => {

      try {

        const userStr = localStorage.getItem("currentUser");

        if (!userStr) {

          router.push("/auth/login");

          return;

        }



        const user = JSON.parse(userStr);

        setCurrentUser(user);



        // Fetch products for current user from Supabase

        const { data: userProducts, error } = await supabase

          .from("products")

          .select("*")

          .eq("client_id", user.id)

          .order("created_at", { ascending: false });



        if (error) throw error;



        // Add selected state to each product in UI

        setProducts(

          userProducts.map((product) => ({

            ...product,

            status: "saved",

            selected: false, // Add selected state only in UI

          }))

        );

      } catch (error) {

        console.error("Error fetching products:", error);

        toast.error("Failed to load products");

      } finally {

        setLoading(false);

      }

    };



    fetchUserAndProducts();

  }, [router]);



  // Fetch warehouse items

  // Fetch warehouse layouts and sections
  const fetchWarehouseLayouts = async () => {
    try {
      setLoadingWarehouses(true);
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) {
        console.error("No user found in localStorage");
        setLoadingWarehouses(false);
        return;
      }

      const user = JSON.parse(userStr);

      // Fetch warehouses for the user
      const { data: warehousesData, error: warehousesError } = await supabase
        .from("warehouses")
        .select("id, name, location")
        .eq("client_id", user.id);

      if (warehousesError) {
        console.error("Error fetching warehouses:", warehousesError);
        toast.error("Failed to load warehouses");
        setLoadingWarehouses(false);
        return;
      }

      if (!warehousesData || warehousesData.length === 0) {
        console.log("No warehouses found for user");
        setWarehousesForMove([]);
        setWarehouseLayouts([]);
        setLoadingWarehouses(false);
        toast.info("No warehouses found. Please create a warehouse first.");
        return;
      }

      console.log("Warehouses found:", warehousesData);
      setWarehousesForMove(warehousesData);

      // Fetch layouts for all warehouses
      const warehouseIds = warehousesData.map((w) => w.id);
      const { data: layoutsData, error: layoutsError } = await supabase
        .from("warehouse_layouts")
        .select("id, warehouse_id, grid_rows, grid_columns, created_at")
        .in("warehouse_id", warehouseIds)
        .order("created_at", { ascending: false });

      if (layoutsError) {
        console.error("Error fetching layouts:", layoutsError);
        // Don't throw - we still want to show warehouses even without layouts
      }

      // Fetch sections for each layout
      const layoutsWithSections = await Promise.all(
        (layoutsData || []).map(async (layout) => {
          const { data: sectionsData, error: sectionsError } = await supabase
            .from("warehouse_sections")
            .select("id, section_name, section_type, capacity, current_usage, is_blocked, row_index, column_index")
            .eq("layout_id", layout.id)
            .order("section_name");

          if (sectionsError) {
            console.error("Error fetching sections:", sectionsError);
          }

          const warehouse = warehousesData.find((w) => w.id === layout.warehouse_id);

          return {
            ...layout,
            warehouse_name: warehouse?.name || warehouse?.location || "Unknown",
            warehouse_location: warehouse?.location || "",
            sections: sectionsData || [],
          };
        })
      );

      setWarehouseLayouts(layoutsWithSections || []);
    } catch (error) {
      console.error("Error fetching warehouse layouts:", error);
      toast.error("Failed to load warehouse sections");
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Handle warehouse selection change - show layouts for that warehouse
  useEffect(() => {
    if (selectedWarehouseForMove) {
      const layoutsForWarehouse = warehouseLayouts.filter(
        (layout) => layout.warehouse_id === selectedWarehouseForMove
      );
      setAvailableLayouts(layoutsForWarehouse);
      setSelectedLayoutForMove("");
      setAvailableSections([]);
      setSelectedSectionForMove("");
    } else {
      setAvailableLayouts([]);
      setSelectedLayoutForMove("");
      setAvailableSections([]);
      setSelectedSectionForMove("");
    }
  }, [selectedWarehouseForMove, warehouseLayouts]);

  // Handle layout selection change - show sections for that layout
  useEffect(() => {
    if (selectedLayoutForMove) {
      const selectedLayout = warehouseLayouts.find(
        (layout) => layout.id === selectedLayoutForMove
      );
      setAvailableSections(selectedLayout?.sections || []);
      setSelectedSectionForMove("");
    } else {
      setAvailableSections([]);
      setSelectedSectionForMove("");
    }
  }, [selectedLayoutForMove, warehouseLayouts]);

  // Move inventory to section
  const handleMoveToSection = async () => {
    if (!productToMove || !selectedSectionForMove || moveQuantity <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }

    if (moveQuantity > productToMove.quantity) {
      toast.error("Quantity cannot exceed available stock");
      return;
    }

    try {
      setLoading(true);

      // Check if product already exists in this section
      const { data: existingInventory, error: checkError } = await supabase
        .from("section_inventory")
        .select("id, quantity")
        .eq("section_id", selectedSectionForMove)
        .eq("product_id", productToMove.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from("section_inventory")
          .update({
            quantity: existingInventory.quantity + moveQuantity,
          })
          .eq("id", existingInventory.id);

        if (updateError) throw updateError;
      } else {
        // Create new inventory entry
        const { error: insertError } = await supabase
          .from("section_inventory")
          .insert({
            section_id: selectedSectionForMove,
            product_id: productToMove.id,
            quantity: moveQuantity,
            notes: `Moved from inventory dashboard`,
          });

        if (insertError) throw insertError;
      }

      // Update product quantity in products table
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({
          quantity: productToMove.quantity - moveQuantity,
        })
        .eq("id", productToMove.id);

      if (productUpdateError) throw productUpdateError;

      // Refresh products list
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        const user = JSON.parse(userStr);
        const { data: updatedProducts, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (!fetchError && updatedProducts) {
          setProducts(
            updatedProducts.map((product) => ({
              ...product,
              status: "saved",
              selected: false,
            }))
          );
        }
      }

      toast.success(`Moved ${moveQuantity} ${productToMove.name} to warehouse section`);
      setShowMoveToSectionDialog(false);
      setProductToMove(null);
      setSelectedWarehouseForMove("");
      setSelectedSectionForMove("");
      setMoveQuantity(1);
    } catch (error) {
      console.error("Error moving inventory:", error);
      toast.error("Failed to move inventory to section");
    } finally {
      setLoading(false);
    }
  };

  // Bulk move inventory to section
  const handleBulkMoveToSection = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0 || !selectedSectionForMove) {
      toast.error("Please select products and a section");
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProducts) {
        const quantity = bulkMoveQuantities[product.id] || 1;
        
        if (quantity <= 0 || quantity > product.quantity) {
          errorCount++;
          continue;
        }

        try {
          // Check if product already exists in this section
          const { data: existingInventory, error: checkError } = await supabase
            .from("section_inventory")
            .select("id, quantity")
            .eq("section_id", selectedSectionForMove)
            .eq("product_id", product.id)
            .maybeSingle();

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existingInventory) {
            // Update existing inventory
            const { error: updateError } = await supabase
              .from("section_inventory")
              .update({
                quantity: existingInventory.quantity + quantity,
              })
              .eq("id", existingInventory.id);

            if (updateError) throw updateError;
          } else {
            // Create new inventory entry
            const { error: insertError } = await supabase
              .from("section_inventory")
              .insert({
                section_id: selectedSectionForMove,
                product_id: product.id,
                quantity: quantity,
                notes: `Bulk moved from inventory dashboard`,
              });

            if (insertError) throw insertError;
          }

          // Update product quantity in products table
          const { error: productUpdateError } = await supabase
            .from("products")
            .update({
              quantity: product.quantity - quantity,
            })
            .eq("id", product.id);

          if (productUpdateError) throw productUpdateError;
          successCount++;
        } catch (error) {
          console.error(`Error moving ${product.name}:`, error);
          errorCount++;
        }
      }

      // Refresh products list
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        const user = JSON.parse(userStr);
        const { data: updatedProducts, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (!fetchError && updatedProducts) {
          setProducts(
            updatedProducts.map((product) => ({
              ...product,
              status: "saved",
              selected: false,
            }))
          );
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully moved ${successCount} product(s) to warehouse section`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to move ${errorCount} product(s)`);
      }

      setShowBulkMoveToSectionDialog(false);
      setSelectedWarehouseForMove("");
      setSelectedSectionForMove("");
      setBulkMoveQuantities({});
    } catch (error) {
      console.error("Error in bulk move:", error);
      toast.error("Failed to move products to section");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseItems = async () => {

    if (!currentUser) {

      console.log("No current user, skipping fetch");

      return;

    }



    console.log("Fetching warehouse items for client:", currentUser.id);

    const { data, error } = await supabase

      .from("warehouse_items")

      .select(

        `

        *,

        truck_arrival:truck_arrival_id (

          vehicle_registration,

          customer_name,

          driver_name,

          vehicle_size,

          load_type,

          arrival_time,

          warehouse_id

        ),

        putaway:putaway_id (

          aisle,

          bay,

          level,

          position,

          label

        ),

        quality_check:quality_check_id (

          status,

          damage_image_url

        )

      `

      )

      .eq("client_id", currentUser.id)

      .order("created_at", { ascending: false });



    if (error) {

      console.error("Error fetching warehouse items:", error);

    } else {

      console.log("Fetched warehouse items:", data);

      // Transform the data to match our table structure

      const transformedData = data.flatMap((item) => ({

        ...item,

        truck_arrival: item.truck_arrival,

      }));

      setWarehouseItems(transformedData);

    }

  };



  useEffect(() => {

    if (currentUser) {

      fetchTruckItemsWithArrival();

      fetchWarehouseItems();

    }

  }, [currentUser]);



  // Generate UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Replace old SKU and barcode generators with new ones
  const generateSKU = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const microtime = performance.now().toString().replace('.', '');
    return `SKU${timestamp.slice(-8)}${random}${microtime.slice(-4)}`;
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const microtime = performance.now().toString().replace('.', '');
    return `BC${timestamp.slice(-8)}${random}${microtime.slice(-4)}`;
  };



  // Function to get warehouse name from ID

  const getWarehouseName = (warehouseId: string | undefined) => {

    if (!warehouseId) return "";

    // You would ideally fetch this from a list of warehouses

    // For now, we'll just return the ID as a placeholder

    return `Warehouse ${warehouseId.substring(0, 8)}`;

  };



  // Fix handleAddProduct to accept Omit<Product, 'id' | 'client_id' | 'sku' | 'barcode'>

  const handleAddProduct = async (

    productData: Omit<Product, "id" | "client_id" | "sku" | "barcode">

  ) => {

    try {

      const sku = generateSKU();

      const barcode = generateBarcode();

      const clientId = currentUser?.id || "";

      // Combine dimensions if all measurements are present

      const dimensions =

        productData.length && productData.width && productData.height

          ? `${productData.length}x${productData.width}x${productData.height} cm`

          : null;

      const { error } = await supabase.from("products").insert({

        ...productData,

        client_id: clientId,

        sku,

        barcode,

        dimensions,

      });

      if (error) throw error;

      const newProduct: Product = {

        ...productData,

        id: generateUUID(),

        client_id: clientId,

        sku,

        barcode,

        dimensions,

        status: "pending",

      };

      setProducts((prev) => [...prev, newProduct]);

      toast.success("Product added successfully");

    } catch (error) {

      console.error("Error adding product:", error);

      toast.error("Failed to add product");

    }

  };



  // Simple function to read Excel file - NO PARSING, keep everything as strings
  const readExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      // Validate file object
      if (!file || !(file instanceof File)) {
        reject(new Error("Invalid file object provided"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            header: 1,
          });

          if (jsonData.length < 2) {
            throw new Error("Excel file must have at least a header row and one data row");
          }

          // Normalize headers: remove spaces, periods, lowercase
          const headers = (jsonData[0] as string[]).map((header) =>
            header ? header.toString().replace(/\s|\./g, "").toLowerCase() : ""
          );

          // Map Excel columns to product data - NO PARSING, keep everything as strings
          const processedRows = jsonData.slice(1).map((row: any) => {
            const processedRow: any = {};
            headers.forEach((header, idx) => {
              const value = row[idx];
              if (value !== undefined && value !== null) {
                // Keep ALL data as strings - no parsing at all
                processedRow[header] = String(value);
              }
            });
            return processedRow;
          });

          resolve(processedRows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      
      try {
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(new Error("Failed to read file: " + (error as Error).message));
      }
    });
  };

  // Fix handleFileUpload to save Excel data exactly as provided - NO VALIDATION
  const handleFileUpload = async (file: File) => {
    try {
      console.log("File object received:", file); // Debug log
      console.log("File type:", typeof file); // Debug log
      console.log("Is File instance:", file instanceof File); // Debug log
      
      const data = await readExcelFile(file);
      console.log("Parsed data from file:", data); // Debug log
      
      // Accept ALL rows - no validation at all
      const validProducts = data.filter(
        (row: any) => row && Object.keys(row).length > 0
      );
      
      console.log("Valid products after filtering:", validProducts); // Debug log
      
      if (validProducts.length === 0) {
        toast.error("No data found in the file.");
        return;
      }
      
      const clientId = currentUser?.id || "";
      const productsToAdd: Product[] = validProducts.map((row: any, index: number) => ({
        name: String(row.name || row.productname || row.product_name || row.description || row.item || `Product ${index + 1}`),
        price: 0, // Set to 0 to avoid database errors
        quantity: 1, // Set to 1 to avoid database errors
        category: String(row.category || row.cat || row.type || "Other"),
        condition: String(row.condition || row.status || row.state || "New"),
        height: null,
        weight: null,
        length: null,
        width: null,
        client_id: clientId,
        sku: generateSKU(),
        barcode: generateBarcode(),
        status: "pending",
        id: generateUUID(),
        dimensions: null,
      }));
      
      const { error } = await supabase
        .from("products")
        .insert(productsToAdd.map(({ id, ...rest }) => rest));
      if (error) throw error;
      setProducts((prev) => [...prev, ...productsToAdd]);
      toast.success(`${validProducts.length} products added successfully from Excel file`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file: " + (error as Error).message);
    }
  };



  const handleCategoryChange = (value: string, index: number) => {

    const updatedProducts = [...products];

    updatedProducts[index] = {

      ...updatedProducts[index],

      category: value,

    };

    setProducts(updatedProducts);

  };



  const handleConditionChange = (value: string, index: number) => {

    const updatedProducts = [...products];

    updatedProducts[index] = {

      ...updatedProducts[index],

      condition: value,

    };

    setProducts(updatedProducts);

  };



  const handleSaveProduct = async (product: Product) => {

    try {

      const userStr = localStorage.getItem("currentUser");

      if (!userStr) {

        toast.error("Please log in first");

        return;

      }

      const user = JSON.parse(userStr);



      if (!product.category || !product.condition) {

        toast.error("Please select both category and condition");

        return;

      }



      if (product.weight && (isNaN(product.weight) || product.weight < 0)) {

        toast.error("Please enter a valid weight");

        return;

      }



      // Combine dimensions if all measurements are present

      const dimensions =

        product.length && product.width && product.height

          ? `${product.length}x${product.width}x${product.height} cm`

          : null;



      const productData = {

        client_id: user.id,

        name: product.name,

        sku: product.sku,

        price: product.price,

        quantity: product.quantity,

        category: product.category,

        condition: product.condition,

        height: product.height,

        weight: product.weight,

        dimensions: dimensions,

        status: "saved" as const,

      };



      const { data, error } = await supabase

        .from("products")

        .insert([productData])

        .select()

        .single();



      if (error) throw error;



      setProducts((prev) =>

        prev.map((p) =>

          p.sku === product.sku ? { ...data, status: "saved" } : p

        )

      );



      toast.success("Product saved successfully");

    } catch (error) {

      console.error("Error saving product:", error);

      toast.error("Failed to save product");

    }

  };



  const handleEditProduct = async (productData: any) => {

    try {

      if (!productData.id) {
        toast.error("Product ID is missing. Cannot update product.");
        return;
      }

      // Combine dimensions if all measurements are present

      const dimensions =

        productData.length && productData.width && productData.height

          ? `${productData.length}x${productData.width}x${productData.height} cm`

          : null;



      const { error } = await supabase

        .from("products")

        .update({

          name: productData.name,

          price: productData.price,

          quantity: productData.quantity,

          category: productData.category,

          condition: productData.condition,

          height: productData.height || null,

          weight: productData.weight || null,

          dimensions: dimensions,

          length: productData.length || null,

          width: productData.width || null,

        })

        .eq("id", productData.id);



      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      // Reload products from database to ensure we have the latest data
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        const { data: updatedProducts, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("client_id", userData.id)
          .order("created_at", { ascending: false });

        if (!fetchError && updatedProducts) {
          // Add selected state to each product (same as fetchUserAndProducts)
          setProducts(
            updatedProducts.map((product) => ({
              ...product,
              status: "saved",
              selected: false,
            }))
          );
        } else if (fetchError) {
          console.error("Error reloading products:", fetchError);
        }
      }

      setEditingProduct(null);

      toast.success("Product updated successfully");

    } catch (error) {

      console.error("Error updating product:", error);

      toast.error("Failed to update product");

    }

  };



  const handleDeleteProduct = async (productId: string | number) => {

    if (!confirm("Are you sure you want to delete this product?")) {

      return;

    }



    try {

      const { error } = await supabase

        .from("products")

        .delete()

        .eq("id", productId);



      if (error) throw error;



      setProducts((prev) => prev.filter((p) => p.id !== productId));

      toast.success("Product deleted successfully");

    } catch (error) {

      console.error("Error deleting product:", error);

      toast.error("Failed to delete product");

    }

  };

  // Bulk delete function
  const handleBulkDeleteProducts = async () => {
    try {
      const selectedProductIds = selectedProducts.map(p => p.id);
      
      // Delete all selected products at once
      const { data, error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProductIds)
        .select();

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      console.log("Deleted products:", data);

      // Update UI to remove deleted products
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
      setSelectedProducts([]);
      setShowBulkDeleteDialog(false);
      
      toast.success(`${selectedProductIds.length} products deleted successfully`);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete products: " + (error as Error).message);
    }
  };



  const handleAssignDelivery = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);



    try {

      // Get the selected courier and warehouse

      const selectedCourier = selectedCourierData;



      // Update warehouse products

      const updatedWarehouseProducts = warehouseProducts.map((wp: Product) => ({

        ...wp,

        quantity: wp.product_id ? wp.quantity - 1 : wp.quantity,

      }));

      setWarehouseProducts(updatedWarehouseProducts);



      // Create new delivery

      const newDelivery = {

        id: `del-${Date.now()}`,

        courier_id: selectedCourier,

        status: "assigned",

      };



      // Update deliveries state

      setDeliveries((prevDeliveries: Delivery[]) => [

        ...prevDeliveries,

        newDelivery,

      ]);



      // Close dialog and reset form

      setShowAssignDeliveryDialog(false);

      setDeliveryFormData({

        source_warehouse_id: "",

        destination_warehouse_id: "",

        pickup_time: "",

        client_address: "",

        notes: "",

        priority: "medium",

      });



      toast.success("Delivery assigned successfully");

    } catch (error) {

      console.error("Error assigning delivery:", error);

      toast.error("Failed to assign delivery");

    } finally {

      setLoading(false);

    }

  };



  // Edit warehouse item

  const handleEditWarehouseItem = async (updates: any) => {

    if (!editingWarehouseItem) return;

    const { error } = await supabase

      .from("warehouse_items")

      .update(updates)

      .eq("id", editingWarehouseItem.id);

    if (error) {

      toast.error("Failed to update warehouse item");

      return;

    }

    setEditingWarehouseItem(null);

    await fetchWarehouseItems();

    toast.success("Warehouse item updated");

  };



  // Delete warehouse item

  const handleDeleteWarehouseItem = async () => {

    if (!itemToDelete) return;

    const { error } = await supabase

      .from("warehouse_items")

      .delete()

      .eq("id", itemToDelete.id);

    if (error) {

      toast.error("Failed to delete warehouse item");

      return;

    }

    setShowDeleteDialog(false);

    setItemToDelete(null);

    await fetchWarehouseItems();

    toast.success("Warehouse item deleted");

  };



  // Edit truck item

  const handleEditTruckItem = async (updates: any) => {

    if (!editingTruckItem) return;

    const { error } = await supabase

      .from("truck_items")

      .update(updates)

      .eq("id", editingTruckItem.id);

    if (error) {

      toast.error("Failed to update item");

      return;

    }

    setEditingTruckItem(null);

    await fetchTruckItemsWithArrival();

    toast.success("Item updated");

  };



  // Delete truck item

  const handleDeleteTruckItem = async () => {

    if (!truckItemToDelete) return;

    console.log(

      "Attempting to delete warehouse item with id:",

      truckItemToDelete.id

    );

    const { data, error } = await supabase

      .from("warehouse_items")

      .delete()

      .eq("id", truckItemToDelete.id);

    console.log("Delete response:", { data, error });

    if (error) {

      toast.error("Failed to delete item");

      return;

    }

    setShowDeleteTruckDialog(false);

    setTruckItemToDelete(null);

    await fetchTruckItemsWithArrival();

    toast.success("Item deleted");

  };



  // Combined Table: Truck Arrival, Truck Items, Warehouse Items

  const combinedRows = [];

  // Add truck_arrival rows

  for (const arrival of truckArrivals) {

    combinedRows.push({

      type: "truck_arrival",

      ...arrival,

    });

  }

  // Add truck_items rows

  for (const tItem of truckItems) {

    combinedRows.push({

      type: "truck_item",

      ...tItem,

    });

  }

  // Add warehouse_items rows

  for (const wItem of warehouseItems) {

    combinedRows.push({

      type: "warehouse_item",

      ...wItem,

    });

  }



  // Modify the barcode generation functions

  const generateBarcodeFromItem = (item: any) => {

    if (item.barcode) return item.barcode;

    // Generate a barcode using item ID or description

    const base = item.id || item.description || item.name || "ITEM";

    return `BC-${base}-${Date.now()}`;

  };



  const generateBarcodeCanvas = (barcode: string): HTMLCanvasElement => {

    const canvas = document.createElement("canvas");

    JsBarcode(canvas, barcode, {

      format: "CODE128",

      width: 2,

      height: 50,

      displayValue: true,

      fontSize: 12,

      margin: 10,

      text: barcode, // Ensure the displayed text matches the barcode

    });

    return canvas;

  };



  // Modify the downloadBarcodes function

  const downloadBarcodes = async ({

    format,

    selectedProducts,

  }: BarcodeDownloadOptions) => {

    if (selectedProducts.length === 0) {

      toast.error("Please select at least one product");

      return;

    }



    try {

      if (format === "image") {

        // Download individual barcode images

        selectedProducts.forEach((product) => {

          const canvas = generateBarcodeCanvas(product.barcode);

          const link = document.createElement("a");

          link.href = canvas.toDataURL("image/png");

          link.download = `barcode-${product.barcode}.png`;

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);

        });

        toast.success("Barcode images downloaded successfully");

      } else {

        // Generate PDF with barcodes

        const doc = new jsPDF();

        let yOffset = 20;

        let pageCount = 1;



        // Add all content to PDF

        selectedProducts.forEach((product, index) => {

          if (yOffset > 250) {

            doc.addPage();

            yOffset = 20;

            pageCount++;

          }



          // Add product name

          doc.setFontSize(12);

          doc.text(product.name, 20, yOffset);



          // Add barcode number

          doc.setFontSize(10);

          doc.text(`Barcode: ${product.barcode}`, 20, yOffset + 10);



          // Generate and add barcode

          const canvas = generateBarcodeCanvas(product.barcode);

          const imgData = canvas.toDataURL("image/png");

          doc.addImage(imgData, "PNG", 20, yOffset + 17, 50, 20);



          yOffset += 50;

        });



        // Add page numbers

        for (let i = 1; i <= pageCount; i++) {

          doc.setPage(i);

          doc.setFontSize(8);

          doc.text(

            `Page ${i} of ${pageCount}`,

            doc.internal.pageSize.width - 20,

            10,

            { align: "right" }

          );

        }



        // Save the PDF

        doc.save("barcodes.pdf");

        toast.success("PDF downloaded successfully");

      }

    } catch (error) {

      console.error("Error generating barcodes:", error);

      toast.error("Failed to generate barcodes. Please try again.");

    }

  };



  // Add new function to handle product selection

  const handleProductSelection = (product: Product) => {

    setProducts((prev) =>

      prev.map((p) =>

        p.id === product.id ? { ...p, selected: !p.selected } : p

      )

    );



    setSelectedProducts((prev) => {

      if (prev.find((p) => p.id === product.id)) {

        return prev.filter((p) => p.id !== product.id);

      } else {

        return [...prev, product];

      }

    });

  };



  // Add new function to handle select all

  const handleSelectAll = () => {

    const allSelected = products.every((p) => p.selected);

    setProducts((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));

    setSelectedProducts(allSelected ? [] : [...products]);

  };



  // Add refresh function

  const handleRefresh = async () => {

    setLoading(true);

    try {

      const userStr = localStorage.getItem("currentUser");

      if (!userStr) {

        router.push("/auth/login");

        return;

      }



      const user = JSON.parse(userStr);



      // Fetch products

      const { data: userProducts, error: productsError } = await supabase

        .from("products")

        .select("*")

        .eq("client_id", user.id)

        .order("created_at", { ascending: false });



      if (productsError) throw productsError;



      // Fetch warehouse items

      const { data: warehouseData, error: warehouseError } = await supabase

        .from("warehouse_items")

        .select(

          `

          *,

          truck_arrival:truck_arrival_id (

            vehicle_registration,

            customer_name,

            driver_name,

            vehicle_size,

            load_type,

            arrival_time,

            warehouse_id

          )

        `

        )

        .eq("client_id", user.id)

        .order("created_at", { ascending: false });



      if (warehouseError) throw warehouseError;



      // Update states

      setProducts(

        userProducts.map((product) => ({

          ...product,

          status: "saved",

          selected: false,

        }))

      );

      setWarehouseItems(warehouseData);

      setTruckItems(warehouseData);



      toast.success("Data refreshed successfully");

    } catch (error) {

      console.error("Error refreshing data:", error);

      toast.error("Failed to refresh data");

    } finally {

      setLoading(false);

    }

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center h-screen">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>

      </div>

    );

  }



  if (!currentUser) {

    return (

      <div className="text-center py-8">

        <p className="mb-4">Please log in to view your inventory</p>

        <Button onClick={() => router.push("/auth/login")}>Log In</Button>

      </div>

    );

  }



  return (

    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 relative min-h-screen">

      {/* Background decorative elements */}

      <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-[#3456FF]/5 to-[#8763FF]/5 rounded-bl-full -z-10 opacity-70"></div>

      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3456FF05_1px,transparent_1px)] [background-size:20px_20px] -z-10"></div>



      <Toaster position="top-right" />



      {/* Page header with gradient effects */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">

        <div>

          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">

            Inventory Dashboard

          </h1>

          <p className="text-gray-500 mt-1 font-sans">

            Manage your product inventory and warehouse operations

          </p>

        </div>



        <div className="flex flex-wrap gap-3">

          {/* Currency toggle button */}

          <Button

            variant="outline"

            onClick={toggleCurrency}

            className="relative overflow-hidden group font-sans"

          >

            <span>{currency === "USD" ? "$" : "£"}</span>

            <span className="mx-1">⟷</span>

            <span>{currency === "USD" ? "£" : "$"}</span>

            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3456FF] to-[#8763FF] transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>

          </Button>



          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>

            <DialogTrigger asChild>

              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 shadow-md font-medium">

                <Plus className="mr-2 h-4 w-4" /> Add Product

              </Button>

            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] glass-card max-h-[90vh] overflow-y-auto p-4 md:p-8">

              <DialogHeader>

                <DialogTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">

                  Add New Product

                </DialogTitle>

              </DialogHeader>

              <ProductForm

                onSubmit={handleAddProduct}

                initialData={null}

                submitLabel="Add Product"

              />

            </DialogContent>

          </Dialog>

        </div>

      </div>



      {/* Excel Upload Section */}

      <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-5 mb-6 relative overflow-hidden">

        {/* Animated accent line */}

        <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-[#3456FF] to-[#8763FF]"></div>

        {/* Glass shine effect */}

        <div className="absolute -inset-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 transform -translate-x-full animate-[shimmer_8s_ease-in-out_infinite] pointer-events-none"></div>



        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pl-3">

          <h2 className="text-xl font-heading font-semibold text-gray-800">

            Upload Excel{" "}

            <span className="text-sm text-gray-500 font-normal font-sans ml-2">

              Import multiple products at once

            </span>

          </h2>



          <div className="mt-3 sm:mt-0 flex w-full sm:w-auto">

            <div className="relative inline-flex items-center w-full sm:w-auto">

              <label

                htmlFor="excel-upload"

                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all w-full sm:w-auto hover:border-[#3456FF]/50 font-sans"

              >

                <Upload className="h-4 w-4 text-[#3456FF]" />

                <span>Upload Excel</span>

              </label>

              <Input

                type="file"

                id="excel-upload"

                accept=".xlsx,.xls,.csv"

                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}

                className="hidden"

              />

            </div>

          </div>

        </div>



        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-500 font-sans ml-3">

          <p className="flex items-center">

            <svg

              className="w-4 h-4 mr-2 text-blue-500"

              fill="none"

              stroke="currentColor"

              viewBox="0 0 24 24"

              xmlns="http://www.w3.org/2000/svg"

            >

              <path

                strokeLinecap="round"

                strokeLinejoin="round"

                strokeWidth="2"

                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"

              ></path>

            </svg>

            For bulk uploads, your Excel file should include columns for: Name,

            Price, Quantity, Dimensions, and Weight

          </p>

        </div>

      </div>



      {/* Products Table */}

      <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-5 overflow-hidden relative">

        {/* Background patterns */}

        <div className="absolute inset-0 bg-circuit-pattern opacity-5 pointer-events-none"></div>



        <h2 className="text-xl font-heading font-semibold text-gray-800 mb-4 flex items-center">

          <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>

          Product Inventory

        </h2>



        <div className="flex justify-end gap-2 mb-4">

          <Button

            variant="outline"

            onClick={handleRefresh}

            className="flex items-center gap-2 border-2 border-gray-400 hover:border-[#3456FF] hover:text-[#3456FF] transition-colors duration-200"

            disabled={loading}

          >

            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />

            Refresh

          </Button>



          <div className="flex items-center gap-2">

            <Button

              variant="outline"

              size="sm"

              onClick={() => setIsDownloadDialogOpen(true)}

              disabled={!products.some((p) => p.selected)}

              className={`

                border-2 font-sans transition-all

                ${

                  products.some((p) => p.selected)

                    ? "border-[#3456FF] text-[#3456FF] hover:bg-[#3456FF] hover:text-white"

                    : "border-gray-300 text-gray-400 cursor-not-allowed"

                }

              `}

            >

              <Download className="h-4 w-4 mr-2" />

              Download Barcodes

              {products.some((p) => p.selected) && (

                <span className="ml-2 bg-[#3456FF] text-white px-2 py-0.5 rounded-full text-xs">

                  {products.filter((p) => p.selected).length}

                </span>

              )}

            </Button>

            <Button

              variant="outline"

              size="sm"

              onClick={() => {

                const selectedProducts = products.filter((p) => p.selected);

                if (selectedProducts.length > 0) {

                  setSelectedProducts(selectedProducts);

                  setShowBulkMoveToSectionDialog(true);

                  fetchWarehouseLayouts();

                  // Initialize quantities with product quantities
                  const initialQuantities: Record<string, number> = {};
                  selectedProducts.forEach((p) => {
                    initialQuantities[p.id] = 1;
                  });
                  setBulkMoveQuantities(initialQuantities);

                }

              }}

              disabled={!products.some((p) => p.selected)}

              className={`

                border-2 font-sans transition-all

                ${

                  products.some((p) => p.selected)

                    ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"

                    : "border-gray-300 text-gray-400 cursor-not-allowed"

                }

              `}

            >

              <Truck className="h-4 w-4 mr-2" />

              Move to Section

              {products.some((p) => p.selected) && (

                <span className="ml-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs">

                  {products.filter((p) => p.selected).length}

                </span>

              )}

            </Button>

            <Button

              variant="outline"

              size="sm"

              onClick={() => {

                const selectedProducts = products.filter((p) => p.selected);

                if (selectedProducts.length > 0) {

                  setSelectedProducts(selectedProducts);

                  setShowBulkDeleteDialog(true);

                }

              }}

              disabled={!products.some((p) => p.selected)}

              className={`

                border-2 font-sans transition-all

                ${

                  products.some((p) => p.selected)

                    ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"

                    : "border-gray-300 text-gray-400 cursor-not-allowed"

                }

              `}

            >

              <Trash2 className="h-4 w-4 mr-2" />

              Delete Selected

              {products.some((p) => p.selected) && (

                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">

                  {products.filter((p) => p.selected).length}

                </span>

              )}

            </Button>



            <Dialog

              open={isDownloadDialogOpen}

              onOpenChange={setIsDownloadDialogOpen}

            >

              <DialogContent className="sm:max-w-md">

                <DialogHeader>

                  <DialogTitle>Download Barcodes</DialogTitle>

                  <DialogDescription>

                    Choose the format for downloading barcodes

                  </DialogDescription>

                </DialogHeader>

                <div className="flex flex-col space-y-4">

                  <Button

                    onClick={() => {

                      const selectedProducts = products.filter(

                        (p) => p.selected

                      );

                      downloadBarcodes({ format: "image", selectedProducts });

                      setIsDownloadDialogOpen(false);

                    }}

                    className="w-full bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-sans"

                  >

                    <Download className="h-4 w-4 mr-2" />

                    Download as Images

                  </Button>

                  <Button

                    onClick={() => {

                      const selectedProducts = products.filter(

                        (p) => p.selected

                      );

                      downloadBarcodes({ format: "pdf", selectedProducts });

                      setIsDownloadDialogOpen(false);

                    }}

                    className="w-full bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-sans"

                  >

                    <FileText className="h-4 w-4 mr-2" />

                    Download as PDF

                  </Button>

                </div>

              </DialogContent>

            </Dialog>

          </div>

        </div>



        <div className="overflow-x-auto">

          <Table className="w-full min-w-[600px] text-xs sm:text-sm md:text-base">

            <TableHeader className="bg-gray-50">

              <TableRow>

                <TableHead className="w-12">

                  <Checkbox

                    checked={

                      products.length > 0 && products.every((p) => p.selected)

                    }

                    onCheckedChange={(checked) => {

                      const newProducts = products.map((p) => ({

                        ...p,

                        selected: checked as boolean,

                      }));

                      setProducts(newProducts);

                    }}

                    className="border-2 border-gray-300 data-[state=checked]:bg-[#3456FF] data-[state=checked]:border-[#3456FF]"

                  />

                </TableHead>

                <TableHead>Product Name</TableHead>

                <TableHead>SKU</TableHead>

                <TableHead>Barcode</TableHead>

                <TableHead>Price</TableHead>

                <TableHead>Quantity</TableHead>

                <TableHead>Category</TableHead>

                <TableHead>Condition</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {products.length === 0 ? (

                <TableRow>

                  <TableCell

                    colSpan={10}

                    className="text-center py-10 text-gray-500"

                  >

                    <div className="flex flex-col items-center justify-center space-y-3">

                      <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center animate-pulse-slow">

                        <Package className="h-8 w-8 text-[#3456FF]" />

                      </div>

                      <p className="font-sans">

                        No products found. Add new products or import from

                        Excel.

                      </p>

                    </div>

                  </TableCell>

                </TableRow>

              ) : (

                products.map((product) => (

                  <TableRow

                    key={product.id}

                    className="hover:bg-gray-50 transition-colors"

                  >

                    <TableCell>

                      <Checkbox

                        checked={product.selected}

                        onCheckedChange={(checked) => {

                          const newProducts = products.map((p) =>

                            p.id === product.id

                              ? { ...p, selected: checked as boolean }

                              : p

                          );

                          setProducts(newProducts);

                        }}

                        className="border-2 border-gray-300 data-[state=checked]:bg-[#3456FF] data-[state=checked]:border-[#3456FF]"

                      />

                    </TableCell>

                    <TableCell>{product.name}</TableCell>

                    <TableCell>{product.sku}</TableCell>

                    <TableCell>

                      <div className="flex items-center space-x-2">

                        <span className="font-mono text-sm">

                          {product.barcode}

                        </span>

                        <Button

                          variant="ghost"

                          size="sm"

                          onClick={() => {

                            const canvas = generateBarcodeCanvas(

                              product.barcode

                            );

                            const link = document.createElement("a");

                            link.href = canvas.toDataURL("image/png");

                            link.download = `barcode-${product.barcode}.png`;

                            document.body.appendChild(link);

                            link.click();

                            document.body.removeChild(link);

                          }}

                        >

                          <Download className="h-4 w-4" />

                        </Button>

                      </div>

                    </TableCell>

                    <TableCell>${product.price.toFixed(2)}</TableCell>

                    <TableCell>{product.quantity}</TableCell>

                    <TableCell>{product.category}</TableCell>

                    <TableCell>{product.condition}</TableCell>

                    <TableCell>

                      <Badge

                        variant={

                          product.status === "saved" ? "default" : "secondary"

                        }

                        className={

                          product.status === "saved"

                            ? "bg-green-100 text-green-800 hover:bg-green-100"

                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"

                        }

                      >

                        {product.status}

                      </Badge>

                    </TableCell>

                    <TableCell className="text-right space-x-2">

                      <Button

                        variant="ghost"

                        size="sm"

                        onClick={() => setEditingProduct(product)}

                        className="text-blue-600 hover:text-blue-800"

                      >

                        <Edit className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="ghost"

                        size="sm"

                        onClick={() => {

                          setProductToMove(product);

                          setShowMoveToSectionDialog(true);

                          fetchWarehouseLayouts();

                        }}

                        className="text-green-600 hover:text-green-800"

                        title="Move to Warehouse Section"

                      >

                        <Package className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="ghost"

                        size="sm"

                        onClick={() => {

                          setItemToDelete(product);

                          setShowDeleteDialog(true);

                        }}

                        className="text-red-600 hover:text-red-800"

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </TableCell>

                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        </div>

      </div>



      {/* Warehouse Operations Table */}

      <div className="card-gradient glass-card rounded-xl border border-gray-200 shadow-md p-5 overflow-hidden relative">

        {/* Background patterns */}

        <div className="absolute inset-0 bg-[linear-gradient(rgba(135,99,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(135,99,255,0.03)_1px,transparent_1px)] bg-[length:14px_14px] pointer-events-none"></div>



        <h2 className="text-xl font-heading font-semibold text-gray-800 mb-4 flex items-center">

          <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>

          Warehouse Operation Data

        </h2>



        <div className="overflow-x-auto">

          <Table className="w-full min-w-[600px] text-xs sm:text-sm md:text-base">

            <TableHeader className="bg-gray-50">

              <TableRow>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Vehicle Registration

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Customer Name

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Driver Name

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Vehicle Size

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Load Type

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Arrival Time

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Warehouse

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Quantity

                </TableHead>

                <TableHead className="font-medium text-gray-700 font-sans">

                  Condition

                </TableHead>

                <TableHead className="font-medium text-gray-700 text-right font-sans">

                  Actions

                </TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {truckItems.length === 0 ? (

                <TableRow>

                  <TableCell

                    colSpan={10}

                    className="text-center py-10 text-gray-500"

                  >

                    <div className="flex flex-col items-center justify-center space-y-3">

                      <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center animate-pulse-slow">

                        <Truck className="h-8 w-8 text-[#3456FF]" />

                      </div>

                      <p className="font-sans">

                        No warehouse operation data found

                      </p>

                    </div>

                  </TableCell>

                </TableRow>

              ) : (

                truckItems.map((item) => (

                  <TableRow

                    key={item.id}

                    className="hover:bg-gray-50 transition-colors"

                  >

                    <TableCell className="font-sans">

                      {item.truck_arrival?.vehicle_registration || "N/A"}

                    </TableCell>

                    <TableCell className="font-sans">

                      {item.truck_arrival?.customer_name || "N/A"}

                    </TableCell>

                    <TableCell className="font-sans">

                      {item.truck_arrival?.driver_name || "N/A"}

                    </TableCell>

                    <TableCell className="font-sans">

                      {item.truck_arrival?.vehicle_size || "N/A"}

                    </TableCell>

                    <TableCell>

                      <Badge

                        variant="outline"

                        className="bg-blue-100 text-blue-800 hover:bg-blue-100"

                      >

                        <span className="font-sans">

                          {item.truck_arrival?.load_type || "N/A"}

                        </span>

                      </Badge>

                    </TableCell>

                    <TableCell className="font-sans">

                      {item.truck_arrival?.arrival_time

                        ? new Date(

                            item.truck_arrival.arrival_time

                          ).toLocaleString()

                        : "N/A"}

                    </TableCell>

                    <TableCell className="font-sans">

                      {getWarehouseName(item.truck_arrival?.warehouse_id) ||

                        "N/A"}

                    </TableCell>

                    <TableCell className="font-sans">

                      {item.quantity || "N/A"}

                    </TableCell>

                    <TableCell>

                      <Badge

                        variant="outline"

                        className={

                          item.condition === "Good"

                            ? "bg-green-100 text-green-800 hover:bg-green-100"

                            : item.condition === "Damaged"

                            ? "bg-red-100 text-red-800 hover:bg-red-100"

                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"

                        }

                      >

                        <span className="font-sans">

                          {item.condition || "N/A"}

                        </span>

                      </Badge>

                    </TableCell>

                    <TableCell className="text-right space-x-2">

                      <Button

                        size="sm"

                        variant="ghost"

                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"

                        onClick={() => {

                          setTruckItemToDelete(item);

                          setShowDeleteTruckDialog(true);

                        }}

                      >

                        <Trash2 className="h-4 w-4" />

                        <span className="sr-only">Delete</span>

                      </Button>

                    </TableCell>

                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        </div>

      </div>



      {/* Edit Product Dialog */}

      <Dialog

        open={!!editingProduct}

        onOpenChange={(open) => {

          if (!open) setEditingProduct(null);

        }}

      >

        <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto p-4 md:p-8">

          <DialogHeader>

            <DialogTitle>Edit Product</DialogTitle>

            <DialogDescription>

              Make changes to your product here. Click save when you're done.

            </DialogDescription>

          </DialogHeader>

          {editingProduct && (

            <ProductForm

              initialData={editingProduct}

              onSubmit={handleEditProduct}

              submitLabel="Save Changes"

            />

          )}

        </DialogContent>

      </Dialog>



      {/* Delete Product Confirmation Dialog */}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>

        <DialogContent className="sm:max-w-[425px] glass-card">

          <DialogHeader>

            <DialogTitle className="text-xl font-heading font-bold text-gray-900">

              Confirm Deletion

            </DialogTitle>

          </DialogHeader>

          <div className="py-4">

            <p className="text-gray-700 font-sans">

              Are you sure you want to delete the product &quot;

              {itemToDelete?.name}&quot;? This action cannot be undone.

            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end items-stretch sm:items-center">

            <Button

              variant="outline"

              onClick={() => setShowDeleteDialog(false)}

              className="font-sans"

            >

              Cancel

            </Button>

            <Button

              variant="destructive"

              onClick={() => {

                if (itemToDelete) {

                  handleDeleteProduct(itemToDelete.id);

                  setShowDeleteDialog(false);

                }

              }}

              className="font-sans"

            >

              Delete

            </Button>

          </div>

        </DialogContent>

      </Dialog>

      {/* Move to Section Dialog */}
      <Dialog open={showMoveToSectionDialog} onOpenChange={setShowMoveToSectionDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Move Inventory to Warehouse Section</DialogTitle>
            <DialogDescription>
              Assign {productToMove?.name} to a warehouse section
            </DialogDescription>
          </DialogHeader>

          {productToMove && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Product: {productToMove.name}</p>
                <p className="text-sm text-gray-600">
                  Available Quantity: {productToMove.quantity}
                </p>
              </div>

              {/* Warehouse Selection */}
              <div>
                <Label htmlFor="warehouse-select" className="font-medium font-sans text-gray-700">
                  Select Warehouse
                </Label>
                <Select
                  value={selectedWarehouseForMove}
                  onValueChange={(value) => {
                    setSelectedWarehouseForMove(value);
                    setSelectedLayoutForMove("");
                    setSelectedSectionForMove("");
                  }}
                  disabled={loadingWarehouses}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans">
                    <SelectValue placeholder={loadingWarehouses ? "Loading warehouses..." : "Choose a warehouse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingWarehouses ? (
                      <SelectItem value="loading" disabled>
                        Loading warehouses...
                      </SelectItem>
                    ) : warehousesForMove.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No warehouses available. Create a warehouse first.
                      </SelectItem>
                    ) : (
                      warehousesForMove.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name || warehouse.location} - {warehouse.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Floor Plan/Layout Selection */}
              {selectedWarehouseForMove && availableLayouts.length > 0 && (
                <div>
                  <Label htmlFor="layout-select" className="font-medium font-sans text-gray-700">
                    Select Floor Plan
                  </Label>
                  <Select
                    value={selectedLayoutForMove}
                    onValueChange={(value) => {
                      setSelectedLayoutForMove(value);
                      setSelectedSectionForMove("");
                    }}
                  >
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans">
                      <SelectValue placeholder="Choose a floor plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLayouts.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id}>
                          Floor Plan ({layout.grid_rows}x{layout.grid_columns} grid)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Section Selection */}
              {selectedLayoutForMove && availableSections.length > 0 && (
                <div>
                  <Label htmlFor="section-select" className="font-medium font-sans text-gray-700">
                    Select Section
                  </Label>
                  <Select
                    value={selectedSectionForMove}
                    onValueChange={setSelectedSectionForMove}
                  >
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans">
                      <SelectValue placeholder="Choose a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.section_name} ({section.section_type}) - 
                          Row {section.row_index}, Col {section.column_index} - 
                          Usage: {section.current_usage?.toFixed(1) || 0}% / 
                          Capacity: {section.capacity}
                          {section.is_blocked && " [BLOCKED]"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedSectionForMove && (
                <div>
                  <Label htmlFor="move-quantity" className="font-medium font-sans text-gray-700">
                    Quantity to Move
                  </Label>
                  <Input
                    id="move-quantity"
                    type="number"
                    min="1"
                    max={productToMove.quantity}
                    value={moveQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setMoveQuantity(Math.min(Math.max(1, val), productToMove.quantity));
                    }}
                    className="mt-1 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {productToMove.quantity} units
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMoveToSectionDialog(false);
                    setProductToMove(null);
                    setSelectedWarehouseForMove("");
                    setSelectedLayoutForMove("");
                    setSelectedSectionForMove("");
                    setMoveQuantity(1);
                  }}
                  className="font-sans"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMoveToSection}
                  disabled={!selectedSectionForMove || moveQuantity <= 0 || loading}
                  className="bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-sans"
                >
                  {loading ? "Moving..." : "Move to Section"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Move to Section Dialog */}
      <Dialog open={showBulkMoveToSectionDialog} onOpenChange={setShowBulkMoveToSectionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Move Multiple Products to Warehouse Section</DialogTitle>
            <DialogDescription>
              Assign {products.filter((p) => p.selected).length} selected product(s) to a warehouse section
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warehouse Selection */}
            <div>
              <Label>Select Warehouse</Label>
              <Select
                value={selectedWarehouseForMove}
                onValueChange={(value) => {
                  setSelectedWarehouseForMove(value);
                  setSelectedLayoutForMove("");
                  setSelectedSectionForMove("");
                }}
                disabled={loadingWarehouses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingWarehouses ? "Loading warehouses..." : "Select a warehouse"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingWarehouses ? (
                    <SelectItem value="loading" disabled>
                      Loading warehouses...
                    </SelectItem>
                  ) : warehousesForMove.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No warehouses available. Create a warehouse first.
                    </SelectItem>
                  ) : (
                    warehousesForMove.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name || warehouse.location} - {warehouse.location}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Floor Plan/Layout Selection */}
            {selectedWarehouseForMove && availableLayouts.length > 0 && (
              <div>
                <Label>Select Floor Plan</Label>
                <Select
                  value={selectedLayoutForMove}
                  onValueChange={(value) => {
                    setSelectedLayoutForMove(value);
                    setSelectedSectionForMove("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a floor plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLayouts.map((layout) => (
                      <SelectItem key={layout.id} value={layout.id}>
                        Floor Plan ({layout.grid_rows}x{layout.grid_columns} grid)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Section Selection */}
            {selectedLayoutForMove && availableSections.length > 0 && (
              <div>
                <Label>Select Section</Label>
                <Select
                  value={selectedSectionForMove}
                  onValueChange={setSelectedSectionForMove}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.section_name} ({section.section_type}) - Row {section.row_index}, Col {section.column_index}
                        {section.is_blocked && " [BLOCKED]"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Products List with Quantities */}
            {selectedWarehouseForMove && (
              <div>
                <Label>Products to Move</Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {products
                    .filter((p) => p.selected)
                    .map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">Available: {product.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={bulkMoveQuantities[product.id] || 1}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setBulkMoveQuantities({
                                ...bulkMoveQuantities,
                                [product.id]: Math.min(Math.max(1, qty), product.quantity),
                              });
                            }}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkMoveToSectionDialog(false);
                  setSelectedWarehouseForMove("");
                  setSelectedLayoutForMove("");
                  setSelectedSectionForMove("");
                  setBulkMoveQuantities({});
                }}
                className="font-sans"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkMoveToSection}
                disabled={!selectedSectionForMove || loading}
                className="bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-sans"
              >
                {loading ? "Moving..." : `Move ${products.filter((p) => p.selected).length} Product(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">
              Confirm Bulk Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 font-sans">
              Are you sure you want to delete {selectedProducts.length} selected products? 
              This action cannot be undone.
            </p>
            <div className="mt-3">
              <p className="text-sm text-gray-600 font-sans">
                Products to be deleted:
              </p>
              <ul className="mt-2 max-h-32 overflow-y-auto">
                {selectedProducts.map((product) => (
                  <li key={product.id} className="text-sm text-gray-700 font-sans">
                    • {product.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end items-stretch sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              className="font-sans"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteProducts}
              className="font-sans"
            >
              Delete {selectedProducts.length} Products
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>

        <DialogContent className="sm:max-w-[500px] glass-card">

          <DialogHeader>

            <DialogTitle className="text-xl font-heading font-bold text-green-600">

              Delivery Scheduled Successfully

            </DialogTitle>

          </DialogHeader>

          <div className="py-6">

            {lastDeliveryDetails && (

              <div className="space-y-4">

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">

                    <svg

                      className="w-6 h-6 text-green-600"

                      fill="none"

                      stroke="currentColor"

                      viewBox="0 0 24 24"

                      xmlns="http://www.w3.org/2000/svg"

                    >

                      <path

                        strokeLinecap="round"

                        strokeLinejoin="round"

                        strokeWidth="2"

                        d="M5 13l4 4L19 7"

                      ></path>

                    </svg>

                  </div>

                  <div>

                    <p className="font-medium text-green-800 font-sans">

                      The package has been scheduled for delivery!

                    </p>

                    <p className="text-sm text-green-700 font-mono">

                      Package ID:{" "}

                      <span className="font-mono">

                        {lastDeliveryDetails.packageId}

                      </span>

                    </p>

                  </div>

                </div>



                <div className="space-y-3">

                  <h3 className="text-sm font-medium text-gray-900 font-heading">

                    Package Details

                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-sm">

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">Pickup Location</p>

                      <p className="font-medium font-sans">

                        {lastDeliveryDetails.pickup.location}

                      </p>

                    </div>

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">Pickup Time</p>

                      <p className="font-medium font-sans">

                        {lastDeliveryDetails.pickup.time}

                      </p>

                    </div>

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">

                        Delivery Address

                      </p>

                      <p className="font-medium font-sans">

                        {lastDeliveryDetails.delivery.address}

                      </p>

                    </div>

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">Courier</p>

                      <p className="font-medium font-sans">

                        {lastDeliveryDetails.courier.name}

                      </p>

                    </div>

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">Priority</p>

                      <p className="font-medium capitalize font-sans">

                        {lastDeliveryDetails.priority}

                      </p>

                    </div>

                    <div className="space-y-1">

                      <p className="text-gray-500 font-sans">Total Weight</p>

                      <p className="font-medium font-sans">

                        {lastDeliveryDetails.totalWeight}kg

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end items-stretch sm:items-center">

            <Button

              onClick={() => setShowSuccessDialog(false)}

              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 font-sans"

            >

              Close

            </Button>

          </div>

        </DialogContent>

      </Dialog>



      {/* Delete Truck Item Confirmation Dialog */}

      <Dialog

        open={showDeleteTruckDialog}

        onOpenChange={setShowDeleteTruckDialog}

      >

        <DialogContent className="sm:max-w-[425px] glass-card">

          <DialogHeader>

            <DialogTitle className="text-xl font-heading font-bold text-gray-900">

              Confirm Deletion

            </DialogTitle>

          </DialogHeader>

          <div className="py-4">

            <p className="text-gray-700 font-sans">

              Are you sure you want to delete this truck item? This action

              cannot be undone.

            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end items-stretch sm:items-center">

            <Button

              variant="outline"

              onClick={() => setShowDeleteTruckDialog(false)}

              className="font-sans"

            >

              Cancel

            </Button>

            <Button

              variant="destructive"

              onClick={() => {

                if (truckItemToDelete) {

                  handleDeleteTruckItem();

                  setShowDeleteTruckDialog(false);

                }

              }}

              className="font-sans"

            >

              Delete

            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}



// Product Form component

const ProductForm = ({

  onSubmit,

  initialData,

  submitLabel,

}: {

  onSubmit: (

    data: Omit<Product, "id" | "client_id" | "sku" | "barcode">

  ) => void;

  initialData?: Product;

  submitLabel: string;

}) => {

  const [formData, setFormData] = useState({

    name: initialData?.name || "",

    price: initialData?.price || "",

    quantity: initialData?.quantity || "",

    category: initialData?.category || "",

    condition: initialData?.condition || "New",

    height: initialData?.height?.toString() || "",

    weight: initialData?.weight?.toString() || "",

    length: "",

    width: "",

  });



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();



    if (!formData.name.trim()) {

      toast.error("Please enter a product name");

      return;

    }



    const price =

      typeof formData.price === "string"

        ? parseFloat(formData.price)

        : formData.price;

    const quantity =

      typeof formData.quantity === "string"

        ? parseInt(formData.quantity.toString())

        : formData.quantity;

    const height = formData.height

      ? parseFloat(formData.height.toString())

      : null;

    const weight = formData.weight

      ? parseFloat(formData.weight.toString())

      : null;

    const length = formData.length ? parseFloat(formData.length) : null;

    const width = formData.width ? parseFloat(formData.width) : null;



    // Combine dimensions only if all values are present

    const dimensions =

      length && width && height ? `${length}x${width}x${height} cm` : null;



    if (!formData.category) {

      toast.error("Please select a category");

      return;

    }



    if (!formData.condition) {

      toast.error("Please select a condition");

      return;

    }



    onSubmit({

      id: initialData?.id, // Include ID for editing

      name: formData.name,

      price,

      quantity,

      category: formData.category,

      condition: formData.condition,

      height,

      weight,

      dimensions,

      length,

      width,

      status: "pending",

    });

  };



  return (

    <form onSubmit={handleSubmit} className="space-y-4">

      <div>

        <Label className="font-medium font-sans text-gray-700">

          Product Name

        </Label>

        <Input

          required

          value={formData.name}

          onChange={(e) => setFormData({ ...formData, name: e.target.value })}

          placeholder="Product name"

          className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

        />

      </div>



      <div>

        <Label className="font-medium font-sans text-gray-700">Price</Label>

        <div className="relative">

          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">

            $

          </span>

          <Input

            type="number"

            step="0.01"

            min="0"

            required

            value={formData.price}

            onChange={(e) =>

              setFormData({ ...formData, price: e.target.value })

            }

            placeholder="0.00"

            className="pl-7 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

          />

        </div>

      </div>



      <div>

        <Label className="font-medium font-sans text-gray-700">Quantity</Label>

        <Input

          type="number"

          min="0"

          required

          value={formData.quantity}

          onChange={(e) =>

            setFormData({ ...formData, quantity: e.target.value })

          }

          placeholder="0"

          className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

        />

      </div>



      <div className="grid grid-cols-3 gap-4">

        <div>

          <Label className="font-medium font-sans text-gray-700">

            Length (cm)

          </Label>

          <Input

            type="number"

            step="0.1"

            min="0"

            value={formData.length}

            onChange={(e) =>

              setFormData({ ...formData, length: e.target.value })

            }

            placeholder="0.0"

            className="h-9 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

          />

        </div>

        <div>

          <Label className="font-medium font-sans text-gray-700">

            Width (cm)

          </Label>

          <Input

            type="number"

            step="0.1"

            min="0"

            value={formData.width}

            onChange={(e) =>

              setFormData({ ...formData, width: e.target.value })

            }

            placeholder="0.0"

            className="h-9 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

          />

        </div>

        <div>

          <Label className="font-medium font-sans text-gray-700">

            Height (cm)

          </Label>

          <Input

            type="number"

            step="0.1"

            min="0"

            value={formData.height}

            onChange={(e) =>

              setFormData({ ...formData, height: e.target.value })

            }

            placeholder="0.0"

            className="h-9 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

          />

        </div>

      </div>



      <div>

        <Label className="font-medium font-sans text-gray-700">

          Weight (kg)

        </Label>

        <Input

          type="number"

          step="0.01"

          min="0"

          value={formData.weight}

          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}

          placeholder="Weight in kilograms"

          className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"

        />

      </div>



      <div>

        <Label className="font-medium font-sans text-gray-700">Category</Label>

        <Select

          value={formData.category}

          onValueChange={(value) =>

            setFormData({ ...formData, category: value })

          }

          required

        >

          <SelectTrigger className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all">

            <SelectValue placeholder="Select category" />

          </SelectTrigger>

          <SelectContent>

            <SelectItem value="Electronics">Electronics</SelectItem>

            <SelectItem value="Clothing">Clothing</SelectItem>

            <SelectItem value="Books">Books</SelectItem>

            <SelectItem value="Home">Home & Garden</SelectItem>

            <SelectItem value="Sports">Sports & Outdoors</SelectItem>

            <SelectItem value="Toys">Toys & Games</SelectItem>

            <SelectItem value="Beauty">Beauty & Personal Care</SelectItem>

            <SelectItem value="Health">Health & Wellness</SelectItem>

            <SelectItem value="Automotive">Automotive</SelectItem>

            <SelectItem value="Other">Other</SelectItem>

          </SelectContent>

        </Select>

      </div>



      <div>

        <Label className="font-medium font-sans text-gray-700">Condition</Label>

        <Select

          value={formData.condition}

          onValueChange={(value) =>

            setFormData({ ...formData, condition: value })

          }

          required

        >

          <SelectTrigger className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all">

            <SelectValue placeholder="Select condition" />

          </SelectTrigger>

          <SelectContent>

            <SelectItem value="New">New</SelectItem>

            <SelectItem value="Like New">Like New</SelectItem>

            <SelectItem value="Good">Good</SelectItem>

            <SelectItem value="Fair">Fair</SelectItem>

            <SelectItem value="Poor">Poor</SelectItem>

          </SelectContent>

        </Select>

      </div>



      <Button

        type="submit"

        className="w-full bg-[#3456FF] hover:bg-[#3456FF]/90 text-white font-sans"

      >

        {submitLabel}

      </Button>

    </form>

  );

};

