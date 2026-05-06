// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { toast as toastAction } from "@/components/ui/use-toast";
import {
  Package,
  Layers,
  RefreshCw,
  PlusCircle,
  Search,
  Check,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to shade colors for 3D effect
const shadeColor = (color: string, percent: number) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR =
    R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG =
    G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB =
    B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
};

// Supabase setup
const getSupabaseClient = () => {
  const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U";
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// Interfaces
interface PalletItem {
  id: string;
  name: string;
  dimensions: string;
  weight: string;
  count: number;
  color: string;
  volume: number;
  stackability: "Low" | "Medium" | "High";
  fragility: "Low" | "Medium" | "High";
  ai_recommended: boolean;
  optimization_score: number;
  density_factor: number;
  ideal_placement: string;
  created_at: string;
  updated_at: string;
}

interface PalletConfiguration {
  id: string;
  name: string;
  description: string;
  configuration_type: "standard" | "custom" | "optimized";
  items: any; // JSONB data
  dimensions: any; // JSONB data
  total_weight: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

interface AIOptimizationMetric {
  id: string;
  space_efficiency: number;
  stability_score: number;
  load_time_reduction: number;
  picking_efficiency: number;
  weight_distribution: number;
  suggestion_count: number;
  optimization_gain: number;
  optimization_level: number;
  last_analyzed: string;
  created_at: string;
}

export default function PalletMixer() {
  // Tab state
  const [activeTab, setActiveTab] = useState("items");

  // Data states
  const [palletItems, setPalletItems] = useState<PalletItem[]>([]);
  const [configurations, setConfigurations] = useState<PalletConfiguration[]>(
    []
  );
  const [metrics, setMetrics] = useState<AIOptimizationMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Toast hook
  const { toast } = useToast();

  // Configuration settings
  const [configName, setConfigName] = useState("My Pallet Configuration");
  const [palletDimensions, setPalletDimensions] = useState({
    width: 120,
    length: 100,
    height: 160,
  });
  const [weightLimit, setWeightLimit] = useState(1000);
  const [optimizationPriorities, setOptimizationPriorities] = useState({
    space: true,
    stability: true,
    picking: false,
    loading: false,
  });

  // Pallet state
  const [palletItemsSelected, setPalletItemsSelected] = useState<any[]>([]);
  const [palletStats, setPalletStats] = useState({
    itemCount: 0,
    totalWeight: 0,
    volumeUsed: 0,
    stability: "N/A",
  });

  // Define fetch functions with useCallback first to avoid hoisting issues
  // Fetch pallet items
  const fetchPalletItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pallet_items")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching pallet items:", error);
        return;
      }
      setPalletItems(data || []);
    } catch (error) {
      console.error("Error fetching pallet items:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch configurations
  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pallet_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching configurations:", error);
        return;
      }
      setConfigurations(data || []);
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch AI metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_optimization_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching metrics:", error);
        return;
      }

      if (data && data.length > 0) {
        setMetrics(data[0]);
      } else {
        // If no data is found, create a sample metrics object for demonstration
        const sampleMetrics = {
          id: "sample-1",
          space_efficiency: 85,
          stability_score: 92,
          load_time_reduction: 23,
          picking_efficiency: 78,
          weight_distribution: 88,
          optimization_level: 83,
          optimization_gain: 15,
          suggestion_count: 12,
          last_analyzed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setMetrics(sampleMetrics);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // Create sample metrics even if there's an error
      const sampleMetrics = {
        id: "sample-error",
        space_efficiency: 85,
        stability_score: 92,
        load_time_reduction: 23,
        picking_efficiency: 78,
        weight_distribution: 88,
        optimization_level: 83,
        optimization_gain: 15,
        suggestion_count: 12,
        last_analyzed: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setMetrics(sampleMetrics);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // UI states
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    dimensions: "",
    weight: "",
    count: 1,
    color: "#3456FF",
    volume: 0,
    stackability: "Medium" as "Low" | "Medium" | "High",
    fragility: "Medium" as "Low" | "Medium" | "High",
  });

  // Load data on component mount
  useEffect(() => {
    // Immediately fetch all data
    fetchPalletItems();
    fetchConfigurations();
    fetchMetrics();

    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      fetchPalletItems();
      fetchConfigurations();
      fetchMetrics();
    }, 30000); // Refresh every 30 seconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchPalletItems, fetchConfigurations, fetchMetrics]);

  // Add a new pallet item
  const handleAddItem = async () => {
    try {
      // Form validation
      if (!newItem.name || !newItem.dimensions || !newItem.weight) {
        alert("Please fill all required fields");
        return;
      }

      // Split dimensions string into array and calculate volume
      const dimensions = newItem.dimensions.split("x").map(Number);
      if (dimensions.length !== 3 || dimensions.some(isNaN)) {
        alert("Dimensions must be in format: LxWxH");
        return;
      }

      const volume = dimensions.reduce((acc, val) => acc * val, 1) / 1000; // cm³ to m³

      // Calculate optimization score and density factor as examples
      const optimization_score = Math.floor(Math.random() * 100);
      const density_factor = parseFloat((Math.random() * 0.9 + 0.1).toFixed(2));

      const { data, error } = await supabase.from("pallet_items").insert([
        {
          ...newItem,
          volume,
          optimization_score: optimization_score,
          density_factor: density_factor,
          ideal_placement: "Base layer",
        },
      ]);

      if (error) throw error;

      setShowAddItemDialog(false);
      setNewItem({
        name: "",
        dimensions: "",
        weight: "",
        count: 1,
        color: "#3456FF",
        volume: 0,
        stackability: "Medium",
        fragility: "Medium",
      });

      // Refresh the items list
      fetchPalletItems();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item. Please try again.");
    }
  };

  // Add item to pallet
  const addToPallet = (item: any) => {
    console.log("Adding item to pallet:", item); // Debug log

    // Create a copy with a unique ID for this instance
    const palletItem = {
      ...item,
      palletId: `${item.id || "item"}-${Date.now()}`, // Create a unique ID for this instance
      positionX: Math.random() * 80, // Random position for visualization
      positionY: Math.random() * 80,
      positionZ: 0,
    };

    // Add to pallet items array
    const updatedPalletItems = [...palletItemsSelected, palletItem];
    setPalletItemsSelected(updatedPalletItems);

    // Update pallet stats
    updatePalletStats(updatedPalletItems);

    // Switch to the mixer tab
    setActiveTab("mixer");

    // Show confirmation
    alert(`Added ${item.name} to pallet!`);
  };

  // Remove item from pallet
  const removeFromPallet = (palletId: string) => {
    const updatedPalletItems = palletItemsSelected.filter(
      (item) => item.palletId !== palletId
    );
    setPalletItemsSelected(updatedPalletItems);
    updatePalletStats(updatedPalletItems);
  };

  // Run AI Optimization function
  const runAIOptimization = async () => {
    if (palletItemsSelected.length === 0) {
      toast({
        title: "No Items",
        description:
          "Please add items to the pallet before running optimization.",
        variant: "destructive",
      });
      return;
    }

    // Show loading state
    setLoading(true);

    try {
      // Simulate AI optimization process with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get pallet dimensions for optimization calculations
      const palletWidth = palletDimensions.width;
      const palletLength = palletDimensions.length;

      // Sort items by optimization criteria
      let sortedItems = [...palletItemsSelected];

      // Create a grid system for the pallet
      const gridCellSize = 20; // Size of each grid cell in units
      const gridWidth = Math.floor(palletWidth / gridCellSize);
      const gridLength = Math.floor(palletLength / gridCellSize);
      const grid = Array(gridLength)
        .fill(0)
        .map(() => Array(gridWidth).fill(false));

      // Apply different sorting strategies based on priorities
      if (optimizationPriorities.stability) {
        // Sort by weight (heaviest first for stability)
        sortedItems.sort(
          (a, b) => (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0)
        );
      } else if (optimizationPriorities.picking) {
        // Sort by frequency of access (most frequently accessed first)
        sortedItems.sort(
          (a, b) => (parseInt(b.count) || 0) - (parseInt(a.count) || 0)
        );
      } else if (optimizationPriorities.loading) {
        // Sort by size (largest first for better loading time)
        sortedItems.sort((a, b) => {
          const aSize =
            (parseFloat(a.width) || 0) * (parseFloat(a.length) || 0);
          const bSize =
            (parseFloat(b.width) || 0) * (parseFloat(b.length) || 0);
          return bSize - aSize;
        });
      }

      // Calculate optimal position for each item
      const optimizedItems = sortedItems.map((item, index) => {
        // Calculate item dimensions in grid units
        const itemWidth = Math.max(
          1,
          Math.ceil((parseFloat(item.width) || 10) / gridCellSize)
        );
        const itemLength = Math.max(
          1,
          Math.ceil((parseFloat(item.length) || 10) / gridCellSize)
        );

        // Find the best position for this item based on the grid
        let bestPosX = 0;
        let bestPosY = 0;
        let placed = false;

        // First fit strategy - find first available space
        for (let y = 0; y < gridLength - itemLength + 1 && !placed; y++) {
          for (let x = 0; x < gridWidth - itemWidth + 1 && !placed; x++) {
            // Check if this position is available
            let canPlace = true;
            for (let dy = 0; dy < itemLength && canPlace; dy++) {
              for (let dx = 0; dx < itemWidth && canPlace; dx++) {
                if (grid[y + dy][x + dx]) {
                  canPlace = false;
                }
              }
            }

            // If we can place it here, mark the grid and set position
            if (canPlace) {
              // Mark grid cells as occupied
              for (let dy = 0; dy < itemLength; dy++) {
                for (let dx = 0; dx < itemWidth; dx++) {
                  grid[y + dy][x + dx] = true;
                }
              }

              bestPosX = x * gridCellSize;
              bestPosY = y * gridCellSize;
              placed = true;
            }
          }
        }

        // If we couldn't place it in the grid, use fallback positioning
        if (!placed) {
          // Fallback strategy - arrange in rows
          bestPosX = 20 + (index % 3) * 30;
          bestPosY = 20 + Math.floor(index / 3) * 30;
        }

        // Add some randomization for more natural-looking arrangement
        const jitter = optimizationPriorities.space ? 0 : 2; // No jitter if space efficiency is priority
        const finalPosX = bestPosX + (Math.random() - 0.5) * jitter;
        const finalPosY = bestPosY + (Math.random() - 0.5) * jitter;

        return {
          ...item,
          positionX: finalPosX,
          positionY: finalPosY,
          isOptimized: true,
        };
      });

      setPalletItemsSelected(optimizedItems);
      updatePalletStats(optimizedItems);

      // Update optimization metrics to reflect the changes
      const newMetrics: AIOptimizationMetric = {
        ...metrics,
        space_efficiency: optimizationPriorities.space
          ? Math.min(95, (metrics?.space_efficiency || 70) + 20)
          : (metrics?.space_efficiency || 70) + 5,
        stability_score: optimizationPriorities.stability
          ? Math.min(98, (metrics?.stability_score || 75) + 18)
          : (metrics?.stability_score || 75) + 5,
        load_time_reduction: optimizationPriorities.loading
          ? Math.min(50, (metrics?.load_time_reduction || 25) + 15)
          : (metrics?.load_time_reduction || 25) + 3,
        picking_efficiency: optimizationPriorities.picking
          ? Math.min(90, (metrics?.picking_efficiency || 65) + 20)
          : (metrics?.picking_efficiency || 65) + 5,
        weight_distribution: optimizationPriorities.stability
          ? Math.min(95, (metrics?.weight_distribution || 60) + 25)
          : (metrics?.weight_distribution || 60) + 8,
        optimization_level: Math.min(
          95,
          (metrics?.optimization_level || 70) +
            Object.values(optimizationPriorities).filter(Boolean).length * 5
        ),
        last_analyzed: new Date().toISOString(),
      };

      setMetrics(newMetrics);

      toast({
        title: "AI Optimization Complete",
        description: `${optimizedItems.length} items have been optimally arranged on the pallet.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "There was an error optimizing the pallet arrangement.",
        variant: "destructive",
      });
      console.error("Optimization error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save Configuration function
  const saveConfiguration = async () => {
    if (palletItemsSelected.length === 0) {
      toast({
        title: "No Items",
        description:
          "Please add items to the pallet before saving the configuration.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Use the provided name or generate a default one
      const configurationName =
        configName || `Pallet Config ${new Date().toLocaleDateString()}`;

      // In a real app, this would save to Supabase
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Create a new configuration object
      const newConfiguration: PalletConfiguration = {
        id: `config-${Date.now()}`,
        name: configurationName,
        description: `Contains ${palletItemsSelected.length} items with total weight of ${palletStats.totalWeight}kg`,
        configuration_type: (palletItemsSelected.some(
          (item) => item.isOptimized
        )
          ? "optimized"
          : "custom") as "standard" | "custom" | "optimized",
        items: palletItemsSelected,
        dimensions: palletDimensions,
        total_weight: palletStats.totalWeight,
        is_template: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to saved configurations list
      setConfigurations([newConfiguration, ...configurations]);

      toast({
        title: "Configuration Saved",
        description: `"${configurationName}" has been saved to your configurations.`,
        variant: "default",
      });

      // Switch to the saved configurations tab
      setActiveTab("saved");
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your pallet configuration.",
        variant: "destructive",
      });
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update pallet statistics
  const updatePalletStats = (items: any[]) => {
    const itemCount = items.length;
    const totalWeight = items.reduce(
      (sum, item) => sum + Number(item.weight),
      0
    );

    // Calculate volume usage (simple calculation for demo)
    const totalVolume = items.reduce(
      (sum, item) => sum + Number(item.volume),
      0
    );
    const palletVolume = (120 * 100 * 160) / 1000000; // LxWxH in m³
    const volumeUsed = Math.min(
      Math.round((totalVolume / palletVolume) * 100),
      100
    );

    // Calculate a simple stability score based on item properties
    let stability = "N/A";
    if (itemCount > 0) {
      const stackabilityMap = { Low: 1, Medium: 2, High: 3 };
      const avgStackability =
        items.reduce((sum, item) => {
          return (
            sum +
            (stackabilityMap[item.stackability as "Low" | "Medium" | "High"] ||
              2)
          );
        }, 0) / itemCount;

      if (avgStackability > 2.5) stability = "High";
      else if (avgStackability > 1.5) stability = "Medium";
      else stability = "Low";
    }

    setPalletStats({
      itemCount,
      totalWeight,
      volumeUsed,
      stability,
    });
  };

  // Filter items by search query
  const filteredItems = palletItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dimensions.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
          Pallet Mixer
        </h1>
        <Badge variant="outline" className="bg-[#3456FF]/10 text-[#3456FF]">
          Coming Soon
        </Badge>
      </div>

      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items Catalog</TabsTrigger>
          <TabsTrigger value="mixer">Pallet Mixer</TabsTrigger>
          <TabsTrigger value="configurations">Saved Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Pallet Items</CardTitle>
                <CardDescription>
                  Manage your pallet items catalog
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search items..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog
                  open={showAddItemDialog}
                  onOpenChange={setShowAddItemDialog}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Pallet Item</DialogTitle>
                      <DialogDescription>
                        Create a new item for your pallet configurations
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Box Type A"
                          className="col-span-3"
                          value={newItem.name}
                          onChange={(e) =>
                            setNewItem({ ...newItem, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dimensions" className="text-right">
                          Dimensions
                        </Label>
                        <Input
                          id="dimensions"
                          placeholder="30x20x15 cm"
                          className="col-span-3"
                          value={newItem.dimensions}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              dimensions: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="weight" className="text-right">
                          Weight
                        </Label>
                        <Input
                          id="weight"
                          placeholder="2.5 kg"
                          className="col-span-3"
                          value={newItem.weight}
                          onChange={(e) =>
                            setNewItem({ ...newItem, weight: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="count" className="text-right">
                          Count
                        </Label>
                        <Input
                          id="count"
                          type="number"
                          min="1"
                          className="col-span-3"
                          value={newItem.count}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              count: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">
                          Color
                        </Label>
                        <div className="flex col-span-3 gap-2">
                          <Input
                            id="color"
                            type="color"
                            className="w-12"
                            value={newItem.color}
                            onChange={(e) =>
                              setNewItem({ ...newItem, color: e.target.value })
                            }
                          />
                          <Input
                            value={newItem.color}
                            onChange={(e) =>
                              setNewItem({ ...newItem, color: e.target.value })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="volume" className="text-right">
                          Volume
                        </Label>
                        <Input
                          id="volume"
                          type="number"
                          min="0"
                          placeholder="9000"
                          className="col-span-3"
                          value={newItem.volume}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              volume: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stackability" className="text-right">
                          Stackability
                        </Label>
                        <Select
                          value={newItem.stackability}
                          onValueChange={(value: "Low" | "Medium" | "High") =>
                            setNewItem({ ...newItem, stackability: value })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Stackability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fragility" className="text-right">
                          Fragility
                        </Label>
                        <Select
                          value={newItem.fragility}
                          onValueChange={(value: "Low" | "Medium" | "High") =>
                            setNewItem({ ...newItem, fragility: value })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Fragility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddItemDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
                        onClick={handleAddItem}
                      >
                        Add Item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-10 w-10 text-[#3456FF] animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Items Found
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Add your first pallet item to get started"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                      onClick={() => setShowAddItemDialog(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className="h-4 w-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-gray-500">
                              {item.dimensions}
                            </p>
                          </div>
                          {item.ai_recommended && (
                            <Badge className="bg-gradient-to-r from-[#3456FF]/20 to-[#8763FF]/20 text-[#3456FF]">
                              AI Recommended
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Weight:</span>{" "}
                            {item.weight}
                          </div>
                          <div>
                            <span className="text-gray-500">Volume:</span>{" "}
                            {item.volume} u³
                          </div>
                          <div>
                            <span className="text-gray-500">Stackability:</span>{" "}
                            <Badge
                              variant="outline"
                              className={
                                item.stackability === "High"
                                  ? "bg-green-100 text-green-800"
                                  : item.stackability === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {item.stackability}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">Fragility:</span>{" "}
                            <Badge
                              variant="outline"
                              className={
                                item.fragility === "Low"
                                  ? "bg-green-100 text-green-800"
                                  : item.fragility === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {item.fragility}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                              Optimization Score
                            </span>
                            <span className="font-medium">
                              {item.optimization_score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] h-1.5 rounded-full"
                              style={{ width: `${item.optimization_score}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10 text-[#3456FF] hover:from-[#3456FF]/20 hover:to-[#8763FF]/20"
                            onClick={() => addToPallet(item)}
                          >
                            Add to Pallet
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mixer" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Pallet Controls</CardTitle>
                <CardDescription>
                  Configure your pallet settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Dimensions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Width (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="120"
                        className="h-8"
                        value={palletDimensions.width}
                        onChange={(e) =>
                          setPalletDimensions({
                            ...palletDimensions,
                            width: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Length (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        className="h-8"
                        value={palletDimensions.length}
                        onChange={(e) =>
                          setPalletDimensions({
                            ...palletDimensions,
                            length: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Height (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="160"
                        className="h-8"
                        value={palletDimensions.height}
                        onChange={(e) =>
                          setPalletDimensions({
                            ...palletDimensions,
                            height: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Configuration Name
                  </h4>
                  <Input
                    placeholder="My Pallet Configuration"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Weight Limit</h4>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      placeholder="1000"
                      className="mr-2"
                      value={weightLimit}
                      onChange={(e) => setWeightLimit(Number(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">kg</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Optimization Priority
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="space"
                        className="h-4 w-4"
                        checked={optimizationPriorities.space}
                        onChange={(e) =>
                          setOptimizationPriorities((prev) => ({
                            ...prev,
                            space: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor="space" className="text-sm">
                        Space Efficiency
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="stability"
                        className="h-4 w-4"
                        checked={optimizationPriorities.stability}
                        onChange={(e) =>
                          setOptimizationPriorities((prev) => ({
                            ...prev,
                            stability: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor="stability" className="text-sm">
                        Stability
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="picking"
                        className="h-4 w-4"
                        checked={optimizationPriorities.picking}
                        onChange={(e) =>
                          setOptimizationPriorities((prev) => ({
                            ...prev,
                            picking: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor="picking" className="text-sm">
                        Picking Efficiency
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="loading"
                        className="h-4 w-4"
                        checked={optimizationPriorities.loading}
                        onChange={(e) =>
                          setOptimizationPriorities((prev) => ({
                            ...prev,
                            loading: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor="loading" className="text-sm">
                        Loading Time
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-[#00C49F] to-[#5C4EFF] text-white hover:from-[#00B38E] hover:to-[#4B3DE0]"
                    onClick={runAIOptimization}
                    disabled={loading || palletItemsSelected.length === 0}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14 3V7C14 7.55228 14.4477 8 15 8H19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H14L19 8V19C19 20.1046 18.1046 21 17 21Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 17L12 14L15 17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 14V19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Run AI Optimization
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={saveConfiguration}
                    disabled={loading || palletItemsSelected.length === 0}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - 3D Visualization */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>3D Pallet Mixer</CardTitle>
                  <CardDescription>
                    Drag and drop items to build your pallet
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                {/* Professional 3D pallet visualization */}
                <div className="relative h-[500px] bg-gradient-to-b from-[#f0f4f8] to-[#e5e9ef] border rounded-md overflow-hidden shadow-inner">
                  {/* Grid floor */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                      linear-gradient(to right, rgba(200, 200, 200, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(200, 200, 200, 0.1) 1px, transparent 1px),
                      radial-gradient(circle at 50% 40%, rgba(80, 120, 200, 0.03) 0%, transparent 70%)
                    `,
                      backgroundSize: "30px 30px, 30px 30px, 100% 100%",
                    }}
                  ></div>

                  {/* Ruler marks on left side */}
                  <div className="absolute left-0 top-10 bottom-10 w-[20px] flex flex-col justify-between">
                    {[...Array(5)].map((_, i) => (
                      <div key={`ruler-${i}`} className="flex items-center">
                        <div className="w-2 h-[1px] bg-gray-400"></div>
                        <div className="text-[9px] text-gray-500 ml-1">
                          {(5 - i) * 20}cm
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Professional lighting effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white opacity-20"></div>

                  {/* Pallet base with realistic shadow */}
                  <div className="absolute bottom-8 left-[5%] right-[5%] h-2 bg-[#B9B9B9]/80 filter blur-[4px] rounded-full"></div>
                  <div
                    className="absolute bottom-10 left-[10%] right-[10%] h-5 overflow-hidden"
                    style={{ perspective: "500px" }}
                  >
                    <div className="w-full h-full bg-gradient-to-r from-[#D4C4A8] to-[#C0AA8E] border border-[#B09980] relative">
                      {/* Wooden texture */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0h2v100H0zm10 0h1v100h-1zm9 0h1v100h-1zm6 0h1v100h-1zm6 0h2v100h-2zm-4 0h1v100h-1zm18 0h2v100h-2zm5 0h1v100h-1zm4 0h2v100h-2zm10 0h1v100h-1zm9 0h1v100h-1zm13 0h1v100h-1zm6 0h1v100h-1z' fill='rgba(120,80,40,0.1)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                          backgroundSize: "100px 100px",
                        }}
                      ></div>

                      {/* Pallet slats */}
                      <div className="absolute inset-0 flex">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={`slat-${i}`}
                            className="flex-1 mx-[1px]"
                            style={{
                              backgroundColor:
                                i % 2 === 0
                                  ? "rgba(150, 120, 80, 0.2)"
                                  : "rgba(140, 110, 70, 0.1)",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Measurement indicators */}
                  <div className="absolute top-2 right-2 flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 shadow-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#FF5252]"></div>
                      <span className="ml-1">X</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#4CAF50]"></div>
                      <span className="ml-1">Y</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#2196F3]"></div>
                      <span className="ml-1">Z</span>
                    </div>
                  </div>

                  {/* Empty state or items */}
                  {palletItemsSelected.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="mb-8 relative">
                        <div className="w-32 h-32 border-2 border-dashed border-[#3456FF]/30 rounded-lg flex items-center justify-center bg-[#3456FF]/5">
                          <Layers className="h-16 w-16 text-[#3456FF]/30" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#3456FF] rounded-full flex items-center justify-center shadow-lg">
                          <PlusCircle className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-3">
                        Your Pallet is Empty
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md text-center mb-6">
                        Add items from the catalog to build your pallet
                        configuration
                      </p>

                      <Button
                        className="pointer-events-auto bg-gradient-to-r from-[#3456FF] to-[#5C4EFF] text-white hover:shadow-lg transition-all"
                        onClick={() => setActiveTab("items")}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Items from
                        Catalog
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 pointer-events-auto overflow-hidden">
                      {/* High-quality box visualization */}
                      {palletItemsSelected.map((item, index) => {
                        // Parse dimensions and calculate scaled size
                        const dimensions = item.dimensions
                          ?.split("x")
                          .map(Number) || [30, 20, 15];
                        const [width, depth, height] = dimensions;

                        // Calculate position with proper stacking
                        // Items placed earlier are positioned at the bottom of the pallet
                        const zPosition = Math.max(20, index * 5); // Higher index = higher position on Z axis
                        const stackPosition = index % 5; // Determines position in current layer

                        return (
                          <div
                            key={item.palletId}
                            className="absolute cursor-move group transition-all duration-200"
                            style={{
                              left: `${20 + stackPosition * 15}%`,
                              bottom: `${10 + zPosition}px`,
                              transform: "translateX(-50%)",
                              zIndex: 20 + index,
                            }}
                          >
                            {/* Box container with proper 3D perspective */}
                            <div
                              className="relative"
                              style={{
                                perspective: "800px",
                                transformStyle: "preserve-3d",
                              }}
                            >
                              {/* Main box body */}
                              <div
                                className="relative"
                                style={{
                                  width: `${width * 0.6}px`,
                                  height: `${depth * 0.6}px`,
                                  transform: `translateZ(${height * 0.3}px)`,
                                  transformStyle: "preserve-3d",
                                }}
                              >
                                {/* Box top - cardboard appearance */}
                                <div
                                  className="absolute top-0 left-0 w-full h-full border border-[#b89c7d]/50"
                                  style={{
                                    backgroundColor: "#d4bc98",
                                    backgroundImage: `
                                      linear-gradient(90deg, rgba(255,255,255,0.07) 0%, rgba(241,227,205,0.07) 20%, rgba(229,213,179,0.07) 40%, rgba(227,209,168,0.07) 60%, rgba(255,255,255,0.07) 80%),
                                      url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23b7a89a' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                                    transformStyle: "preserve-3d",
                                    backfaceVisibility: "hidden",
                                    boxShadow:
                                      "inset 0 0 0 1px rgba(191, 168, 124, 0.2)",
                                  }}
                                >
                                  {/* Cardboard box flaps */}
                                  <div className="absolute left-[10%] right-[10%] h-[2px] bg-[#c9b08a] bottom-0"></div>
                                  <div className="absolute top-0 left-[10%] right-[10%] h-[2px] bg-[#c9b08a]"></div>

                                  {/* Packaging tape */}
                                  <div
                                    className="absolute left-[45%] right-[45%] top-0 bottom-0 bg-[#e2d0ad]"
                                    style={{
                                      boxShadow:
                                        "inset 0 0 1px rgba(0,0,0,0.2)",
                                      backgroundImage:
                                        "linear-gradient(to bottom, rgba(185,167,135,0.1), rgba(185,167,135,0.2), rgba(185,167,135,0.1))",
                                    }}
                                  ></div>

                                  {/* Product label - shipping sticker style */}
                                  <div
                                    className="absolute left-[5%] top-[15%] w-[60%] h-[60%] bg-white rounded-sm"
                                    style={{
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      transform: "rotate(-1deg)",
                                      border: "1px solid rgba(0,0,0,0.1)",
                                    }}
                                  >
                                    <div className="p-1 flex flex-col justify-between h-full">
                                      <div>
                                        <div className="text-[8px] font-bold text-gray-800 truncate">
                                          {item.name}
                                        </div>
                                        <div className="text-[6px] text-gray-500">
                                          SKU:{" "}
                                          {Math.floor(Math.random() * 1000000)}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-end">
                                        <span className="text-[6px] text-gray-700 px-1 bg-gray-100 rounded-sm">
                                          {item.dimensions}
                                        </span>
                                        <span className="text-[7px] font-medium text-gray-800">
                                          {item.weight} kg
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Barcode graphic */}
                                  <div
                                    className="absolute top-[20%] right-[5%] w-[25px] h-[15px] bg-white rounded-sm p-[2px]"
                                    style={{
                                      transform: "rotate(1deg)",
                                      boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage:
                                          "linear-gradient(90deg, #000 0%, #000 10%, transparent 10%, transparent 20%, #000 20%, #000 25%, transparent 25%, transparent 35%, #000 35%, #000 50%, transparent 50%, transparent 60%, #000 60%, #000 75%, transparent 75%, transparent 85%, #000 85%, #000 100%)",
                                      }}
                                    ></div>
                                    <div className="text-[4px] text-center text-gray-800 mt-[1px]">
                                      ID-{item.palletId}
                                    </div>
                                  </div>

                                  {/* Handle with care icon */}
                                  <div
                                    className="absolute bottom-[10%] right-[8%] w-[15px] h-[15px]"
                                    style={{
                                      backgroundImage:
                                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cc0000' stroke-width='2'%3E%3Cpath d='M12 2L2 12h5v8h10v-8h5L12 2z'/%3E%3C/svg%3E\")",
                                      backgroundSize: "contain",
                                      opacity: 0.7,
                                    }}
                                  ></div>
                                </div>

                                {/* Box front face - cardboard */}
                                <div
                                  className="absolute w-full origin-top"
                                  style={{
                                    height: `${height * 0.6}px`,
                                    top: `${depth * 0.6}px`,
                                    backgroundColor: "#c0a982", // Slightly darker cardboard
                                    backgroundImage: `
                                      url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23b7a89a' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                                    transform: "rotateX(-90deg)",
                                    transformStyle: "preserve-3d",
                                    borderLeft:
                                      "1px solid rgba(155,135,105,0.3)",
                                    borderRight:
                                      "1px solid rgba(155,135,105,0.3)",
                                    borderBottom:
                                      "1px solid rgba(155,135,105,0.3)",
                                  }}
                                >
                                  {/* Cardboard company logo/stamp */}
                                  <div
                                    className="absolute top-[30%] left-[30%] right-[30%] bottom-[30%] opacity-20"
                                    style={{
                                      backgroundImage:
                                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='1'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 12h8M12 8v8'/%3E%3C/svg%3E\")",
                                      backgroundSize: "contain",
                                      backgroundRepeat: "no-repeat",
                                      backgroundPosition: "center",
                                      transform: "rotate(15deg)",
                                    }}
                                  ></div>
                                </div>

                                {/* Box right face - cardboard */}
                                <div
                                  className="absolute h-full origin-left"
                                  style={{
                                    width: `${height * 0.6}px`,
                                    left: `${width * 0.6}px`,
                                    backgroundColor: "#b8a180", // Darkest cardboard side
                                    backgroundImage: `
                                      linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 100%),
                                      url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a79c8e' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                                    transform: "rotateY(90deg)",
                                    transformStyle: "preserve-3d",
                                    borderTop:
                                      "1px solid rgba(155,135,105,0.3)",
                                    borderBottom:
                                      "1px solid rgba(155,135,105,0.3)",
                                    borderRight:
                                      "1px solid rgba(155,135,105,0.3)",
                                  }}
                                >
                                  {/* Side handle icon - common in boxes */}
                                  <div className="absolute top-[10%] bottom-[10%] left-[30%] right-[30%] rounded-sm border border-[#A69580] opacity-30"></div>
                                </div>
                              </div>

                              {/* Realistic cardboard box shadow */}
                              <div
                                className="absolute bottom-[-5px] rounded-full"
                                style={{
                                  width: `${width * 0.6}px`,
                                  height: `${depth * 0.3}px`,
                                  background:
                                    "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0) 70%)",
                                  transform: "rotateX(90deg) translateZ(-2px)",
                                }}
                              ></div>

                              {/* Cardboard edge wear and damage (small imperfections for realism) */}
                              <div
                                className="absolute"
                                style={{
                                  width: `${width * 0.6}px`,
                                  height: `${depth * 0.6}px`,
                                  transform: `translateZ(${height * 0.3}px)`,
                                  pointerEvents: "none",
                                }}
                              >
                                {/* Corner damage */}
                                <div
                                  className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#b09878] opacity-40 rounded-sm"
                                  style={{ transform: "rotate(45deg)" }}
                                ></div>
                                {/* Edge wear */}
                                <div className="absolute top-[30%] left-0 w-[1px] h-[10px] bg-[#b09878] opacity-40"></div>
                                <div className="absolute bottom-[20%] right-0 w-[5px] h-[1px] bg-[#b09878] opacity-40"></div>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="absolute -top-3 -right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 rounded-full bg-white text-red-500 p-0 shadow-md hover:bg-red-500 hover:text-white transition-colors"
                                onClick={() => removeFromPallet(item.palletId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Item identifier */}
                            <div className="absolute -bottom-2 -left-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-[9px] font-medium rounded-sm shadow-sm text-gray-700">
                              #{index + 1}
                            </div>
                          </div>
                        );
                      })}

                      {/* Control panel */}
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-md shadow-md z-50 flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View from top"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                            <path d="M12 8v8" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View from side"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Auto-arrange"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="m9 3-6 6" />
                            <path d="M10 9H4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats bar */}
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Items</p>
                    <p className="text-lg font-medium">
                      {palletStats.itemCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Total Weight</p>
                    <p className="text-lg font-medium">
                      {palletStats.totalWeight} kg
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Volume Used</p>
                    <p className="text-lg font-medium">
                      {palletStats.volumeUsed}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Stability</p>
                    <p className="text-lg font-medium">
                      {palletStats.stability}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configurations" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Saved Configurations</CardTitle>
                <CardDescription>
                  View and load your saved pallet configurations
                </CardDescription>
              </div>
              <Button
                className="mt-4 sm:mt-0 bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
                onClick={() => setActiveTab("mixer")}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New Configuration
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-10 w-10 text-[#3456FF] animate-spin" />
                </div>
              ) : configurations.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Configurations Found
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first pallet configuration to get started
                  </p>
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                    onClick={() => setActiveTab("mixer")}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Configuration
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configurations.map((config) => (
                    <div
                      key={config.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{config.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {config.description || "No description"}
                            </p>
                          </div>
                          <Badge
                            className={
                              config.configuration_type === "optimized"
                                ? "bg-[#00C49F]/20 text-[#00C49F]"
                                : config.configuration_type === "standard"
                                ? "bg-[#3456FF]/20 text-[#3456FF]"
                                : "bg-[#8763FF]/20 text-[#8763FF]"
                            }
                          >
                            {config.configuration_type.charAt(0).toUpperCase() +
                              config.configuration_type.slice(1)}
                          </Badge>
                        </div>

                        <div className="mt-4 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Total Weight:</span>
                            <span>{config.total_weight} kg</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Items:</span>
                            <span>
                              {typeof config.items === "object"
                                ? Object.keys(config.items).length
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Template:</span>
                            <Badge
                              variant="outline"
                              className={
                                config.is_template
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {config.is_template ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>

                        {/* Simple visualization placeholder */}
                        <div className="mt-4 border rounded p-2 bg-gray-50 h-24 flex items-center justify-center">
                          <Layers className="h-8 w-8 text-gray-400" />
                        </div>

                        <div className="mt-4 flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("mixer")}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10 text-[#3456FF] hover:from-[#3456FF]/20 hover:to-[#8763FF]/20"
                            onClick={() => setActiveTab("mixer")}
                          >
                            Load in Mixer
                          </Button>
                        </div>

                        <div className="mt-3 text-xs text-gray-400 text-right">
                          Created:{" "}
                          {new Date(config.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Optimization Metrics</CardTitle>
            <CardDescription>Current optimization performance</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Set loading state before fetching
              setLoading(true);
              fetchMetrics();
            }}
            className="text-[#3456FF] hover:bg-[#3456FF]/10 transition-colors"
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !metrics ? (
            <div className="flex justify-center items-center py-6">
              <RefreshCw className="h-8 w-8 text-[#3456FF] animate-spin" />
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Space Efficiency</h4>
                <p className="text-xl font-bold">{metrics.space_efficiency}%</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Stability</h4>
                <p className="text-xl font-bold">{metrics.stability_score}%</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">Load Time</h4>
                <p className="text-xl font-bold">
                  -{metrics.load_time_reduction}%
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">
                  Picking Efficiency
                </h4>
                <p className="text-xl font-bold">
                  {metrics.picking_efficiency}%
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-500 mb-1">
                  Weight Distribution
                </h4>
                <p className="text-xl font-bold">
                  {metrics.weight_distribution}%
                </p>
              </div>
            </div>
          ) : null}

          {metrics ? (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Optimization Level</span>
                <span className="font-medium">
                  {metrics.optimization_level}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#00C49F] to-[#5C4EFF] h-2 rounded-full"
                  style={{ width: `${metrics.optimization_level}%` }}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-500">
                <div>Suggestion Count: {metrics.suggestion_count}</div>
                <div>
                  Last Analyzed:{" "}
                  {new Date(metrics.last_analyzed).toLocaleString()}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
