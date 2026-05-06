"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group } from "react-konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Settings, Package, ArrowRight, Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/auth/SupabaseClient";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SectionInventory {
  id: string;
  section_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
  products?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface WarehouseSection {
  id?: string;
  row_index: number;
  column_index: number;
  section_name: string;
  section_type: string;
  capacity: number;
  current_usage: number;
  usage_percentage: number;
  is_blocked: boolean;
  color?: string;
  notes?: string;
  section_inventory?: SectionInventory[];
}

interface WarehouseLayout {
  id: string;
  warehouse_id: string;
  image_url: string;
  image_width?: number;
  image_height?: number;
  grid_rows: number;
  grid_columns: number;
}

interface WarehouseFloorPlanProps {
  warehouseId: string;
}

export function WarehouseFloorPlan({ warehouseId }: WarehouseFloorPlanProps) {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null);
  const [sections, setSections] = useState<WarehouseSection[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showMoveStockDialog, setShowMoveStockDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<WarehouseSection | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [gridRows, setGridRows] = useState(10);
  const [gridColumns, setGridColumns] = useState(10);
  const [configForm, setConfigForm] = useState({
    section_name: "",
    section_type: "storage",
    capacity: 0,
    is_blocked: false,
    notes: "",
  });
  const [moveStockForm, setMoveStockForm] = useState({
    product_id: "",
    section_id: "",
    quantity: 1,
    notes: "",
  });
  const [selectedProductsToMove, setSelectedProductsToMove] = useState<Set<string>>(new Set());
  const [productQuantitiesToMove, setProductQuantitiesToMove] = useState<{ [inventoryId: string]: number }>({});
  const [isMovingStock, setIsMovingStock] = useState(false);
  const [isTransferringStock, setIsTransferringStock] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_section_id: "",
    to_section_id: "",
    product_id: "",
    quantity: 1,
    notes: "",
  });
  const [draggedProduct, setDraggedProduct] = useState<{
    inventoryId: string;
    productId: string;
    sectionId: string;
    quantity: number;
    productName: string;
  } | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<WarehouseSection | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(0.6);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [fullscreenPosition, setFullscreenPosition] = useState({ x: 0, y: 0 });
  const [isFullscreenDragging, setIsFullscreenDragging] = useState(false);
  const [lastFullscreenPointerPosition, setLastFullscreenPointerPosition] = useState({ x: 0, y: 0 });
  const [fullscreenDragStartPos, setFullscreenDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [fullscreenStageSize, setFullscreenStageSize] = useState({ width: 1200, height: 800 });
  const [shouldCenterFullscreen, setShouldCenterFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    open: boolean;
  }>({ type: "success", title: "", message: "", open: false });
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<any>(null);
  const fullscreenStageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Load layout and sections
  useEffect(() => {
    if (warehouseId) {
      loadLayout();
      loadProducts();
    }
  }, [warehouseId]);

  // Ensure bucket exists when component loads
  useEffect(() => {
    const ensureBucket = async () => {
      try {
        await fetch("/api/warehouse/ensure-bucket", {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to ensure bucket exists:", error);
      }
    };
    ensureBucket();
  }, []);

  // Load image when layout changes and calculate responsive size
  useEffect(() => {
    const calculateStageSize = () => {
      if (!containerRef.current || !image) return;
      
      // Get the container and find the actual content area
      const container = containerRef.current;
      const card = container.querySelector('[class*="Card"]') as HTMLElement;
      const cardContent = card?.querySelector('[class*="CardContent"]') as HTMLElement;
      const borderDiv = cardContent?.querySelector('[class*="border-2"]') as HTMLElement;
      
      // Use the border div if available, otherwise fall back to cardContent or container
      const contentArea = borderDiv || cardContent || container;
      const contentRect = contentArea.getBoundingClientRect();
      
      // Account for padding - use 95% to ensure it fits with some margin
      const padding = 20;
      const availableWidth = Math.max(200, contentRect.width - padding);
      const availableHeight = Math.max(150, contentRect.height - padding);
      
      // Ensure we have valid dimensions
      if (availableWidth <= 0 || availableHeight <= 0) return;
      
      const aspectRatio = image.width / image.height;
      
      // Calculate size that fits within available space while maintaining aspect ratio
      // Start with width constraint
      let width = availableWidth;
      let height = width / aspectRatio;
      
      // If height exceeds available space, use height constraint instead
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }
      
      // Final safety check - ensure both dimensions fit
      if (width > availableWidth) {
        width = availableWidth;
        height = width / aspectRatio;
      }
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }
      
      // Final size - ensure it fits completely, scaled down to 70% for smaller display
      const scaleFactor = 0.7;
      const finalWidth = Math.floor(Math.min(width, availableWidth) * scaleFactor);
      const finalHeight = Math.floor(Math.min(height, availableHeight) * scaleFactor);
      
      setStageSize({ 
        width: Math.max(200, finalWidth),
        height: Math.max(150, finalHeight)
      });
    };

    if (layout?.image_url && !image) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setImageLoaded(true);
        // Reset zoom and position when new image loads - start at 60% zoom
        setScale(0.6);
        setPosition({ x: 0, y: 0 });
        // Wait for DOM to render before calculating
        setTimeout(calculateStageSize, 300);
      };
      img.onerror = () => {
        setImageLoaded(false);
        toast.error("Failed to load floor plan image. The storage bucket may not exist. Please re-upload the image.");
        console.error("Image load error - URL:", layout.image_url);
      };
      img.src = layout.image_url;
    } else if (image) {
      setImageLoaded(true);
      // Wait for DOM to render before calculating
      setTimeout(calculateStageSize, 200);
    } else {
      setImageLoaded(false);
    }

    // Recalculate on window resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateStageSize, 150);
    };
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateStageSize, 100);
      });
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [layout, image]);

  const loadLayout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/warehouse/layout?warehouse_id=${warehouseId}`);
      const data = await response.json();
      
      if (data.layout) {
        setLayout(data.layout);
        setGridRows(data.layout.grid_rows || 10);
        setGridColumns(data.layout.grid_columns || 10);
        
        // Load image immediately if available
        if (data.layout.image_url) {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            setImage(img);
            setImageLoaded(true);
            if (containerRef.current) {
              const containerWidth = (containerRef.current.clientWidth - 40) * 0.7;
              const aspectRatio = img.width / img.height;
              const height = containerWidth / aspectRatio;
              setStageSize({ width: containerWidth, height: Math.min(height, 600 * 0.7) });
            }
          };
          img.onerror = () => {
            setImageLoaded(false);
            console.error("Failed to load layout image");
          };
          img.src = data.layout.image_url;
        }
        
        // Load sections with full inventory details including products
        const sectionsResponse = await fetch(`/api/warehouse/sections?layout_id=${data.layout.id}`);
        const sectionsData = await sectionsResponse.json();
        console.log("Loaded sections with inventory:", sectionsData.sections);
        setSections(sectionsData.sections || []);
      } else {
        setLayout(null);
        setSections([]);
        setImage(null);
        setImageLoaded(false);
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      toast.error("Failed to load layout");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) return;

      const userData = JSON.parse(currentUser);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, quantity")
        .eq("client_id", userData.id)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading image...");

      // Use API route for upload (handles bucket creation and uses service role key)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('warehouseId', warehouseId);

      const uploadResponse = await fetch("/api/warehouse/upload-image", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || uploadResult.details || "Failed to upload image");
      }

      const imageUrl = uploadResult.url;

      // Create image to get dimensions
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Save layout with all information including grid settings
        saveLayout(imageUrl, img.width, img.height, gridRows, gridColumns);
        toast.success("Image uploaded successfully! Layout created with grid settings.");
      };
      img.onerror = () => {
        toast.error("Failed to load image");
      };
      img.src = imageUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    }
  };

  const saveLayout = async (imageUrl: string, width: number, height: number, rows?: number, cols?: number) => {
    try {
      const rowsToSave = rows !== undefined ? rows : gridRows;
      const colsToSave = cols !== undefined ? cols : gridColumns;
      
      const response = await fetch("/api/warehouse/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          image_url: imageUrl,
          image_width: width,
          image_height: height,
          grid_rows: rowsToSave,
          grid_columns: colsToSave,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Update layout and grid settings
      setLayout(data.layout);
      if (rows !== undefined) {
        setGridRows(rows);
      } else if (data.layout.grid_rows) {
        setGridRows(data.layout.grid_rows);
      }
      if (cols !== undefined) {
        setGridColumns(cols);
      } else if (data.layout.grid_columns) {
        setGridColumns(data.layout.grid_columns);
      }
      
      // Load the image and display it
      if (data.layout.image_url) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setImage(img);
          setImageLoaded(true);
          if (containerRef.current) {
            const containerWidth = (containerRef.current.clientWidth - 40) * 0.7;
            const aspectRatio = img.width / img.height;
            const height = containerWidth / aspectRatio;
            setStageSize({ width: containerWidth, height: Math.min(height, 600 * 0.7) });
          }
        };
        img.onerror = () => {
          setImageLoaded(false);
          toast.error("Failed to load layout image");
        };
        img.src = data.layout.image_url;
      }
      
      // Reload sections to get any existing sections
      await loadLayout();
      
      toast.success(`Layout created successfully with ${rowsToSave}x${colsToSave} grid!`);
      setFeedbackModal({
        type: "success",
        title: "Layout saved",
        message: `Grid saved as ${rowsToSave}×${colsToSave}. Changes persist across sessions.`,
        open: true,
      });
    } catch (error: any) {
      const msg = error.message || "Failed to save layout";
      toast.error(msg);
      setFeedbackModal({ type: "error", title: "Save layout failed", message: msg, open: true });
    }
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    const section = sections.find(
      (s) => s.row_index === row && s.column_index === col
    );

    if (section) {
      setSelectedSection(section);
      setConfigForm({
        section_name: section.section_name,
        section_type: section.section_type,
        capacity: section.capacity,
        is_blocked: section.is_blocked,
        notes: section.notes ?? "",
      });
    } else {
      setSelectedSection(null);
      setConfigForm({
        section_name: `Section ${row}-${col}`,
        section_type: "storage",
        capacity: 0,
        is_blocked: false,
        notes: "",
      });
    }
    setShowConfigDialog(true);
  };

  const cellIdA1 = (row: number, col: number) =>
    `${String.fromCharCode(65 + col)}${row + 1}`;

  const saveSection = async () => {
    if (!layout || !selectedCell || isSavingSection) return;

    setIsSavingSection(true);
    try {
      const response = await fetch("/api/warehouse/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_id: layout.id,
          row_index: selectedCell.row,
          column_index: selectedCell.col,
          section_name: configForm.section_name,
          section_type: configForm.section_type,
          capacity: configForm.capacity,
          is_blocked: configForm.is_blocked,
          notes: configForm.notes || null,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Reload sections
      await loadLayout();
      setShowConfigDialog(false);
      setSelectedCell(null);
      setSelectedSection(null);
      toast.success("Section saved successfully");
      setFeedbackModal({
        type: "success",
        title: "Section saved",
        message: `${configForm.section_name} updated. Changes persist across sessions.`,
        open: true,
      });
    } catch (error: any) {
      const msg = error.message || "Failed to save section";
      toast.error(msg);
      setFeedbackModal({ type: "error", title: "Save section failed", message: msg, open: true });
    } finally {
      setIsSavingSection(false);
    }
  };

  // Handle product selection for moving
  const handleProductSelectForMove = (inventoryId: string, currentQuantity: number) => {
    const newSelected = new Set(selectedProductsToMove);
    if (newSelected.has(inventoryId)) {
      newSelected.delete(inventoryId);
      const newQuantities = { ...productQuantitiesToMove };
      delete newQuantities[inventoryId];
      setProductQuantitiesToMove(newQuantities);
    } else {
      newSelected.add(inventoryId);
      setProductQuantitiesToMove({ ...productQuantitiesToMove, [inventoryId]: currentQuantity });
    }
    setSelectedProductsToMove(newSelected);
  };

  // Handle quantity change for selected product
  const handleProductQuantityChangeForMove = (inventoryId: string, quantity: number, maxQuantity: number) => {
    const qty = Math.min(Math.max(1, quantity), maxQuantity);
    setProductQuantitiesToMove({ ...productQuantitiesToMove, [inventoryId]: qty });
  };

  const moveStockToSection = async () => {
    // Check if using multi-select mode
    if (selectedProductsToMove.size > 0) {
      if (!moveStockForm.section_id) {
        toast.error("Please select a target section");
        return;
      }

      if (isMovingStock) {
        console.log("Move operation already in progress");
        return;
      }

      setIsMovingStock(true);
      const movedCount = selectedProductsToMove.size;
      
      try {
        console.log("Starting move operation for", movedCount, "products");
        toast.info(`Moving ${movedCount} product(s)...`, { duration: 2000 });
        
        // Collect all inventory items and prepare batch operations
        const inventoryItems: any[] = [];
        const itemsToDelete: string[] = [];
        const itemsToUpdate: { id: string; quantity: number }[] = [];
        const itemsToInsert: { section_id: string; product_id: string; quantity: number; notes: string }[] = [];
        const targetSectionInventoryMap = new Map<string, { product_id: string; quantity: number }>(); // product_id -> quantity

        // First pass: collect all inventory items and categorize operations
        for (const inventoryId of selectedProductsToMove) {
          let inventoryItem: any = null;
          for (const section of sections) {
            const inv = section.section_inventory?.find((inv: any) => inv.id === inventoryId);
            if (inv) {
              inventoryItem = inv;
              break;
            }
          }

          if (!inventoryItem) continue;

          const quantityToMove = productQuantitiesToMove[inventoryId] || inventoryItem.quantity;

          // Track target section inventory for merging
          const existing = targetSectionInventoryMap.get(inventoryItem.product_id);
          if (existing) {
            existing.quantity += quantityToMove;
          } else {
            targetSectionInventoryMap.set(inventoryItem.product_id, {
              product_id: inventoryItem.product_id,
              quantity: quantityToMove,
            });
          }

          // If moving all quantity, delete from source
          if (quantityToMove >= inventoryItem.quantity) {
            itemsToDelete.push(inventoryId);
          } else {
            // Partial move - update source
            itemsToUpdate.push({
              id: inventoryId,
              quantity: inventoryItem.quantity - quantityToMove,
            });
          }
        }

        // Step 1: Batch delete items that are fully moved
        if (itemsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("section_inventory")
            .delete()
            .in("id", itemsToDelete);
          if (deleteError) throw deleteError;
        }

        // Step 2: Batch update items with partial moves
        if (itemsToUpdate.length > 0) {
          // Supabase doesn't support batch updates with different values, so we do them in parallel
          const updatePromises = itemsToUpdate.map(item =>
            supabase
              .from("section_inventory")
              .update({ quantity: item.quantity })
              .eq("id", item.id)
          );
          const updateResults = await Promise.all(updatePromises);
          const updateErrors = updateResults.filter(r => r.error).map(r => r.error);
          if (updateErrors.length > 0) throw updateErrors[0];
        }

        // Step 3: Get existing inventory in target section for merging
        const { data: existingTargetInventory } = await supabase
          .from("section_inventory")
          .select("id, product_id, quantity")
          .eq("section_id", moveStockForm.section_id);

        const existingInventoryMap = new Map(
          (existingTargetInventory || []).map((inv: any) => [inv.product_id, inv])
        );

        // Step 4: Prepare inserts and updates for target section
        const targetInserts: any[] = [];
        const targetUpdates: { id: string; quantity: number }[] = [];

        for (const [productId, item] of targetSectionInventoryMap.entries()) {
          const existing = existingInventoryMap.get(productId);
          if (existing) {
            // Update existing inventory
            targetUpdates.push({
              id: existing.id,
              quantity: existing.quantity + item.quantity,
            });
          } else {
            // Insert new inventory
            targetInserts.push({
              section_id: moveStockForm.section_id,
              product_id: item.product_id,
              quantity: item.quantity,
              notes: `Moved from section. ${moveStockForm.notes || ""}`,
            });
          }
        }

        // Step 5: Batch insert new inventory in target section
        if (targetInserts.length > 0) {
          const { error: insertError } = await supabase
            .from("section_inventory")
            .insert(targetInserts);
          if (insertError) throw insertError;
        }

        // Step 6: Batch update existing inventory in target section
        if (targetUpdates.length > 0) {
          const updatePromises = targetUpdates.map(item =>
            supabase
              .from("section_inventory")
              .update({ quantity: item.quantity })
              .eq("id", item.id)
          );
          const updateResults = await Promise.all(updatePromises);
          const updateErrors = updateResults.filter(r => r.error).map(r => r.error);
          if (updateErrors.length > 0) throw updateErrors[0];
        }

        // Step 7: Update section usage for all affected sections (source and target)
        const affectedSectionIds = new Set<string>();
        for (const inventoryId of selectedProductsToMove) {
          for (const section of sections) {
            const inv = section.section_inventory?.find((inv: any) => inv.id === inventoryId);
            if (inv && inv.section_id) {
              affectedSectionIds.add(inv.section_id);
              break;
            }
          }
        }
        affectedSectionIds.add(moveStockForm.section_id);

        // Update usage for all affected sections
        const usageUpdatePromises = Array.from(affectedSectionIds).map(async (sectionId) => {
          const { data: sectionInventory } = await supabase
            .from("section_inventory")
            .select("quantity")
            .eq("section_id", sectionId);

          const totalQuantity = sectionInventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;

          await supabase
            .from("warehouse_sections")
            .update({ current_usage: totalQuantity })
            .eq("id", sectionId);
        });

        await Promise.all(usageUpdatePromises);

        console.log("Move operation completed successfully");
        await loadLayout();
        
        // Clear selections before closing dialog
        setSelectedProductsToMove(new Set());
        setProductQuantitiesToMove({});
        setMoveStockForm({ product_id: "", section_id: "", quantity: 1, notes: "" });
        
        // Close dialog and show success message
        setShowMoveStockDialog(false);
        toast.success(`${movedCount} product(s) moved successfully!`, { duration: 5000 });
        setFeedbackModal({
          type: "success",
          title: "Move complete",
          message: `${movedCount} product(s) moved. Inventory updated.`,
          open: true,
        });
      } catch (error: any) {
        console.error("Error moving products:", error);
        const errorMessage = error?.message || error?.error?.message || "Failed to move products";
        toast.error(`Error: ${errorMessage}`, { duration: 5000 });
        setFeedbackModal({ type: "error", title: "Move stock failed", message: errorMessage, open: true });
        // Don't close dialog on error so user can retry
      } finally {
        setIsMovingStock(false);
      }
      return;
    }

    // Original single product move logic
    if (!moveStockForm.section_id || !moveStockForm.product_id) {
      toast.error("Please select a product and section");
      return;
    }

    if (isMovingStock) {
      console.log("Move operation already in progress");
      return;
    }

    setIsMovingStock(true);

    try {
      console.log("Starting single product move");
      toast.info("Moving stock...", { duration: 2000 });
      
      const response = await fetch("/api/warehouse/section-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_id: moveStockForm.section_id,
          product_id: moveStockForm.product_id,
          quantity: moveStockForm.quantity,
          notes: moveStockForm.notes,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      console.log("Single product move completed successfully");
      await loadLayout();
      setMoveStockForm({ product_id: "", section_id: "", quantity: 1, notes: "" });
      setShowMoveStockDialog(false);
      toast.success("Stock moved successfully!", { duration: 5000 });
      setFeedbackModal({
        type: "success",
        title: "Move complete",
        message: "Stock moved. Inventory updated.",
        open: true,
      });
    } catch (error: any) {
      console.error("Error moving stock:", error);
      const errorMessage = error?.message || error?.error?.message || "Failed to move stock";
      toast.error(`Error: ${errorMessage}`, { duration: 5000 });
      setFeedbackModal({ type: "error", title: "Move stock failed", message: errorMessage, open: true });
      // Don't close dialog on error so user can retry
    } finally {
      setIsMovingStock(false);
    }
  };

  const handleTransferStock = async () => {
    if (!transferForm.from_section_id || !transferForm.to_section_id || !transferForm.product_id || transferForm.quantity <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }

    if (transferForm.from_section_id === transferForm.to_section_id) {
      toast.error("Source and destination sections cannot be the same");
      return;
    }

    if (isTransferringStock) {
      console.log("Transfer operation already in progress");
      return;
    }

    setIsTransferringStock(true);

    try {
      console.log("Starting transfer operation");
      toast.info("Transferring stock...", { duration: 2000 });

      const res = await fetch("/api/warehouse/section-inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_section_id: transferForm.from_section_id,
          to_section_id: transferForm.to_section_id,
          product_id: transferForm.product_id,
          quantity: transferForm.quantity,
          notes: transferForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Transfer failed");

      console.log("Transfer operation completed successfully");
      await loadLayout();
      
      // Clear form and close dialog
      setTransferForm({
        from_section_id: "",
        to_section_id: "",
        product_id: "",
        quantity: 1,
        notes: "",
      });
      setShowTransferDialog(false);
      toast.success("Stock transferred successfully!", { duration: 5000 });
      setFeedbackModal({
        type: "success",
        title: "Transfer complete",
        message: "Stock transferred between sections. Inventory updated.",
        open: true,
      });
    } catch (error: any) {
      console.error("Error transferring stock:", error);
      const errorMessage = error?.message || error?.error?.message || "Failed to transfer stock";
      toast.error(`Error: ${errorMessage}`, { duration: 5000 });
      setFeedbackModal({ type: "error", title: "Transfer failed", message: errorMessage, open: true });
      // Don't close dialog on error so user can retry
    } finally {
      setIsTransferringStock(false);
    }
  };

  const getCellColor = (section: WarehouseSection | undefined): string => {
    if (!section) return "rgba(200, 200, 200, 0.5)";
    if (section.is_blocked) return "rgba(220, 38, 38, 1)"; // Full Red for blocked
    if (section.usage_percentage >= 90) return "rgba(220, 38, 38, 1)"; // Full Red
    if (section.usage_percentage >= 60) return "rgba(234, 179, 8, 1)"; // Full Yellow
    return "rgba(34, 197, 94, 1)"; // Full Green
  };

  const handleDragStart = (e: React.DragEvent, inventory: SectionInventory, sectionId: string) => {
    setDraggedProduct({
      inventoryId: inventory.id,
      productId: inventory.product_id,
      sectionId: sectionId,
      quantity: inventory.quantity,
      productName: inventory.products?.name || "Unknown Product",
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedProduct && draggedProduct.sectionId !== sectionId) {
      setDragOverSection(sectionId);
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    setDragOverSection(null);

    if (!draggedProduct || draggedProduct.sectionId === targetSectionId) {
      setDraggedProduct(null);
      return;
    }

    const targetSection = sections.find(s => s.id === targetSectionId);
    if (!targetSection || targetSection.is_blocked) {
      toast.error("Cannot drop into blocked section");
      setDraggedProduct(null);
      return;
    }

    try {
      // Get current inventory in source section
      const { data: sourceInventory, error: sourceError } = await supabase
        .from("section_inventory")
        .select("id, quantity")
        .eq("id", draggedProduct.inventoryId)
        .maybeSingle();

      if (sourceError || !sourceInventory) {
        throw new Error("Product not found in source section");
      }

      // Check if product already exists in target section
      const { data: targetInventory, error: targetCheckError } = await supabase
        .from("section_inventory")
        .select("id, quantity")
        .eq("section_id", targetSectionId)
        .eq("product_id", draggedProduct.productId)
        .maybeSingle();

      if (targetCheckError && targetCheckError.code !== "PGRST116") {
        throw targetCheckError;
      }

      // Move all quantity from source to target
      const quantityToMove = sourceInventory.quantity;

      // Delete from source
      const { error: deleteError } = await supabase
        .from("section_inventory")
        .delete()
        .eq("id", draggedProduct.inventoryId);
      if (deleteError) throw deleteError;

      // Add to target
      if (targetInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from("section_inventory")
          .update({
            quantity: targetInventory.quantity + quantityToMove,
            notes: `Moved from section via drag & drop`,
          })
          .eq("id", targetInventory.id);
        if (updateError) throw updateError;
      } else {
        // Create new inventory entry
        const { error: insertError } = await supabase
          .from("section_inventory")
          .insert({
            section_id: targetSectionId,
            product_id: draggedProduct.productId,
            quantity: quantityToMove,
            notes: `Moved from section via drag & drop`,
          });
        if (insertError) throw insertError;
      }

      await loadLayout();
      toast.success(`Moved ${draggedProduct.productName} to ${targetSection.section_name}`);
      setFeedbackModal({
        type: "success",
        title: "Move complete",
        message: `${draggedProduct.productName} moved to ${targetSection.section_name}.`,
        open: true,
      });
    } catch (error: any) {
      const msg = error.message || "Failed to move product";
      toast.error(msg);
      setFeedbackModal({ type: "error", title: "Move failed", message: msg, open: true });
    } finally {
      setDraggedProduct(null);
    }
  };

  const cellWidth = stageSize.width / gridColumns;
  const cellHeight = stageSize.height / gridRows;

  // Zoom functions
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5)); // Max zoom 5x
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.5, Math.min(5, newScale));
    
    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Pan functionality
  const handleStageMouseDown = (e: any) => {
    // Don't pan if clicking on a Rect (cell) - let the Rect handle the click
    if (e.target.getType && e.target.getType() === 'Rect') {
      return;
    }
    
    // Only pan if middle mouse button (button 1), or if holding Ctrl/Cmd
    // Left click (button 0) should still work for cell selection
    if (e.evt.button === 1 || (e.evt.button === 0 && (e.evt.ctrlKey || e.evt.metaKey))) {
      e.evt.preventDefault();
      setIsDragging(true);
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setLastPointerPosition(pointerPos);
        setDragStartPos(pointerPos);
      }
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isDragging) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos || !dragStartPos) return;
    
    // Only pan if mouse has moved more than 5 pixels (to distinguish from clicks)
    const moveDistance = Math.sqrt(
      Math.pow(pointerPos.x - dragStartPos.x, 2) + 
      Math.pow(pointerPos.y - dragStartPos.y, 2)
    );
    
    if (moveDistance > 5) {
      const newPos = {
        x: pointerPos.x - lastPointerPosition.x + position.x,
        y: pointerPos.y - lastPointerPosition.y + position.y,
      };
      setPosition(newPos);
      setLastPointerPosition(pointerPos);
    }
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
    setDragStartPos(null);
  };

  // Fullscreen handlers
  const handleOpenFullscreen = () => {
    setShowFullscreen(true);
    // Reset to default values - will be calculated in useEffect
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    setShouldCenterFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
  };

  // Fullscreen zoom handlers
  const handleFullscreenZoomIn = () => {
    setFullscreenScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleFullscreenZoomOut = () => {
    setFullscreenScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFullscreenResetZoom = () => {
    // Recalculate fit-to-screen scale and center
    if (fullscreenContainerRef.current && image) {
      const container = fullscreenContainerRef.current;
      const rect = container.getBoundingClientRect();
      const availableWidth = rect.width;
      const availableHeight = rect.height;
      
      // Calculate scale to fit the entire image
      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const fitScale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding
      
      // Update stage size
      setFullscreenStageSize({
        width: availableWidth,
        height: availableHeight
      });
      
      // Calculate scaled dimensions
      const scaledWidth = image.width * fitScale;
      const scaledHeight = image.height * fitScale;
      
      // Calculate center position within the stage
      const centerX = (availableWidth - scaledWidth) / 2;
      const centerY = (availableHeight - scaledHeight) / 2;
      
      setFullscreenScale(fitScale);
      setFullscreenPosition({ x: centerX, y: centerY });
    } else {
      setFullscreenScale(1);
      setFullscreenPosition({ x: 0, y: 0 });
      setShouldCenterFullscreen(true);
    }
  };

  // Fullscreen mouse wheel zoom
  const handleFullscreenWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = fullscreenScale;
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - fullscreenPosition.x) / oldScale,
      y: (pointer.y - fullscreenPosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.5, Math.min(5, newScale));
    
    setFullscreenScale(clampedScale);
    setFullscreenPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Fullscreen pan handlers
  const handleFullscreenMouseDown = (e: any) => {
    // Don't pan if clicking on a Rect (cell) - let the Rect handle the click
    if (e.target.getType && e.target.getType() === 'Rect') {
      return;
    }
    
    if (e.evt.button === 1 || (e.evt.button === 0 && (e.evt.ctrlKey || e.evt.metaKey))) {
      e.evt.preventDefault();
      setIsFullscreenDragging(true);
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setLastFullscreenPointerPosition(pointerPos);
        setFullscreenDragStartPos(pointerPos);
      }
    }
  };

  const handleFullscreenMouseMove = (e: any) => {
    if (!isFullscreenDragging) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos || !fullscreenDragStartPos) return;
    
    // Only pan if mouse has moved more than 5 pixels (to distinguish from clicks)
    const moveDistance = Math.sqrt(
      Math.pow(pointerPos.x - fullscreenDragStartPos.x, 2) + 
      Math.pow(pointerPos.y - fullscreenDragStartPos.y, 2)
    );
    
    if (moveDistance > 5) {
      const newPos = {
        x: pointerPos.x - lastFullscreenPointerPosition.x + fullscreenPosition.x,
        y: pointerPos.y - lastFullscreenPointerPosition.y + fullscreenPosition.y,
      };
      setFullscreenPosition(newPos);
      setLastFullscreenPointerPosition(pointerPos);
    }
  };

  const handleFullscreenMouseUp = () => {
    setIsFullscreenDragging(false);
    setFullscreenDragStartPos(null);
  };

  // Calculate fullscreen stage size
  useEffect(() => {
    if (!showFullscreen || !image || !fullscreenContainerRef.current) return;

    const calculateFullscreenSize = () => {
      const container = fullscreenContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      // Use full container size
      const availableWidth = rect.width;
      const availableHeight = rect.height;
      
      if (availableWidth <= 0 || availableHeight <= 0) return;
      
      // Calculate scale to fit the entire image
      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const fitScale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding
      
      // Set stage size to match container (full viewport)
      setFullscreenStageSize({
        width: availableWidth,
        height: availableHeight
      });
      
      // Center and zoom out the image when it first loads or when shouldCenterFullscreen is true
      if (shouldCenterFullscreen) {
        // Calculate scaled dimensions
        const scaledWidth = image.width * fitScale;
        const scaledHeight = image.height * fitScale;
        
        // Calculate center position within the stage
        // Position is relative to stage (0,0 is top-left of stage)
        // To center the scaled image, we position it so its center aligns with stage center
        const centerX = (availableWidth - scaledWidth) / 2;
        const centerY = (availableHeight - scaledHeight) / 2;
        
        setFullscreenScale(fitScale);
        setFullscreenPosition({ x: centerX, y: centerY });
        setShouldCenterFullscreen(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(calculateFullscreenSize, 100);
    window.addEventListener('resize', calculateFullscreenSize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateFullscreenSize);
    };
  }, [showFullscreen, image, shouldCenterFullscreen]);

  return (
    <>
      {isLoading ? (
        <div className="w-full flex flex-col gap-4 p-4">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading warehouse floor plan...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we load the layout and sections</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 p-4" style={{ minHeight: 'auto', overflowY: 'auto' }}>
          {/* Top Summary Bar */}
          <div className="w-full flex flex-col lg:flex-row gap-2 overflow-x-auto" style={{ maxHeight: '120px', flexShrink: 0 }}>
            {/* Layout Summary - Compact */}
            {layout && (
              <Card className="text-xs flex-shrink-0 lg:w-48">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold">Layout Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Grid:</span>
                    <span className="font-semibold">{gridRows}x{gridColumns}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Sections:</span>
                    <span className="font-semibold">{sections.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-semibold">{sections.reduce((sum, s) => sum + (s.capacity || 0), 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Section - Compact */}
            {selectedSection && (
              <Card className="text-xs flex-shrink-0 lg:w-56">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold">{selectedSection.section_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Type:</span>
                    <span className="capitalize">{selectedSection.section_type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Usage:</span>
                    <span className="font-semibold">{selectedSection.current_usage}/{selectedSection.capacity} ({selectedSection.usage_percentage.toFixed(1)}%)</span>
                  </div>
                  {selectedSection.section_inventory && selectedSection.section_inventory.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {selectedSection.section_inventory.length} product(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* All Sections - Compact Horizontal Scroll */}
            {layout && sections.length > 0 && (
              <Card className="text-xs flex-1 min-w-0">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold">All Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sections
                      .filter(s => s.section_name && s.section_name !== `Section ${s.row_index}-${s.column_index}`)
                      .map((section) => (
                        <div
                          key={section.id}
                          className="p-2 border rounded hover:bg-blue-50 flex-shrink-0 min-w-[120px] flex flex-col gap-1"
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedSection(section);
                              setSelectedCell({ row: section.row_index, col: section.column_index });
                            }}
                          >
                            <p className="font-semibold text-xs">{section.section_name}</p>
                            <p className="text-xs text-gray-500">{section.current_usage}/{section.capacity}</p>
                            {section.section_inventory && section.section_inventory.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">{section.section_inventory.length} items</p>
                            )}
                          </div>
                          {(section.section_inventory?.length ?? 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferForm({
                                  from_section_id: section.id || "",
                                  to_section_id: "",
                                  product_id: "",
                                  quantity: 1,
                                  notes: "",
                                });
                                setShowTransferDialog(true);
                              }}
                            >
                              Move
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area - Canvas First, Then Side Panel Below */}
          <div className="w-full flex flex-col gap-4">
            {/* Main Canvas Area */}
            <div className="w-full" ref={containerRef} style={{ minHeight: '500px', maxHeight: '70vh' }}>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Warehouse Floor Plan</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {!layout && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                toast.info("Creating storage bucket...");
                                const response = await fetch("/api/warehouse/ensure-bucket", {
                                  method: "POST",
                                });
                                const data = await response.json();
                                if (response.ok) {
                                  toast.success(data.message || "Storage bucket ready!");
                                } else {
                                  toast.error(data.error || "Failed to create bucket");
                                }
                              } catch (error: any) {
                                toast.error(`Error: ${error.message || "Failed to create bucket"}`);
                              }
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Setup Storage
                          </Button>
                          <label>
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Floor Plan
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </>
                      )}
                      {layout && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const rowsInput = prompt("Enter number of rows:", gridRows.toString());
                              const colsInput = prompt("Enter number of columns:", gridColumns.toString());
                              
                              if (rowsInput === null || colsInput === null) {
                                return; // User cancelled
                              }
                              
                              const newRows = parseInt(rowsInput) || gridRows;
                              const newCols = parseInt(colsInput) || gridColumns;
                              
                              if (newRows !== gridRows || newCols !== gridColumns) {
                                // Pass new values directly to saveLayout to avoid async state issues (persists to API)
                                await saveLayout(
                                  layout.image_url,
                                  layout.image_width || 800,
                                  layout.image_height || 600,
                                  newRows,
                                  newCols
                                );
                                // Success toast and modal are shown inside saveLayout
                              } else {
                                toast.info("Grid settings unchanged");
                              }
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Grid Settings
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!layout) {
                                toast.error("Cannot download: Layout not available");
                                return;
                              }
                              
                              try {
                                toast.info("Generating PDF report...");
                                
                                const doc = new jsPDF();
                                let yPos = 20;
                                
                                // Title
                                doc.setFontSize(20);
                                doc.text("Warehouse Floor Plan Report", 15, yPos);
                                yPos += 10;
                                
                                // Date and Grid Info
                                doc.setFontSize(10);
                                doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPos);
                                yPos += 5;
                                doc.text(`Grid Size: ${gridRows} x ${gridColumns}`, 15, yPos);
                                yPos += 5;
                                doc.text(`Total Sections: ${sections.length}`, 15, yPos);
                                yPos += 10;
                                
                                // Summary Statistics
                                const totalCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0);
                                const totalUsage = sections.reduce((sum, s) => sum + (s.current_usage || 0), 0);
                                const totalItems = sections.reduce((sum, s) => sum + (s.section_inventory?.length || 0), 0);
                                
                                doc.setFontSize(12);
                                doc.text("Summary", 15, yPos);
                                yPos += 5;
                                doc.setFontSize(10);
                                doc.text(`Total Capacity: ${totalCapacity}`, 15, yPos);
                                yPos += 5;
                                doc.text(`Total Usage: ${totalUsage}`, 15, yPos);
                                yPos += 5;
                                doc.text(`Total Items: ${totalItems}`, 15, yPos);
                                yPos += 10;
                                
                                // Add Floor Plan Image
                                if (image && layout?.image_url) {
                                  try {
                                    // Check if we need a new page for the image
                                    if (yPos > 150) {
                                      doc.addPage();
                                      yPos = 20;
                                    }
                                    
                                    doc.setFontSize(12);
                                    doc.text("Floor Plan", 15, yPos);
                                    yPos += 10;
                                    
                                    // Capture the stage with grid overlay
                                    if (stageRef.current) {
                                      await new Promise(resolve => setTimeout(resolve, 300));
                                      
                                      const stage = stageRef.current;
                                      const dataURL = stage.toDataURL({ 
                                        pixelRatio: 1,
                                        mimeType: 'image/png',
                                        quality: 0.95
                                      });
                                      
                                      if (dataURL && dataURL !== 'data:,') {
                                        // Calculate dimensions to fit on page
                                        const pageWidth = doc.internal.pageSize.getWidth();
                                        const pageHeight = doc.internal.pageSize.getHeight();
                                        const maxWidth = pageWidth - 30; // 15mm margins on each side
                                        const maxHeight = pageHeight - yPos - 20; // Leave space at bottom
                                        
                                        // Get image dimensions
                                        const img = new Image();
                                        await new Promise((resolve, reject) => {
                                          img.onload = resolve;
                                          img.onerror = reject;
                                          img.src = dataURL;
                                        });
                                        
                                        // Calculate scaling to fit
                                        const imgWidth = img.width;
                                        const imgHeight = img.height;
                                        const widthRatio = maxWidth / imgWidth;
                                        const heightRatio = maxHeight / imgHeight;
                                        const ratio = Math.min(widthRatio, heightRatio, 0.5); // Max 50% of original size for quality
                                        
                                        const finalWidth = imgWidth * ratio;
                                        const finalHeight = imgHeight * ratio;
                                        
                                        // Check if image fits on current page
                                        if (yPos + finalHeight > pageHeight - 10) {
                                          doc.addPage();
                                          yPos = 20;
                                        }
                                        
                                        // Add image to PDF
                                        doc.addImage(dataURL, 'PNG', 15, yPos, finalWidth, finalHeight);
                                        yPos += finalHeight + 10;
                                      } else {
                                        // Fallback: try to use the original image URL
                                        try {
                                          const img = new Image();
                                          img.crossOrigin = 'anonymous';
                                          await new Promise((resolve, reject) => {
                                            img.onload = resolve;
                                            img.onerror = reject;
                                            img.src = layout.image_url;
                                          });
                                          
                                          const pageWidth = doc.internal.pageSize.getWidth();
                                          const pageHeight = doc.internal.pageSize.getHeight();
                                          const maxWidth = pageWidth - 30;
                                          const maxHeight = pageHeight - yPos - 20;
                                          
                                          const widthRatio = maxWidth / img.width;
                                          const heightRatio = maxHeight / img.height;
                                          const ratio = Math.min(widthRatio, heightRatio, 0.5);
                                          
                                          const finalWidth = img.width * ratio;
                                          const finalHeight = img.height * ratio;
                                          
                                          if (yPos + finalHeight > pageHeight - 10) {
                                            doc.addPage();
                                            yPos = 20;
                                          }
                                          
                                          // Convert image to canvas to get data URL
                                          const canvas = document.createElement('canvas');
                                          canvas.width = img.width;
                                          canvas.height = img.height;
                                          const ctx = canvas.getContext('2d');
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0);
                                            const imgDataURL = canvas.toDataURL('image/png');
                                            doc.addImage(imgDataURL, 'PNG', 15, yPos, finalWidth, finalHeight);
                                            yPos += finalHeight + 10;
                                          }
                                        } catch (imgError) {
                                          console.warn("Could not add floor plan image:", imgError);
                                          doc.text("(Floor plan image unavailable)", 15, yPos);
                                          yPos += 5;
                                        }
                                      }
                                    } else {
                                      doc.text("(Floor plan image unavailable)", 15, yPos);
                                      yPos += 5;
                                    }
                                  } catch (imgError) {
                                    console.warn("Error adding floor plan image:", imgError);
                                    doc.text("(Floor plan image unavailable)", 15, yPos);
                                    yPos += 5;
                                  }
                                }
                                
                                // Add new page for sections if image took too much space
                                if (yPos > 200) {
                                  doc.addPage();
                                  yPos = 20;
                                }
                                
                                doc.setFontSize(12);
                                doc.text("Section Details", 15, yPos);
                                yPos += 10;
                                
                                // Sections Details
                                sections.forEach((section, index) => {
                                  // Check if we need a new page
                                  if (yPos > 250) {
                                    doc.addPage();
                                    yPos = 20;
                                  }
                                  
                                  // Section Header
                                  doc.setFontSize(14);
                                  doc.setFont('helvetica', 'bold');
                                  const sectionName = section.section_name || `Section R${section.row_index}-C${section.column_index}`;
                                  doc.text(`${index + 1}. ${sectionName}`, 15, yPos);
                                  yPos += 7;
                                  
                                  // Section Details
                                  doc.setFontSize(10);
                                  doc.setFont('helvetica', 'normal');
                                  doc.text(`Type: ${section.section_type || 'N/A'}`, 15, yPos);
                                  yPos += 5;
                                  doc.text(`Location: Row ${section.row_index}, Column ${section.column_index}`, 15, yPos);
                                  yPos += 5;
                                  doc.text(`Capacity: ${section.capacity || 0}`, 15, yPos);
                                  yPos += 5;
                                  doc.text(`Current Usage: ${section.current_usage || 0}`, 15, yPos);
                                  yPos += 5;
                                  doc.text(`Usage Percentage: ${section.usage_percentage?.toFixed(1) || 0}%`, 15, yPos);
                                  yPos += 5;
                                  doc.text(`Status: ${section.is_blocked ? 'BLOCKED' : 'Active'}`, 15, yPos);
                                  yPos += 5;
                                  
                                  // Items in Section
                                  const items = section.section_inventory || [];
                                  doc.text(`Items in Section: ${items.length}`, 15, yPos);
                                  yPos += 7;
                                  
                                  if (items.length > 0) {
                                    // Table for products
                                    const tableData = items.map((inv: any) => [
                                      inv.products?.name || 'Unknown Product',
                                      inv.products?.sku || 'N/A',
                                      inv.quantity?.toString() || '0',
                                      inv.notes || 'N/A'
                                    ]);
                                    
                                    autoTable(doc, {
                                      startY: yPos,
                                      head: [['Product Name', 'SKU', 'Quantity', 'Notes']],
                                      body: tableData,
                                      theme: 'grid',
                                      headStyles: { fillColor: [52, 86, 255] },
                                      margin: { left: 15, right: 15 },
                                      styles: { fontSize: 8 },
                                      columnStyles: {
                                        0: { cellWidth: 60 },
                                        1: { cellWidth: 40 },
                                        2: { cellWidth: 25 },
                                        3: { cellWidth: 50 }
                                      }
                                    });
                                    
                                    yPos = (doc as any).lastAutoTable.finalY + 10;
                                    
                                    // Product Descriptions
                                    items.forEach((inv: any) => {
                                      if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                      }
                                      
                                      const productName = inv.products?.name || 'Unknown Product';
                                      doc.setFontSize(9);
                                      doc.setFont('helvetica', 'bold');
                                      doc.text(`  • ${productName} (Qty: ${inv.quantity || 0})`, 20, yPos);
                                      yPos += 5;
                                      
                                      if (inv.products?.description) {
                                        doc.setFont('helvetica', 'normal');
                                        const description = inv.products.description;
                                        const splitDescription = doc.splitTextToSize(`    Description: ${description}`, 170);
                                        doc.text(splitDescription, 20, yPos);
                                        yPos += splitDescription.length * 5;
                                      }
                                      
                                      if (inv.notes) {
                                        doc.setFont('helvetica', 'italic');
                                        const notes = doc.splitTextToSize(`    Notes: ${inv.notes}`, 170);
                                        doc.text(notes, 20, yPos);
                                        yPos += notes.length * 5;
                                      }
                                      
                                      yPos += 3;
                                    });
                                  } else {
                                    doc.setFont('helvetica', 'italic');
                                    doc.text('  No products in this section', 20, yPos);
                                    yPos += 5;
                                  }
                                  
                                  yPos += 10; // Space between sections
                                });
                                
                                // Save PDF
                                const warehouseName = layout?.warehouse_id || 'warehouse';
                                doc.save(`warehouse-report-${warehouseName}-${new Date().getTime()}.pdf`);
                                
                                toast.success("PDF report downloaded successfully!");
                              } catch (error: any) {
                                console.error("Error generating PDF:", error);
                                toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
                              }
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenFullscreen}
                            title="Open in Fullscreen"
                          >
                            <Maximize2 className="w-4 h-4 mr-2" />
                            Fullscreen
                          </Button>
                          <div className="flex items-center gap-1 border-l pl-2 ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleZoomOut}
                              disabled={scale <= 0.5}
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-xs px-2 text-gray-500 min-w-[3rem] text-center">
                              {Math.round(scale * 100)}%
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleZoomIn}
                              disabled={scale >= 5}
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetZoom}
                              title="Reset Zoom"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-1 flex-1 flex flex-col" style={{ minHeight: 0 }}>
                  {!layout ? (
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg flex-1" style={{ minHeight: '400px' }}>
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Upload a warehouse floor plan image to get started</p>
                      </div>
                    </div>
                  ) : !imageLoaded && layout.image_url ? (
                    <div className="flex items-center justify-center border-2 border-dashed border-red-300 rounded-lg bg-red-50 flex-1" style={{ minHeight: '400px' }}>
                      <div className="text-center p-6">
                        <Upload className="w-12 h-12 mx-auto text-red-400 mb-4" />
                        <p className="text-red-600 font-semibold mb-2">Failed to load floor plan image</p>
                        <p className="text-red-500 text-sm mb-4">The storage bucket may not exist or the image was deleted.</p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                toast.info("Creating storage bucket...");
                                const response = await fetch("/api/warehouse/ensure-bucket", {
                                  method: "POST",
                                });
                                const data = await response.json();
                                if (response.ok) {
                                  toast.success(data.message || "Storage bucket created! Please refresh the page.");
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 2000);
                                } else {
                                  toast.error(data.error || "Failed to create bucket");
                                }
                              } catch (error: any) {
                                toast.error(`Error: ${error.message || "Failed to create bucket"}`);
                              }
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Fix Storage & Reload
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLayout(null);
                              setImage(null);
                              setImageLoaded(false);
                              setSections([]);
                            }}
                          >
                            Remove Layout
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-gray-300 rounded-lg overflow-auto relative w-full h-full flex items-center justify-center bg-white shadow-lg"
                      style={{ minHeight: 0, flex: 1, width: '100%', height: '100%' }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        
                        if (!draggedProduct || !stageRef.current) return;
                        
                        const stage = stageRef.current;
                        const pointerPos = stage.getPointerPosition();
                        if (!pointerPos) return;
                        
                        // Transform coordinates from screen space to scaled/translated space
                        const x = (pointerPos.x - position.x) / scale;
                        const y = (pointerPos.y - position.y) / scale;
                        
                        // Calculate which cell is being dragged over
                        const col = Math.floor(x / cellWidth);
                        const row = Math.floor(y / cellHeight);
                        
                        if (row >= 0 && row < gridRows && col >= 0 && col < gridColumns) {
                          const targetSection = sections.find(
                            s => s.row_index === row && s.column_index === col
                          );
                          if (targetSection?.id && draggedProduct.sectionId !== targetSection.id && !targetSection.is_blocked) {
                            setDragOverSection(targetSection.id);
                          } else {
                            setDragOverSection(null);
                          }
                        } else {
                          setDragOverSection(null);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverSection(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggedProduct || !stageRef.current) return;
                        
                        const stage = stageRef.current;
                        const pointerPos = stage.getPointerPosition();
                        if (!pointerPos) return;
                        
                        // Transform coordinates from screen space to scaled/translated space
                        const x = (pointerPos.x - position.x) / scale;
                        const y = (pointerPos.y - position.y) / scale;
                        
                        // Calculate which cell was dropped on
                        const col = Math.floor(x / cellWidth);
                        const row = Math.floor(y / cellHeight);
                        
                        if (row >= 0 && row < gridRows && col >= 0 && col < gridColumns) {
                          const targetSection = sections.find(
                            s => s.row_index === row && s.column_index === col
                          );
                          if (targetSection?.id) {
                            handleDrop(e, targetSection.id);
                          }
                        }
                        setDragOverSection(null);
                      }}
                    >
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Stage
                          width={stageSize.width}
                          height={stageSize.height}
                          ref={stageRef}
                          style={{ 
                            flexShrink: 0,
                            cursor: isDragging ? 'grabbing' : 'grab'
                          }}
                          onWheel={handleWheel}
                          onMouseDown={handleStageMouseDown}
                          onMouseMove={handleStageMouseMove}
                          onMouseUp={handleStageMouseUp}
                          onMouseLeave={handleStageMouseUp}
                        >
                          <Layer>
                            <Group
                              x={position.x}
                              y={position.y}
                              scaleX={scale}
                              scaleY={scale}
                            >
                              {image && (
                                <KonvaImage
                                  image={image}
                                  width={stageSize.width}
                                  height={stageSize.height}
                                />
                              )}
                              {/* Grid Cells with Section Info Overlay */}
                              {Array.from({ length: gridRows }).map((_, row) =>
                                Array.from({ length: gridColumns }).map((_, col) => {
                                  const section = sections.find(
                                    (s) => s.row_index === row && s.column_index === col
                                  );
                                  const color = getCellColor(section);
                                  const isDragOver = dragOverSection === section?.id;
                                  const dragOverColor = isDragOver ? "rgba(59, 130, 246, 0.8)" : color;

                                  return (
                                    <React.Fragment key={`${row}-${col}`}>
                                      {/* Full color background cell - No text, just color */}
                                      <Rect
                                        x={col * cellWidth}
                                        y={row * cellHeight}
                                        width={cellWidth}
                                        height={cellHeight}
                                        fill={isDragOver ? dragOverColor : color}
                                        opacity={0.7}
                                        stroke={isDragOver ? "rgba(59, 130, 246, 1)" : "rgba(0, 0, 0, 0.5)"}
                                        strokeWidth={isDragOver ? 3 : 2}
                                        onClick={(e) => {
                                          e.cancelBubble = true;
                                          // Always handle click - don't check isDragging as it might be stale
                                          handleCellClick(row, col);
                                        }}
                                        onTap={(e) => {
                                          e.cancelBubble = true;
                                          handleCellClick(row, col);
                                        }}
                                        listening={true}
                                        onMouseEnter={(e) => {
                                          if (section) {
                                            const stage = e.target.getStage();
                                            const pointerPos = stage?.getPointerPosition();
                                            if (pointerPos) {
                                              setHoveredSection(section);
                                              setHoverPosition({ x: pointerPos.x, y: pointerPos.y });
                                            }
                                          }
                                        }}
                                        onMouseLeave={() => {
                                          setHoveredSection(null);
                                          setHoverPosition(null);
                                        }}
                                        onMouseMove={(e) => {
                                          if (section) {
                                            const stage = e.target.getStage();
                                            const pointerPos = stage?.getPointerPosition();
                                            if (pointerPos) {
                                              setHoverPosition({ x: pointerPos.x, y: pointerPos.y });
                                            }
                                          }
                                        }}
                                      />
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </Group>
                          </Layer>
                        </Stage>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Hover Tooltip - Outside Card to avoid structure issues */}
              {hoveredSection && hoverPosition && containerRef.current && (
                <div
                  className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-xl pointer-events-none border border-gray-700"
                  style={{
                    left: `${containerRef.current.getBoundingClientRect().left + hoverPosition.x + 15}px`,
                    top: `${containerRef.current.getBoundingClientRect().top + hoverPosition.y + 15}px`,
                    maxWidth: '300px',
                  }}
                >
                  <div className="font-bold text-lg mb-2 border-b border-gray-700 pb-1">{hoveredSection.section_name}</div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-semibold">Type:</span> {hoveredSection.section_type}</div>
                    <div><span className="font-semibold">Location:</span> Row {hoveredSection.row_index}, Col {hoveredSection.column_index}</div>
                    {hoveredSection.capacity > 0 && (
                      <>
                        <div><span className="font-semibold">Usage:</span> {hoveredSection.current_usage} / {hoveredSection.capacity}</div>
                        <div><span className="font-semibold">Capacity:</span> {hoveredSection.usage_percentage.toFixed(1)}%</div>
                      </>
                    )}
                    {hoveredSection.is_blocked && (
                      <div className="text-red-400 font-semibold mt-1">⚠️ BLOCKED</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialogs - Always rendered (outside conditional) */}
      {/* Section Configuration Dialog - Cell ID (row/col + A1), metadata, edit only for admin */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Section</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <p className="text-sm text-gray-600 border-b pb-2">
              Cell: R{selectedCell.row}-C{selectedCell.col} ({cellIdA1(selectedCell.row, selectedCell.col)})
            </p>
          )}
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="section-name">Slot name</Label>
              <Input
                id="section-name"
                value={configForm.section_name}
                onChange={(e) =>
                  setConfigForm({ ...configForm, section_name: e.target.value })
                }
                placeholder="Enter section name"
              />
            </div>
            <div>
              <Label htmlFor="section-type">Zone / Section</Label>
              <Select
                value={configForm.section_type}
                onValueChange={(value) =>
                  setConfigForm({ ...configForm, section_type: value })
                }
              >
                <SelectTrigger id="section-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="picking">Picking</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="section-notes">Notes</Label>
              <Input
                id="section-notes"
                value={configForm.notes}
                onChange={(e) =>
                  setConfigForm({ ...configForm, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={configForm.capacity}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter capacity"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="blocked"
                checked={configForm.is_blocked}
                onChange={(e) =>
                  setConfigForm({ ...configForm, is_blocked: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="blocked" className="cursor-pointer">
                Blocked
              </Label>
            </div>
          </div>
          <DialogFooter className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfigDialog(false);
                setSelectedCell(null);
                setSelectedSection(null);
              }}
              disabled={isSavingSection}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveSection}
              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90"
              disabled={isSavingSection}
            >
              {isSavingSection ? "Saving..." : "Save Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Stock Dialog */}
      <Dialog open={showMoveStockDialog} onOpenChange={setShowMoveStockDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>Move Products to Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show selected products if any */}
            {selectedProductsToMove.size > 0 ? (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    {selectedProductsToMove.size} product(s) selected for move
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.from(selectedProductsToMove).map((inventoryId) => {
                      let inventoryItem: any = null;
                      let sectionName = "";
                      for (const section of sections) {
                        const inv = section.section_inventory?.find((inv: any) => inv.id === inventoryId);
                        if (inv) {
                          inventoryItem = inv;
                          sectionName = section.section_name || "";
                          break;
                        }
                      }
                      if (!inventoryItem) return null;
                      return (
                        <div key={inventoryId} className="p-2 bg-white rounded border border-blue-300 text-xs">
                          <p className="font-semibold">{inventoryItem.products?.name || "Unknown"}</p>
                          <p className="text-gray-600">From: {sectionName} | Qty: {productQuantitiesToMove[inventoryId] || inventoryItem.quantity} / {inventoryItem.quantity}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Select Target Section *</Label>
                  <Select
                    value={moveStockForm.section_id}
                    onValueChange={(value) => {
                      console.log("Section selected:", value);
                      setMoveStockForm({ ...moveStockForm, section_id: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target section" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000] max-h-[300px]">
                      {(() => {
                        const validSections = sections.filter(s => {
                          const hasId = s.id && String(s.id).trim() !== "";
                          if (!hasId) {
                            console.log("Section filtered out (no id):", s);
                            return false;
                          }
                          return true;
                        });
                        
                        console.log("Valid sections to render:", validSections.length, validSections);
                        
                        if (validSections.length === 0) {
                          return (
                            <SelectItem value="none" disabled>
                              No sections available. Please configure sections first.
                            </SelectItem>
                          );
                        }
                        
                        return validSections.map((section) => {
                          const sectionName = section.section_name || `Section R${section.row_index}-C${section.column_index}`;
                          const sectionType = section.section_type || "storage";
                          const usage = section.current_usage || 0;
                          const capacity = section.capacity || 0;
                          const isBlocked = section.is_blocked ? " (BLOCKED)" : "";
                          const sectionId = String(section.id || "");
                          
                          console.log("Rendering section option:", sectionId, sectionName);
                          
                          return (
                            <SelectItem key={sectionId} value={sectionId}>
                              {sectionName} ({sectionType}) - Usage: {usage}/{capacity} - R{section.row_index}-C{section.column_index}{isBlocked}
                            </SelectItem>
                          );
                        });
                      })()}
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-xs text-gray-500">
                    {(() => {
                      const validCount = sections.filter(s => s.id && String(s.id).trim() !== "").length;
                      console.log("Valid sections count:", validCount, "Total sections:", sections.length);
                      return `${validCount} section(s) available`;
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Select Section *</Label>
                  <Select
                    value={moveStockForm.section_id}
                    onValueChange={(value) =>
                      setMoveStockForm({ ...moveStockForm, section_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections
                        .filter(s => s.id && s.section_name && !s.is_blocked)
                        .map((section) => (
                          <SelectItem key={section.id} value={section.id || ""}>
                            {section.section_name} ({section.section_type}) - 
                            Usage: {section.current_usage || 0}/{section.capacity} - 
                            R{section.row_index}-C{section.column_index}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Product *</Label>
                  <Select
                    value={moveStockForm.product_id}
                    onValueChange={(value) =>
                      setMoveStockForm({ ...moveStockForm, product_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={moveStockForm.quantity}
                    onChange={(e) =>
                      setMoveStockForm({
                        ...moveStockForm,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={moveStockForm.notes}
                onChange={(e) =>
                  setMoveStockForm({ ...moveStockForm, notes: e.target.value })
                }
                placeholder="Add notes about this move"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMoveStockDialog(false);
                setMoveStockForm({ product_id: "", section_id: "", quantity: 1, notes: "" });
                setSelectedProductsToMove(new Set());
                setProductQuantitiesToMove({});
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={moveStockToSection}
              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:opacity-90"
              disabled={
                isMovingStock || (
                  selectedProductsToMove.size > 0 
                    ? !moveStockForm.section_id
                    : !moveStockForm.section_id || !moveStockForm.product_id
                )
              }
            >
              {isMovingStock ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Moving...
                </>
              ) : (
                selectedProductsToMove.size > 0 
                  ? `Move ${selectedProductsToMove.size} Product(s)`
                  : "Move Products"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Stock Between Sections Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col z-[9999]">
          <DialogHeader>
            <DialogTitle>Transfer Stock Between Sections</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {transferForm.from_section_id && transferForm.product_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  Pre-selected product ready to transfer
                </p>
              </div>
            )}
            <div>
              <Label>From Section</Label>
              <Select
                value={transferForm.from_section_id}
                onValueChange={(value) => {
                  console.log("From section selected:", value);
                  setTransferForm({ ...transferForm, from_section_id: value, product_id: "", quantity: 1 });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source section" />
                </SelectTrigger>
                <SelectContent className="z-[10000] max-h-[300px]">
                  {(() => {
                    const validSections = sections.filter(s => {
                      const hasId = s.id && String(s.id).trim() !== "";
                      if (!hasId) {
                        console.log("Section filtered out (no id):", s);
                        return false;
                      }
                      return true;
                    });
                    
                    if (validSections.length === 0) {
                      return (
                        <SelectItem value="none" disabled>
                          No sections available. Please configure sections first.
                        </SelectItem>
                      );
                    }
                    
                    return validSections.map((section) => {
                      const sectionName = section.section_name || `Section R${section.row_index}-C${section.column_index}`;
                      const sectionType = section.section_type || "storage";
                      const sectionId = String(section.id || "");
                      
                      return (
                        <SelectItem key={sectionId} value={sectionId}>
                          {sectionName} ({sectionType}) - R{section.row_index}-C{section.column_index}
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Section *</Label>
              <Select
                value={transferForm.to_section_id}
                onValueChange={(value) => {
                  console.log("To section selected:", value);
                  setTransferForm({ ...transferForm, to_section_id: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select destination section" />
                </SelectTrigger>
                <SelectContent className="z-[10000] max-h-[300px]">
                  {sections.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No sections available. Please configure sections first.
                    </SelectItem>
                  ) : (() => {
                    const validSections = sections.filter(s => {
                      const hasId = s.id && String(s.id).trim() !== "";
                      if (!hasId) return false;
                      
                      // Exclude source section if it's set
                      if (transferForm.from_section_id) {
                        const isSource = String(s.id) === String(transferForm.from_section_id);
                        if (isSource) return false;
                      }
                      
                      return true;
                    });
                    
                    console.log("Valid sections for transfer (To):", validSections.length, "from_section_id:", transferForm.from_section_id);
                    console.log("All sections:", sections.map(s => ({ id: s.id, name: s.section_name })));
                    
                    if (validSections.length === 0) {
                      return (
                        <SelectItem value="none" disabled>
                          {transferForm.from_section_id
                            ? "No other sections available (excluding source section)."
                            : "No valid sections found."}
                        </SelectItem>
                      );
                    }
                    
                    return validSections.map((section) => {
                      const sectionName = section.section_name || `Section R${section.row_index}-C${section.column_index}`;
                      const sectionType = section.section_type || "storage";
                      const sectionId = String(section.id || "");
                      
                      return (
                        <SelectItem key={sectionId} value={sectionId}>
                          {sectionName} ({sectionType}) - R{section.row_index}-C{section.column_index}
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-gray-500">
                {(() => {
                  const validCount = sections.filter(s => {
                    const hasId = s.id && String(s.id).trim() !== "";
                    if (!hasId) return false;
                    if (transferForm.from_section_id && String(s.id) === String(transferForm.from_section_id)) return false;
                    return true;
                  }).length;
                  return `${validCount} section(s) available`;
                })()}
              </div>
            </div>
            {transferForm.from_section_id && (() => {
              const fromId = String(transferForm.from_section_id);
              const sourceSection = sections.find(s => String(s?.id) === fromId);
              const inventory = sourceSection?.section_inventory ?? [];
              const hasProducts = inventory.length > 0;
              return (
                <>
                  <div>
                    <Label>Product</Label>
                    <Select
                      value={transferForm.product_id || undefined}
                      onValueChange={(value) =>
                        setTransferForm({ ...transferForm, product_id: value, quantity: 1 })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={hasProducts ? "Select product" : "No products in source section"} />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {hasProducts ? (
                          inventory.map((inv) => {
                            const pid = inv.product_id ? String(inv.product_id) : "";
                            if (!pid) return null;
                            const name = inv.products?.name || inv.products?.sku || "Product";
                            return (
                              <SelectItem key={inv.id || pid} value={pid}>
                                {name} - Available: {inv.quantity ?? 0}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="__none__" disabled>
                            No products in source section. Add stock to this section first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {transferForm.product_id && (() => {
                    const pid = String(transferForm.product_id);
                    const sourceInv = sourceSection?.section_inventory?.find(
                      inv => inv.product_id && String(inv.product_id) === pid
                    );
                    return (
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max={sourceInv?.quantity || 1}
                          value={transferForm.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxQty = sourceInv?.quantity || 1;
                            setTransferForm({
                              ...transferForm,
                              quantity: Math.min(Math.max(1, val), maxQty),
                            });
                          }}
                        />
                        {sourceInv && (
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum: {sourceInv.quantity} units
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={transferForm.notes}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, notes: e.target.value })
                      }
                      placeholder="Transfer notes"
                    />
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferDialog(false);
                setTransferForm({
                  from_section_id: "",
                  to_section_id: "",
                  product_id: "",
                  quantity: 1,
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTransferStock}
              disabled={
                isTransferringStock || 
                !transferForm.from_section_id || 
                !transferForm.to_section_id || 
                !transferForm.product_id || 
                transferForm.quantity <= 0
              }
              className="bg-[#3456FF] hover:bg-[#3456FF]/90 text-white"
            >
              {isTransferringStock ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Transferring...
                </>
              ) : (
                "Transfer Stock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Floor Plan Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <DialogTitle>Warehouse Floor Plan - Fullscreen</DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreenZoomOut}
                  disabled={fullscreenScale <= 0.5}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs px-2 text-gray-500 min-w-[3rem] text-center">
                  {Math.round(fullscreenScale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreenZoomIn}
                  disabled={fullscreenScale >= 5}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreenResetZoom}
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseFullscreen}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
          <div 
            ref={fullscreenContainerRef}
            className="flex-1 w-full bg-gray-100 flex items-center justify-center overflow-auto"
            style={{ minHeight: 0, height: '100%' }}
          >
            {image && imageLoaded && (
              <Stage
                width={fullscreenStageSize.width}
                height={fullscreenStageSize.height}
                ref={fullscreenStageRef}
                style={{ 
                  cursor: isFullscreenDragging ? 'grabbing' : 'grab',
                  display: 'block'
                }}
                onWheel={handleFullscreenWheel}
                onMouseDown={handleFullscreenMouseDown}
                onMouseMove={handleFullscreenMouseMove}
                onMouseUp={handleFullscreenMouseUp}
                onMouseLeave={handleFullscreenMouseUp}
              >
                <Layer>
                  <Group
                    x={fullscreenPosition.x}
                    y={fullscreenPosition.y}
                    scaleX={fullscreenScale}
                    scaleY={fullscreenScale}
                  >
                    <KonvaImage
                      image={image}
                      width={image.width}
                      height={image.height}
                    />
                    {/* Grid Cells with Section Info Overlay */}
                    {Array.from({ length: gridRows }).map((_, row) =>
                      Array.from({ length: gridColumns }).map((_, col) => {
                        const section = sections.find(
                          (s) => s.row_index === row && s.column_index === col
                        );
                        const color = getCellColor(section);
                        // Cells should be based on image dimensions, not stage size
                        const cellWidth = image.width / gridColumns;
                        const cellHeight = image.height / gridRows;

                        return (
                          <React.Fragment key={`fullscreen-${row}-${col}`}>
                            <Rect
                              x={col * cellWidth}
                              y={row * cellHeight}
                              width={cellWidth}
                              height={cellHeight}
                              fill={color}
                              opacity={0.7}
                              stroke="rgba(0, 0, 0, 0.5)"
                              strokeWidth={2}
                              onClick={(e) => {
                                e.cancelBubble = true;
                                // Always handle click - open configure dialog
                                handleCellClick(row, col);
                              }}
                              onTap={(e) => {
                                e.cancelBubble = true;
                                handleCellClick(row, col);
                              }}
                              listening={true}
                              onMouseEnter={(e) => {
                                if (section) {
                                  const stage = e.target.getStage();
                                  const pointerPos = stage?.getPointerPosition();
                                  if (pointerPos) {
                                    setHoveredSection(section);
                                    setHoverPosition({ x: pointerPos.x, y: pointerPos.y });
                                  }
                                }
                              }}
                              onMouseLeave={() => {
                                setHoveredSection(null);
                                setHoverPosition(null);
                              }}
                              onMouseMove={(e) => {
                                if (section) {
                                  const stage = e.target.getStage();
                                  const pointerPos = stage?.getPointerPosition();
                                  if (pointerPos) {
                                    setHoverPosition({ x: pointerPos.x, y: pointerPos.y });
                                  }
                                }
                              }}
                            />
                          </React.Fragment>
                        );
                      })
                    )}
                  </Group>
                </Layer>
              </Stage>
            )}
          </div>
          {hoveredSection && hoverPosition && fullscreenContainerRef.current && (
            <div
              className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-xl pointer-events-none border border-gray-700"
              style={{
                left: `${fullscreenContainerRef.current.getBoundingClientRect().left + hoverPosition.x + 15}px`,
                top: `${fullscreenContainerRef.current.getBoundingClientRect().top + hoverPosition.y + 15}px`,
                maxWidth: '300px',
              }}
            >
              <div className="font-bold text-lg mb-2 border-b border-gray-700 pb-1">{hoveredSection.section_name}</div>
              <div className="text-sm space-y-1">
                <div><span className="font-semibold">Type:</span> {hoveredSection.section_type}</div>
                <div><span className="font-semibold">Location:</span> Row {hoveredSection.row_index}, Col {hoveredSection.column_index}</div>
                {hoveredSection.capacity > 0 && (
                  <>
                    <div><span className="font-semibold">Usage:</span> {hoveredSection.current_usage} / {hoveredSection.capacity}</div>
                    <div><span className="font-semibold">Capacity:</span> {hoveredSection.usage_percentage.toFixed(1)}%</div>
                  </>
                )}
                {hoveredSection.is_blocked && (
                  <div className="text-red-400 font-semibold mt-1">⚠️ BLOCKED</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error / success feedback modal */}
      <AlertDialog
        open={feedbackModal.open}
        onOpenChange={(open) => setFeedbackModal((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full"
            aria-label="Close"
            onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
          >
            <X className="h-4 w-4" />
          </Button>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {feedbackModal.title || (feedbackModal.type === "error" ? "Action failed" : "Success")}
            </AlertDialogTitle>
            <AlertDialogDescription>{feedbackModal.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-2">
            <AlertDialogAction
              onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
              className="min-w-[80px]"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}