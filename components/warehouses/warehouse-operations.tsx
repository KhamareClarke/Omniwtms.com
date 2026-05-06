// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "./SupabaseClient";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import JsBarcode from "jsbarcode";
import {
  Trash2,
  CheckCircle2,
  Truck,
  Package,
  Warehouse as WarehouseIcon,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";

interface Product {
  id: string;
  name: string;
  // add other fields as needed
}

interface Warehouse {
  id: string;
  name: string;
  // add other fields as needed
}

interface TruckArrivalForm {
  vehicle_registration: string;
  customer_name: string;
  driver_name: string;
  vehicle_size: string;
  load_type: string;
  arrival_time: string;
  warehouse_id: string;
}

interface TruckArrival extends TruckArrivalForm {
  id: string;
}

interface TruckItem {
  id: string;
  description: string;
  quantity: number;
  condition: string;
}

interface PutawayAssignment {
  id: string;
  truck_item_id: string;
  aisle: string;
  bay: string;
  level: string;
  position: string;
}

interface QualityCheck {
  id: string;
  truck_item_id: string;
  status: string;
  damage_image_url?: string;
  supervisor_name?: string;
  barcode?: string;
}

interface WarehouseOperationsProps {
  warehouseId?: string | null;
}

const steps = [
  "Truck Arrival",
  "Unloading",
  "Quality Check",
  "Warehouse Putaway",
];

// Set the workerSrc for pdfjsLib in browser environments
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const WarehouseLabel = dynamic(() => import("./WarehouseLabel"), {
  ssr: false,
});

export function WarehouseOperations({ warehouseId }: WarehouseOperationsProps) {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Truck Arrival
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [truckForm, setTruckForm] = useState<TruckArrivalForm>({
    vehicle_registration: "",
    customer_name: "",
    driver_name: "",
    vehicle_size: "",
    load_type: "",
    arrival_time: "",
    warehouse_id: "",
  });
  const [truckArrivalId, setTruckArrivalId] = useState<string | null>(null);

  // Step 2: Unloading
  const [items, setItems] = useState<TruckItem[]>([]);
  const [itemForm, setItemForm] = useState({
    description: "",
    quantity: "1",
    condition: "Good",
  });
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<{ [productId: string]: string }>({});
  const [showProductSelection, setShowProductSelection] = useState(false);

  // Step 3: Quality Check
  const [qualityChecks, setQualityChecks] = useState<{
    [itemId: string]: QualityCheck;
  }>({});
  const [supervisorName, setSupervisorName] = useState("");
  const [selectedQualityItems, setSelectedQualityItems] = useState<Set<string>>(new Set());

  // Step 4: Putaway
  const [putaways, setPutaways] = useState<PutawayAssignment[]>([]);
  const [putawayForm, setPutawayForm] = useState<{
    [itemId: string]: {
      section_id: string;
      quantity: number;
    };
  }>({});
  const [putawayError, setPutawayError] = useState<string | null>(null);
  const [warehouseSections, setWarehouseSections] = useState<any[]>([]);
  const [warehouseLayout, setWarehouseLayout] = useState<any>(null);
  const [selectedPutawayItems, setSelectedPutawayItems] = useState<Set<string>>(new Set());
  const [bulkSectionId, setBulkSectionId] = useState<string>("");

  // Workflow complete state
  const [workflowComplete, setWorkflowComplete] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TruckItem | null>(null);

  // Invoice generation state
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    weeks: "1",
    useWeeklyFee: true,
    additionalAmount: "0",
    notes: "",
  });
  const [calculatedAmount, setCalculatedAmount] = useState<string>("0.00");
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch current user and their warehouses
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      setCurrentUser(null);
      setWarehouses([]);
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    // Fetch only warehouses for this user
    supabase
      .from("warehouses")
      .select("*")
      .eq("client_id", user.id)
      .then(({ data }) => setWarehouses(data || []));
  }, []);

  // Fetch all items for the current truck arrival
  const fetchItemsForArrival = async (arrivalId: string | null) => {
    if (!arrivalId) {
      setItems([]);
      return;
    }
    console.log("Fetching items for truckArrivalId:", arrivalId);
    const { data: allItems, error: fetchError } = await supabase
      .from("truck_items")
      .select("*")
      .eq("truck_arrival_id", arrivalId);
    if (fetchError) {
      toast.error("Failed to fetch items");
      setItems([]);
      return;
    }
    console.log("Fetched items:", allItems?.length, allItems);
    setItems(allItems || []);
  };

  // Fetch products from inventory
  const fetchProducts = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("client_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to fetch products");
        return;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  // Fetch products when unloading step is shown
  useEffect(() => {
    if (currentStep === 1 && currentUser?.id) {
      fetchProducts();
      // If items already exist, don't show product selection by default
      setShowProductSelection(items.length === 0);
    }
  }, [currentStep, currentUser?.id]);

  // Update showProductSelection when items change
  useEffect(() => {
    if (items.length > 0 && showProductSelection) {
      // Hide product selection after items are added
      setShowProductSelection(false);
      // Clear selections
      setSelectedProducts(new Set());
      setProductQuantities({});
    }
  }, [items.length, showProductSelection]);

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      // Remove quantity when deselected
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
    } else {
      newSelected.add(productId);
      // Set default quantity to 1
      setProductQuantities({ ...productQuantities, [productId]: "1" });
    }
    setSelectedProducts(newSelected);
  };

  // Handle quantity change for selected product
  const handleProductQuantityChange = (productId: string, quantity: string) => {
    setProductQuantities({ ...productQuantities, [productId]: quantity });
  };

  // Add selected products to items
  const handleAddSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    if (!truckArrivalId) {
      toast.error("Truck arrival not registered");
      return;
    }

    setLoading(true);
    try {
      const itemsToAdd = Array.from(selectedProducts).map((productId) => {
        const product = products.find((p) => p.id === productId);
        const quantity = parseInt(productQuantities[productId] || "1", 10);
        return {
          truck_arrival_id: truckArrivalId,
          description: product?.name || product?.sku || "Unknown Product",
          quantity: quantity || 1,
          condition: "Good",
        };
      });

      // Insert all items at once
      const { data, error } = await supabase
        .from("truck_items")
        .insert(itemsToAdd)
        .select();

      if (error) {
        console.error("Error adding items:", error);
        toast.error("Failed to add items");
        return;
      }

      // Add to items state
      setItems([...items, ...(data || [])]);
      
      // Clear selections and hide product selection
      setSelectedProducts(new Set());
      setProductQuantities({});
      setShowProductSelection(false);
      
      toast.success(`Added ${itemsToAdd.length} product(s) successfully`);
    } catch (error) {
      console.error("Error adding products:", error);
      toast.error("Failed to add products");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Truck Arrival Handlers
  const handleTruckInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTruckForm({ ...truckForm, [name]: value });

    // If customer name is selected, find the matching customer
    if (name === "customer_name") {
      const customer = customers.find((c) => c.name === value);
      setSelectedCustomer(customer || null);
    }
  };

  // Customer selection handler
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer);
    if (customer) {
      setTruckForm({ ...truckForm, customer_name: customer.name });
    }
  };
  const canRegisterArrival = 
    truckForm.vehicle_registration?.trim() !== "" &&
    truckForm.customer_name?.trim() !== "" &&
    truckForm.driver_name?.trim() !== "" &&
    truckForm.vehicle_size?.trim() !== "" &&
    truckForm.load_type?.trim() !== "" &&
    truckForm.arrival_time?.trim() !== "" &&
    truckForm.warehouse_id?.trim() !== "" &&
    currentUser?.id;
  
  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Can register arrival:', canRegisterArrival);
      console.log('Truck form:', truckForm);
      console.log('Current user:', currentUser?.id);
    }
  }, [canRegisterArrival, truckForm, currentUser]);
  
  const handleRegisterArrival = async () => {
    if (!canRegisterArrival || !currentUser?.id) {
      toast.error("Please fill all required fields");
      throw new Error("Validation failed");
    }
    
    try {
      // Format arrival_time - datetime-local returns "YYYY-MM-DDTHH:mm"
      // PostgreSQL expects timestamp, so convert to ISO string
      let arrivalTimeValue: string;
      if (truckForm.arrival_time && truckForm.arrival_time.trim()) {
        const dateStr = truckForm.arrival_time.trim();
        // If it doesn't have seconds, add :00
        const normalizedDateStr = dateStr.includes(':') && dateStr.split(':').length === 2 
          ? `${dateStr}:00` 
          : dateStr;
        const date = new Date(normalizedDateStr);
        if (!isNaN(date.getTime())) {
          arrivalTimeValue = date.toISOString();
        } else {
          // Fallback to current time if invalid
          arrivalTimeValue = new Date().toISOString();
        }
      } else {
        arrivalTimeValue = new Date().toISOString();
      }
      
      // Prepare insert data - ensure all fields are strings (not empty strings)
      const insertData = {
        vehicle_registration: truckForm.vehicle_registration?.trim(),
        customer_name: truckForm.customer_name?.trim(),
        driver_name: truckForm.driver_name?.trim(),
        vehicle_size: truckForm.vehicle_size?.trim(),
        load_type: truckForm.load_type?.trim(),
        arrival_time: arrivalTimeValue,
        warehouse_id: truckForm.warehouse_id?.trim(),
        client_id: currentUser.id
      };
      
      // Validate all fields are present
      const missingFields = [];
      if (!insertData.vehicle_registration) missingFields.push('vehicle_registration');
      if (!insertData.customer_name) missingFields.push('customer_name');
      if (!insertData.driver_name) missingFields.push('driver_name');
      if (!insertData.vehicle_size) missingFields.push('vehicle_size');
      if (!insertData.load_type) missingFields.push('load_type');
      if (!insertData.arrival_time) missingFields.push('arrival_time');
      if (!insertData.warehouse_id) missingFields.push('warehouse_id');
      if (!insertData.client_id) missingFields.push('client_id');
      
      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("Inserting truck arrival:", JSON.stringify(insertData, null, 2));
      
      // Try the insert
      const response = await supabase
      .from("truck_arrivals")
        .insert([insertData])
      .select()
      .single();
      
      const { data, error } = response;
      
    if (error) {
        console.error("=== SUPABASE ERROR ===");
        console.error("Full error object:", JSON.stringify(error, null, 2));
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error("Insert data that failed:", JSON.stringify(insertData, null, 2));
        console.error("======================");
        
        // Try to get more details from the error
        let errorMessage = "Failed to register arrival";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        }
        
        toast.error(`Registration failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      if (!data || !data.id) {
        console.error("No data returned from insert");
        toast.error("Failed to register arrival - no data returned");
        throw new Error("No data returned");
      }
      
      console.log("Truck arrival registered successfully:", data.id);
    setTruckArrivalId(data.id);
    toast.success("Truck arrival registered!");
      
      // Fetch items for the arrival (don't await, do it in background)
      fetchItemsForArrival(data.id).catch(err => {
        console.error("Error fetching items:", err);
      });
      
      // Move to step 2 immediately
      console.log("Setting current step to 1");
    setCurrentStep(1);
      
      return data;
    } catch (error: any) {
      console.error("Exception registering arrival:", error);
      toast.error(error.message || "Failed to register arrival");
      throw error;
    }
  };

  // Step 2: Unloading Handlers
  const handleItemInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  };
  const canAddItem = itemForm.description && itemForm.quantity;
  const handleAddItem = async () => {
    if (!truckArrivalId) return;
    // Only add one item with the correct quantity
    const { data, error } = await supabase
      .from("truck_items")
      .insert([
        {
          truck_arrival_id: truckArrivalId,
          description: itemForm.description,
          quantity: parseInt(itemForm.quantity),
          condition: itemForm.condition,
        },
      ])
      .select()
      .single();
    if (error) {
      toast.error("Failed to add item");
      return;
    }
    setItems([...items, data]);
    setItemForm({ description: "", quantity: "1", condition: "Good" });
  };
  // Bulk upload CSV/Excel/PDF
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        let rows: any[] = [];
        if (ext === "csv") {
          const text = evt.target?.result as string;
          rows = text.split("\n").map((r) => r.split(","));
        } else {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }
        // Process rows: [description, quantity, condition]
        const newItems: TruckItem[] = [];
        for (const row of rows.slice(1)) {
          // skip header
          if (row.length < 2) continue;
          const [description, quantity, condition = "Good"] = row;
          if (!description || !quantity) continue;
          const { data, error } = await supabase
            .from("truck_items")
            .insert([
              {
                truck_arrival_id: truckArrivalId,
                description,
                quantity: parseInt(quantity),
                condition: condition || "Good",
              },
            ])
            .select()
            .single();
          if (error) {
            setBulkUploadError("Bulk upload failed");
            return;
          }
          newItems.push(data);
        }
        setItems([...items, ...newItems]);
      };
      if (ext === "csv") reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    } else if (ext === "pdf") {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const typedarray = new Uint8Array(evt.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        // Try to split text into rows/columns (basic, may need to adjust for your PDF format)
        const rows = text.split("\n").map((line) => line.split(/\s{2,}/));
        const newItems: TruckItem[] = [];
        for (const row of rows) {
          if (row.length < 2) continue;
          const [description, quantity, condition = "Good"] = row;
          if (!description || !quantity) continue;
          const { data, error } = await supabase
            .from("truck_items")
            .insert([
              {
                truck_arrival_id: truckArrivalId,
                description,
                quantity: parseInt(quantity),
                condition: condition || "Good",
              },
            ])
            .select()
            .single();
          if (error) {
            setBulkUploadError("Bulk upload failed");
            return;
          }
          newItems.push(data);
        }
        setItems([...items, ...newItems]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setBulkUploadError(
        "Unsupported file type. Please upload CSV, Excel, or PDF."
      );
    }
  };
  const canProceedUnloading = items.length > 0;

  // Step 3: Quality Check Handlers
  const handleQualityCheck = (itemId: string, status: string, file?: File) => {
    setQualityChecks({
      ...qualityChecks,
      [itemId]: { ...qualityChecks[itemId], status },
    });
    // Handle file upload for damage image if needed
    if (file) {
      // For demo, just set a fake URL
      setQualityChecks((qc) => ({
        ...qc,
        [itemId]: {
          ...qc[itemId],
          damage_image_url: URL.createObjectURL(file),
        },
      }));
    }
  };

  // Handle quality item selection
  const handleQualityItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedQualityItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedQualityItems(newSelected);
  };

  // Bulk mark selected items as pass
  const handleBulkMarkPass = () => {
    if (selectedQualityItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }
    const count = selectedQualityItems.size;
    const updatedChecks = { ...qualityChecks };
    selectedQualityItems.forEach((itemId) => {
      updatedChecks[itemId] = {
        ...updatedChecks[itemId],
        status: "ok",
      };
    });
    setQualityChecks(updatedChecks);
    setSelectedQualityItems(new Set());
    toast.success(`Marked ${count} item(s) as Pass`);
  };

  // Bulk mark selected items as fail
  const handleBulkMarkFail = () => {
    if (selectedQualityItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }
    const count = selectedQualityItems.size;
    const updatedChecks = { ...qualityChecks };
    selectedQualityItems.forEach((itemId) => {
      updatedChecks[itemId] = {
        ...updatedChecks[itemId],
        status: "damaged",
      };
    });
    setQualityChecks(updatedChecks);
    setSelectedQualityItems(new Set());
    toast.success(`Marked ${count} item(s) as Fail`);
  };
  const handleSupervisorSign = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSupervisorName(e.target.value);
  const handleFinishQualityCheck = async () => {
    try {
      // Validate that we have items and quality checks
      if (items.length === 0) {
        toast.error("No items to process");
        return;
      }

      const itemsWithQualityChecks = items.filter(item => qualityChecks[item.id]?.status);
      if (itemsWithQualityChecks.length === 0) {
        toast.error("Please complete quality checks for at least one item");
        return;
      }

      console.log(`Processing ${itemsWithQualityChecks.length} items with quality checks`);
      
      // Prepare all inserts in batches for faster processing
      const warehouseItemsToInsert = [];
      const qualityChecksToInsert = [];
      const now = new Date().toISOString();

    for (const item of items) {
      const qc = qualityChecks[item.id];
      if (!qc) continue;
        
      // Generate barcode (for demo, use item.id)
      const barcode = item.id;

        // Prepare warehouse item
        warehouseItemsToInsert.push({
        name: item.description,
        quantity: item.quantity,
        condition: item.condition,
        status: qc.status,
        client_id: currentUser?.id,
          created_at: now,
        truck_arrival_id: truckArrivalId,
      });

        // Prepare quality check
        qualityChecksToInsert.push({
          truck_item_id: item.id,
          status: qc.status,
          damage_image_url: qc.damage_image_url,
          supervisor_name: supervisorName,
          barcode,
        });
      }

      // Batch insert all warehouse items at once
      if (warehouseItemsToInsert.length > 0) {
      const { error: warehouseItemError } = await supabase
        .from("warehouse_items")
          .insert(warehouseItemsToInsert);

      if (warehouseItemError) {
        console.error("Warehouse item insert error:", warehouseItemError);
        toast.error(
            "Failed to add items to warehouse: " + warehouseItemError.message
          );
          throw warehouseItemError;
        }
      }

      // Batch insert all quality checks at once
      if (qualityChecksToInsert.length > 0) {
        const { error: qualityCheckError } = await supabase
          .from("quality_checks")
          .insert(qualityChecksToInsert);

        if (qualityCheckError) {
          console.error("Quality check insert error:", qualityCheckError);
          toast.error(
            "Failed to save quality checks: " + qualityCheckError.message
          );
          throw qualityCheckError;
        }
    }
    toast.success("Quality check complete!");
      console.log("Quality check complete, moving to step 3");
      // Use setTimeout to ensure state updates before changing step
      setTimeout(() => {
        console.log("Setting current step to 3");
    setCurrentStep(3); // Move to putaway step
      }, 100);
    } catch (error: any) {
      console.error("Error in handleFinishQualityCheck:", error);
      // Error already shown in toast above
      // Don't throw here, just let the function complete so loading state resets
    }
  };
  const canFinishQuality =
    items.every((item) => qualityChecks[item.id]?.status) && supervisorName;

  // Fetch warehouse sections for putaway
  const fetchWarehouseSections = async () => {
    if (!truckForm.warehouse_id) {
      toast.error("No warehouse selected");
      return;
    }

    try {
      // Fetch layout for the warehouse
      const { data: layout, error: layoutError } = await supabase
        .from("warehouse_layouts")
        .select("*")
        .eq("warehouse_id", truckForm.warehouse_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (layoutError && layoutError.code !== 'PGRST116') {
        console.error("Error fetching layout:", layoutError);
        toast.error("Failed to load warehouse layout");
        return;
      }

      if (!layout) {
        toast.error("No floor plan found for this warehouse. Please create one first.");
        return;
      }

      setWarehouseLayout(layout);

      // Fetch sections for this layout
      const { data: sections, error: sectionsError } = await supabase
        .from("warehouse_sections")
        .select("*")
        .eq("layout_id", layout.id)
        .order("section_name");

      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
        toast.error("Failed to load warehouse sections");
        return;
      }

      setWarehouseSections(sections || []);
    } catch (error) {
      console.error("Error fetching warehouse sections:", error);
      toast.error("Failed to load warehouse sections");
    }
  };

  // Fetch sections when putaway step is shown
  useEffect(() => {
    if (currentStep === 3 && truckForm.warehouse_id) {
      fetchWarehouseSections();
    }
  }, [currentStep, truckForm.warehouse_id]);

  // Step 4: Putaway Handlers
  const handlePutawayInput = (itemId: string, sectionId: string, quantity?: number) => {
    const item = items.find(i => i.id === itemId);
    const maxQuantity = item?.quantity || 0;
    let qty: number;
    
    if (quantity !== undefined) {
      qty = Math.min(Math.max(1, quantity), maxQuantity);
    } else if (putawayForm[itemId]?.quantity) {
      qty = putawayForm[itemId].quantity;
    } else {
      qty = maxQuantity; // Default to full quantity
    }
    
    setPutawayForm({
      ...putawayForm,
      [itemId]: { 
        section_id: sectionId,
        quantity: qty,
      },
    });
  };

  // Handle putaway item selection
  const handlePutawayItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedPutawayItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedPutawayItems(newSelected);
  };

  // Bulk assign selected items to a section
  const handleBulkAssignSection = () => {
    if (selectedPutawayItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }
    if (!bulkSectionId) {
      toast.error("Please select a section");
      return;
    }

    const updatedForm = { ...putawayForm };
    selectedPutawayItems.forEach((itemId) => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        updatedForm[itemId] = {
          section_id: bulkSectionId,
          quantity: item.quantity, // Default to full quantity
        };
      }
    });
    setPutawayForm(updatedForm);
    setSelectedPutawayItems(new Set());
    setBulkSectionId("");
    toast.success(`Assigned ${selectedPutawayItems.size} item(s) to section`);
  };

  const handleAssignPutaway = async () => {
    setPutawayError(null);
    
    // Validate that all items have sections assigned with valid quantities
    const itemsWithoutSections = items.filter(item => {
      const assignment = putawayForm[item.id];
      return !assignment?.section_id || !assignment.quantity || assignment.quantity <= 0 || assignment.quantity > item.quantity;
    });
    if (itemsWithoutSections.length > 0) {
      setPutawayError("Please assign all items to sections with valid quantities");
      return;
    }

    try {
      // Step 1: Batch fetch all existing products
      const itemDescriptions = items.map(item => item.description);
      const { data: existingProducts } = await supabase
        .from("products")
        .select("id, name")
        .eq("client_id", currentUser?.id)
        .in("name", itemDescriptions);

      const productMap = new Map();
      if (existingProducts) {
        existingProducts.forEach(p => productMap.set(p.name, p.id));
      }

      // Step 2: Identify products that need to be created
      const productsToCreate = items
        .filter(item => !productMap.has(item.description))
        .map(item => ({
          name: item.description,
          quantity: item.quantity,
          client_id: currentUser?.id,
        }));

      // Step 3: Batch create missing products
      if (productsToCreate.length > 0) {
        const { data: newProducts, error: productError } = await supabase
          .from("products")
          .insert(productsToCreate)
          .select("id, name");

        if (productError) {
          console.error("Error creating products:", productError);
          toast.error("Failed to create products");
          throw productError;
        }

        if (newProducts) {
          newProducts.forEach(p => productMap.set(p.name, p.id));
        }
      }

      // Step 4: Prepare all section_inventory inserts
      const sectionInventoryToInsert = [];
      const sectionUsageUpdates = new Map<string, number>(); // sectionId -> total quantity to add

    for (const item of items) {
        const assignment = putawayForm[item.id];
        if (!assignment?.section_id || !assignment.quantity) continue;

        const productId = productMap.get(item.description);
        if (!productId) {
          console.error(`Product ID not found for: ${item.description}`);
          continue;
        }

        const quantityToAssign = assignment.quantity;

        sectionInventoryToInsert.push({
          section_id: assignment.section_id,
          product_id: productId,
          quantity: quantityToAssign,
          notes: `From truck arrival: ${truckForm.vehicle_registration}`,
        });

        // Track usage updates
        const currentUsage = sectionUsageUpdates.get(assignment.section_id) || 0;
        sectionUsageUpdates.set(assignment.section_id, currentUsage + quantityToAssign);
      }

      // Step 5: Batch insert all section_inventory records
      if (sectionInventoryToInsert.length > 0) {
        const { error: inventoryError } = await supabase
          .from("section_inventory")
          .insert(sectionInventoryToInsert);

        if (inventoryError) {
          console.error("Error adding to section inventory:", inventoryError);
          toast.error("Failed to assign items to sections");
          throw inventoryError;
        }
      }

      // Step 6: Batch update section current_usage
      const sectionUpdates = Array.from(sectionUsageUpdates.entries()).map(([sectionId, quantityToAdd]) => {
        const section = warehouseSections.find(s => s.id === sectionId);
        const newUsage = (section?.current_usage || 0) + quantityToAdd;
        return {
          id: sectionId,
          current_usage: newUsage,
        };
      });

      // Update sections in parallel
      await Promise.all(
        sectionUpdates.map(update =>
          supabase
            .from("warehouse_sections")
            .update({ current_usage: update.current_usage })
            .eq("id", update.id)
        )
      );

      toast.success("Items assigned to sections successfully!");
    setWorkflowComplete(true);
    } catch (error: any) {
      console.error("Error assigning putaway:", error);
      setPutawayError(error.message || "Failed to assign items to sections");
      toast.error("Failed to assign items to sections");
    }
  };
  // Check if all items have sections assigned with valid quantities
  const canProceedPutaway = items.length > 0 && items.every(
    (item) => {
      const assignment = putawayForm[item.id];
      return assignment?.section_id && 
             assignment.quantity > 0 && 
             assignment.quantity <= item.quantity;
    }
  );

  // Stepper icons
  const stepIcons = [Truck, Package, WarehouseIcon, ShieldCheck];

  // Remove item with confirmation dialog
  const handleRemoveItem = (item: TruckItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };
  const confirmRemoveItem = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    const { error } = await supabase
      .from("truck_items")
      .delete()
      .eq("id", itemToDelete.id);
    setLoading(false);
    setShowDeleteDialog(false);
    if (!error) setItems(items.filter((i) => i.id !== itemToDelete.id));
    else toast.error("Failed to remove item");
    setItemToDelete(null);
  };

  // Calculate invoice amount based on weekly fee and additional charges
  const calculateInvoiceAmount = () => {
    let total = 0;

    // Add weekly fee if selected and available
    if (invoiceForm.useWeeklyFee && selectedCustomer?.weekly_fee) {
      const weeksNum = parseInt(invoiceForm.weeks, 10) || 1;
      total += selectedCustomer.weekly_fee * weeksNum;
    }

    // Add additional amount if provided
    if (invoiceForm.additionalAmount) {
      total += parseFloat(invoiceForm.additionalAmount) || 0;
    }

    setCalculatedAmount(total.toFixed(2));
    return total;
  };

  // Handle invoice form changes
  const handleInvoiceFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInvoiceForm({ ...invoiceForm, [name]: value });

    // Recalculate amount when form changes
    setTimeout(calculateInvoiceAmount, 0);
  };

  // Toggle weekly fee usage
  const handleToggleWeeklyFee = (value: boolean) => {
    setInvoiceForm({ ...invoiceForm, useWeeklyFee: value });
    setTimeout(calculateInvoiceAmount, 0);
  };

  // Generate and save invoice
  const handleGenerateInvoice = async () => {
    if (!selectedCustomer) {
      toast.error("No customer selected");
      return;
    }

    try {
      // Calculate final amount
      const amount = calculateInvoiceAmount();

      // Generate invoice number
      const invoiceNumber = `INV-${nanoid(8).toUpperCase()}`;

      // Create invoice in database
      const { data, error } = await supabase
        .from("invoices")
        .insert([
          {
            number: invoiceNumber,
            customer: selectedCustomer.name,
            amount: amount,
            currency: "GBP",
            status: "pending",
            created_at: new Date().toISOString(),
            notes: invoiceForm.notes,
            operation_id: truckArrivalId,
          },
        ])
        .select();

      if (error) throw error;

      toast.success("Invoice generated successfully");
      setShowInvoiceDialog(false);

      // Reset form
      setInvoiceForm({
        weeks: "1",
        useWeeklyFee: true,
        additionalAmount: "0",
        notes: "",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  // Spinner component
  const Spinner = () => (
    <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle"></span>
  );

  // UI
  return (
    <div 
      ref={mainRef} 
      className="space-y-8 max-w-4xl mx-auto px-2 md:px-0 relative" 
      style={{ zIndex: 50, position: 'relative', transform: 'translateZ(0)' }}
    >
      <h1 className="text-2xl font-bold mb-2">Warehouse Operations</h1>
      {/* Workflow Complete Card */}
      {workflowComplete ? (
        <Card className="text-center py-12 mx-auto max-w-xl mt-16 animate-fade-in glass-card border border-gray-200">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
          <CardHeader>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br from-green-400 to-green-500 mb-4">
              <CheckCircle2 className="text-white" size={36} />
            </div>
            <CardTitle className="text-3xl mb-2 font-heading bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              Workflow Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg mb-4 font-sans">
              All items have been processed and transferred to inventory
            </div>
            <div className="font-semibold text-green-600 mb-8 font-sans">
              Warehouse Operation Complete!
              <br />
              All {items.length} items have been processed and are now available
              in inventory.
            </div>
            <Button
              onClick={() => {
                setCurrentStep(0);
                setTruckForm({
                  vehicle_registration: "",
                  customer_name: "",
                  driver_name: "",
                  vehicle_size: "",
                  load_type: "",
                  arrival_time: "",
                  warehouse_id: "",
                });
                setTruckArrivalId(null);
                setItems([]);
                setItemForm({
                  description: "",
                  quantity: "1",
                  condition: "Good",
                });
                setBulkUploadError(null);
                setPutaways([]);
                setPutawayForm({});
                setPutawayError(null);
                setQualityChecks({});
                setSupervisorName("");
                setWorkflowComplete(false);
                if (mainRef.current)
                  mainRef.current.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 transition-all shadow-md font-medium mt-2"
            >
              <div className="absolute inset-0 overflow-hidden rounded-md">
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shimmer" />
              </div>
              Start New Operation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stepper with enhanced styling */}
          <div className="flex items-center mb-8 justify-center">
            {steps.map((step, idx) => {
              const Icon = stepIcons[idx];
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <React.Fragment key={step}>
                  <div
                    className={`flex flex-col items-center ${
                      isActive
                        ? "text-[#3456FF]"
                        : isCompleted
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`rounded-full w-12 h-12 flex items-center justify-center border-2 ${
                        isActive
                          ? "border-[#3456FF] bg-[#3456FF]/10 shadow-md"
                          : isCompleted
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 bg-white"
                      } mb-1`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            isActive ? "animate-pulse-slow" : ""
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-[#3456FF]"
                          : isCompleted
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-400 to-green-500"
                          : idx === currentStep - 1
                          ? "bg-gradient-to-r from-green-500 to-[#3456FF]/50"
                          : isActive
                          ? "bg-gradient-to-r from-[#3456FF]/50 to-gray-200"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {/* Step 1: Truck Arrival - Redesigned */}
          {currentStep === 0 && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Register Truck Arrival</h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log("=== BUTTON CLICKED ===");
                    console.log("Can register:", canRegisterArrival);
                    console.log("Form data:", truckForm);
                    console.log("User:", currentUser?.id);
                    console.log("Loading:", loading);
                    
                    if (loading) {
                      console.log("Already loading, ignoring");
                      return;
                    }
                    
                    if (!canRegisterArrival) {
                      const missing = [];
                      if (!truckForm.vehicle_registration?.trim()) missing.push("Vehicle Registration");
                      if (!truckForm.customer_name?.trim()) missing.push("Customer Name");
                      if (!truckForm.driver_name?.trim()) missing.push("Driver Name");
                      if (!truckForm.vehicle_size?.trim()) missing.push("Vehicle Size");
                      if (!truckForm.load_type?.trim()) missing.push("Load Type");
                      if (!truckForm.arrival_time?.trim()) missing.push("Arrival Time");
                      if (!truckForm.warehouse_id?.trim()) missing.push("Warehouse");
                      if (!currentUser?.id) missing.push("User not logged in");
                      toast.error(`Please fill: ${missing.join(", ")}`);
                      return;
                    }
                    
                    setLoading(true);
                    handleRegisterArrival()
                      .then((result) => {
                        console.log("Registration successful, result:", result);
                        console.log("Moving to step 2, current step:", currentStep);
                        // Step change is handled inside handleRegisterArrival
                      })
                      .catch((error) => {
                        console.error("Error in button handler:", error);
                        toast.error("An error occurred: " + (error.message || "Unknown error"));
                      })
                      .finally(() => {
                        console.log("Finally block - setting loading to false");
                        setLoading(false);
                      });
                  }}
                  className={`
                    px-8 py-3 rounded-md font-semibold text-white text-lg
                    ${canRegisterArrival && !loading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-95'
                      : 'bg-gray-400 cursor-not-allowed'
                    }
                    ${loading ? 'opacity-50' : ''}
                  `}
                  style={{
                    minWidth: '200px',
                    position: 'relative',
                    zIndex: 10000,
                    pointerEvents: 'auto',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {loading ? "Processing..." : "Register Arrival"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Vehicle Registration *
                    </label>
                  <input
                    type="text"
                      name="vehicle_registration"
                      value={truckForm.vehicle_registration}
                      onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vehicle registration"
                    />
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Customer Name *
                    </label>
                  <input
                    type="text"
                      name="customer_name"
                      value={truckForm.customer_name}
                      onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer name"
                    />
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Driver Name *
                    </label>
                  <input
                    type="text"
                      name="driver_name"
                      value={truckForm.driver_name}
                      onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter driver name"
                    />
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Vehicle Size *
                    </label>
                  <select
                      name="vehicle_size"
                      value={truckForm.vehicle_size}
                    onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Vehicle Size</option>
                    <option value="VAN">VAN</option>
                    <option value="7.5T">7.5T</option>
                    <option value="18T">18T</option>
                    <option value="32T">32T</option>
                  </select>
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Load Type *
                    </label>
                  <select
                      name="load_type"
                      value={truckForm.load_type}
                    onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Load Type</option>
                    <option value="PALLETIZED">PALLETIZED</option>
                    <option value="LOOSE">LOOSE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Arrival Time *
                    </label>
                  <input
                      type="datetime-local"
                    name="arrival_time"
                      value={truckForm.arrival_time}
                      onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                
                  <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Select Warehouse *
                    </label>
                  <select
                      name="warehouse_id"
                      value={truckForm.warehouse_id}
                    onChange={handleTruckInput}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <option value="">Select Warehouse</option>
                        {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                            {w.name}
                      </option>
                        ))}
                  </select>
                  </div>
                      </div>
                  </div>
          )}
          {/* Step 2: Unloading */}
          {currentStep === 1 && (
            <Card className="glass-card border-gray-200 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90"
                    disabled={!canProceedUnloading || loading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep(2);
                    }}
                  >
                    Proceed to Quality Check
                  </Button>
                </div>
                <CardTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Unloading
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  Select products from inventory to add to the truck arrival. You can select multiple products.
                </p>
              </CardHeader>
              <CardContent>
                {/* Items List - Show first if items exist */}
                {items.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold font-sans">Items Added to Truck Arrival ({items.length})</h3>
                      {!showProductSelection && (
                  <Button
                    type="button"
                          variant="outline"
                          onClick={() => setShowProductSelection(true)}
                          className="border-[#3456FF] text-[#3456FF] hover:bg-[#3456FF] hover:text-white"
                        >
                          Add More Products
                  </Button>
                  )}
                </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.condition}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Remove item"
                              onClick={() => handleRemoveItem(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                  </div>
                )}

                {/* Products Selection - Only show when showProductSelection is true */}
                {showProductSelection && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold font-sans">
                        {items.length > 0 ? "Add More Products from Inventory" : "Select Products from Inventory"}
                      </h3>
                      <div className="flex gap-2">
                        {items.length > 0 && (
                <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowProductSelection(false);
                              setSelectedProducts(new Set());
                              setProductQuantities({});
                            }}
                          >
                            Cancel
                </Button>
                        )}
                        {selectedProducts.size > 0 && (
                          <Button
                            type="button"
                            disabled={loading}
                            onClick={handleAddSelectedProducts}
                            className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90"
                          >
                            {loading ? <Spinner /> : `Add ${selectedProducts.size} Selected Product(s)`}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No products found in inventory.</p>
                        <p className="text-xs mt-2">Add products from the Inventory page first.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <Table className="min-w-full text-sm">
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.size === products.length && products.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const allIds = new Set(products.map(p => p.id));
                                      setSelectedProducts(allIds);
                                      const quantities: { [key: string]: string } = {};
                                      products.forEach(p => {
                                        quantities[p.id] = "1";
                                      });
                                      setProductQuantities(quantities);
                                    } else {
                                      setSelectedProducts(new Set());
                                      setProductQuantities({});
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product, idx) => (
                              <TableRow
                                key={product.id}
                                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() => handleProductSelect(product.id)}
                                    className="rounded border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{product.name || "N/A"}</TableCell>
                                <TableCell>{product.sku || "N/A"}</TableCell>
                                <TableCell>{product.category || "N/A"}</TableCell>
                                <TableCell>
                                  {selectedProducts.has(product.id) ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={productQuantities[product.id] || "1"}
                                      onChange={(e) => handleProductQuantityChange(product.id, e.target.value)}
                                      className="w-20 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {/* Show "Add Products" button if no items and product selection is hidden */}
                {items.length === 0 && !showProductSelection && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No items added yet.</p>
                    <Button
                      type="button"
                      onClick={() => setShowProductSelection(true)}
                      className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90"
                    >
                      Add Products from Inventory
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Item</DialogTitle>
              </DialogHeader>
              <div>Are you sure you want to remove this item?</div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRemoveItem}
                  disabled={loading}
                >
                  {loading ? <Spinner /> : "Remove"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Generate Invoice Dialog */}
          <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Generate Invoice for {selectedCustomer?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedCustomer?.weekly_fee ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Use Weekly Fee (£
                        {parseFloat(selectedCustomer.weekly_fee).toFixed(2)}
                        /week)
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant={
                            invoiceForm.useWeeklyFee ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleToggleWeeklyFee(true)}
                          className={
                            invoiceForm.useWeeklyFee
                              ? "bg-blue-600 text-white"
                              : ""
                          }
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={
                            !invoiceForm.useWeeklyFee ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleToggleWeeklyFee(false)}
                          className={
                            !invoiceForm.useWeeklyFee ? "bg-gray-200" : ""
                          }
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    {invoiceForm.useWeeklyFee && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Number of Weeks
                        </label>
                        <Input
                          name="weeks"
                          type="number"
                          min="1"
                          step="1"
                          value={invoiceForm.weeks}
                          onChange={handleInvoiceFormChange}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    No weekly fee set for this customer. You can set a weekly
                    fee in the Customers page.
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional Amount (£)
                  </label>
                  <Input
                    name="additionalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceForm.additionalAmount}
                    onChange={handleInvoiceFormChange}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    For extra services, materials, or special charges
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    name="notes"
                    value={invoiceForm.notes}
                    onChange={handleInvoiceFormChange}
                    className="w-full"
                    placeholder="Operation details, special instructions, etc."
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">
                      £{calculatedAmount}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex space-x-2 sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
                >
                  Generate Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Step 3: Quality Check */}
          {currentStep === 2 && (
            <Card className="glass-card border-gray-200 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Supervisor Name"
                      value={supervisorName}
                      onChange={handleSupervisorSign}
                      className="w-48 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10"
                    />
                    <Button
                      type="button"
                      disabled={!canFinishQuality || completing}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCompleting(true);
                        try {
                          await handleFinishQualityCheck();
                        } catch (error) {
                          console.error("Error in quality check:", error);
                          // Error already handled in handleFinishQualityCheck
                        } finally {
                          setCompleting(false);
                        }
                      }}
                      className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90 transition-all shadow-md font-medium"
                    >
                      {completing ? <Spinner /> : "Proceed to Putaway"}
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Quality Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bulk Actions */}
                {selectedQualityItems.size > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedQualityItems.size} item(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBulkMarkPass}
                        className="border-green-500 text-green-700 hover:bg-green-50"
                      >
                        Mark Selected as Pass
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBulkMarkFail}
                        className="border-red-500 text-red-700 hover:bg-red-50"
                      >
                        Mark Selected as Fail
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQualityItems(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedQualityItems.size === items.length && items.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = new Set(items.map(item => item.id));
                                setSelectedQualityItems(allIds);
                              } else {
                                setSelectedQualityItems(new Set());
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Description
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Status
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Damage Image
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedQualityItems.has(item.id)}
                              onChange={() => handleQualityItemSelect(item.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.description}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={qualityChecks[item.id]?.status || ""}
                              onValueChange={(val) =>
                                handleQualityCheck(item.id, val)
                              }
                            >
                              <SelectTrigger className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all">
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-200 shadow-lg font-sans">
                                <SelectItem value="ok">OK</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {qualityChecks[item.id]?.status === "damaged" && (
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    handleQualityCheck(
                                      item.id,
                                      "damaged",
                                      file
                                    );
                                }}
                                className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"
                              />
                            )}
                            {qualityChecks[item.id]?.damage_image_url && (
                              <img
                                src={qualityChecks[item.id].damage_image_url}
                                alt="Damage"
                                className="w-16 h-16 object-cover mt-2 rounded border"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Step 4: Putaway */}
          {currentStep === 3 && (
            <Card className="glass-card border-gray-200 shadow-md">
              <CardHeader>
                <Button
                  variant="outline"
                  className="mb-4"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
                <CardTitle className="text-xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Warehouse Putaway
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warehouseSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sections found for this warehouse.</p>
                    <p className="text-xs mt-2">Please create sections in the Warehouse Visualization page first.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>From Truck Arrival:</strong> {truckForm.vehicle_registration} - {truckForm.customer_name}
                      </p>
                    </div>

                    {/* Bulk Assignment Controls */}
                    {selectedPutawayItems.size > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            {selectedPutawayItems.size} item(s) selected
                          </span>
                          <div className="flex items-center gap-2">
                            <Select
                              value={bulkSectionId}
                              onValueChange={setBulkSectionId}
                            >
                              <SelectTrigger className="w-64 border-gray-300">
                                <SelectValue placeholder="Select Section for Bulk Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouseSections.map((section) => (
                                  <SelectItem key={section.id} value={section.id}>
                                    {section.section_name} ({section.section_type}) - 
                                    Usage: {section.current_usage || 0}/{section.capacity}
                                    {section.is_blocked && " [BLOCKED]"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleBulkAssignSection}
                              disabled={!bulkSectionId}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Assign Selected
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPutawayItems(new Set())}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <Table className="min-w-full text-sm">
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={selectedPutawayItems.size === items.length && items.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allIds = new Set(items.map(item => item.id));
                                    setSelectedPutawayItems(allIds);
                                  } else {
                                    setSelectedPutawayItems(new Set());
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Product Description
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Total Quantity
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Quality Status
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Condition
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Assign Quantity
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Assign to Section
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, idx) => (
                            <TableRow
                              key={item.id}
                              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedPutawayItems.has(item.id)}
                                  onChange={() => handlePutawayItemSelect(item.id)}
                                  className="rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-medium">
                                {item.description}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {qualityChecks[item.id]?.status ? (
                                  <Badge
                                    variant={
                                      qualityChecks[item.id].status === "ok"
                                        ? "default"
                                        : "destructive"
                                    }
                                    className={
                                      qualityChecks[item.id].status === "ok"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }
                                  >
                                    {qualityChecks[item.id].status === "ok"
                                      ? "Pass"
                                      : "Fail"}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not checked</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline">{item.condition}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={putawayForm[item.id]?.quantity || item.quantity}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || item.quantity;
                                    const sectionId = putawayForm[item.id]?.section_id || "";
                                    handlePutawayInput(item.id, sectionId, qty);
                                  }}
                                  className="w-20 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10"
                                  disabled={!putawayForm[item.id]?.section_id}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={putawayForm[item.id]?.section_id || ""}
                                  onValueChange={(value) =>
                                    handlePutawayInput(item.id, value)
                                  }
                                >
                                  <SelectTrigger className="border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all">
                                    <SelectValue placeholder="Select Section" />
                                  </SelectTrigger>
                                  <SelectContent className="border-gray-200 shadow-lg font-sans">
                                    {warehouseSections.map((section) => (
                                      <SelectItem key={section.id} value={section.id} disabled={section.is_blocked}>
                                        {section.section_name} ({section.section_type}) - 
                                        Usage: {section.current_usage || 0}/{section.capacity}
                                        {section.is_blocked && " [BLOCKED]"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                {putawayError && (
                  <div className="text-red-500 text-xs mt-2">
                    {putawayError}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="w-full md:w-auto bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90"
                    disabled={!canProceedPutaway}
                    onClick={handleAssignPutaway}
                  >
                    Assign Putaway
                  </Button>
                </div>
                {/* Render warehouse labels for each item with assigned location */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.flatMap((item) =>
                    Array.from({ length: item.quantity }, (_, idx) => {
                      const rowKey = `${item.id}-${idx}`;
                      const p = putawayForm[rowKey] || {};
                      // Format date and time
                      let arrivalDate = "";
                      let arrivalTime = "";
                      if (truckForm.arrival_time) {
                        const d = new Date(truckForm.arrival_time);
                        arrivalDate = d.toLocaleDateString();
                        arrivalTime = d.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }
                      return (
                        <div
                          key={rowKey}
                          className="flex flex-col items-center mb-8 relative group"
                        >
                          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const labelElement = document.getElementById(
                                  `label-${rowKey}`
                                );
                                if (labelElement) {
                                  html2canvas(labelElement).then((canvas) => {
                                    const link = document.createElement("a");
                                    link.download = `warehouse-label-${item.description}-${p.aisle}-${p.bay}-${p.level}-${p.position}.png`;
                                    link.href = canvas.toDataURL();
                                    link.click();
                                  });
                                }
                              }}
                              className="bg-white shadow-md hover:bg-gray-50"
                            >
                              Download Label
                            </Button>
                          </div>
                          <div
                            id={`label-${rowKey}`}
                            className="transform hover:scale-105 transition-transform duration-200"
                          >
                            <WarehouseLabel
                              company={
                                truckForm.customer_name
                                  ? truckForm.customer_name + " Warehouse"
                                  : "Warehouse Label"
                              }
                              customerName={truckForm.customer_name}
                              dateOfArrival={arrivalDate}
                              timeOfArrival={arrivalTime}
                              aisle={p.aisle}
                              bay={p.bay}
                              level={p.level}
                              position={p.position}
                              barcodeValue={item.id}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
