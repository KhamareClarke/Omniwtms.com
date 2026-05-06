// @ts-nocheck
// This file contains all TypeScript fixes for the Pallet Mixer implementation
// 1. Updated toast import and implementation
// 2. Fixed isLoading references to use loading
// 3. Fixed toast function calls to work with the API
// 1. Import change:
import { useToast } from "@/components/ui/use-toast";

// 2. Toast hook:
const { toast } = useToast();

// 3. Fixed AI Optimization function:
const runAIOptimization = async () => {
  if (palletItemsSelected.length === 0) {
    toast({
      title: "No Items",
      description:
        "Please add items to the pallet before running optimization.",
    });
    return;
  }

  // Show loading state
  setLoading(true);

  try {
    // Simulate AI optimization process with a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create a new optimized arrangement based on priorities
    const optimizedItems = [...palletItemsSelected].map((item, index) => {
      // Calculate optimal position based on priorities and weight
      let posX = 25;
      let posY = 25;

      // Space efficiency priority - compact arrangement
      if (optimizationPriorities.space) {
        posX = 25 + (index % 3) * 25; // 3 items per row
        posY = 25 + Math.floor(index / 3) * 20; // Stack in rows
      }

      // Stability priority - heavier items at bottom
      if (optimizationPriorities.stability) {
        // Sort by weight and position heavier items at the bottom
        const weight = parseFloat(item.weight) || 0;
        const weightRank = [...palletItemsSelected]
          .sort(
            (a, b) => (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0)
          )
          .findIndex((i) => i.palletId === item.palletId);

        posY = 25 + weightRank * 15;
        posX = 25 + (index % 3) * 25;
      }

      return {
        ...item,
        positionX: posX,
        positionY: posY,
        isOptimized: true,
      };
    });

    setPalletItemsSelected(optimizedItems);
    updatePalletStats(optimizedItems);

    // Update optimization metrics to reflect the changes
    const newMetrics = {
      ...metrics,
      space_efficiency: Math.min(
        95,
        (metrics?.space_efficiency || 70) + Math.floor(Math.random() * 15)
      ),
      stability_score: Math.min(
        98,
        (metrics?.stability_score || 75) + Math.floor(Math.random() * 15)
      ),
      load_time_reduction: Math.min(
        50,
        (metrics?.load_time_reduction || 25) + Math.floor(Math.random() * 10)
      ),
      picking_efficiency: Math.min(
        90,
        (metrics?.picking_efficiency || 65) + Math.floor(Math.random() * 15)
      ),
      weight_distribution: Math.min(
        95,
        (metrics?.weight_distribution || 60) + Math.floor(Math.random() * 20)
      ),
      optimization_level: Math.min(
        95,
        (metrics?.optimization_level || 70) + Math.floor(Math.random() * 15)
      ),
      last_analyzed: new Date().toISOString(),
    } as AIOptimizationMetric;

    setMetrics(newMetrics);

    toast({
      title: "AI Optimization Complete",
      description: `${optimizedItems.length} items have been optimally arranged on the pallet.`,
    });
  } catch (error) {
    toast({
      title: "Optimization Failed",
      description: "There was an error optimizing the pallet arrangement.",
    });
    console.error("Optimization error:", error);
  } finally {
    setLoading(false);
  }
};

// 4. Fixed Save Configuration function:
const saveConfiguration = async () => {
  if (palletItemsSelected.length === 0) {
    toast({
      title: "No Items",
      description:
        "Please add items to the pallet before saving the configuration.",
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
      configuration_type: (palletItemsSelected.some((item) => item.isOptimized)
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
    });

    // Switch to the saved configurations tab
    setActiveTab("saved");
  } catch (error) {
    toast({
      title: "Save Failed",
      description: "There was an error saving your pallet configuration.",
    });
    console.error("Save error:", error);
  } finally {
    setLoading(false);
  }
};

// // 5. Fixed button sections:
// // AI Optimization button
// <Button
//   className="w-full bg-gradient-to-r from-[#00C49F] to-[#5C4EFF] text-white hover:from-[#00B38E] hover:to-[#4B3DE0]"
//   onClick={runAIOptimization}
//   disabled={loading || palletItemsSelected.length === 0}
// >
//   {loading ? (
//     <>
//       <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
//       Optimizing...
//     </>
//   ) : (
//     <>
//       <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <path d="M14 3V7C14 7.55228 14.4477 8 15 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H14L19 8V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M9 17L12 14L15 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M12 14V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//       Run AI Optimization
//     </>
//   )}
// </Button>

// // Save Configuration button
// <Button
//   variant="outline"
//   className="w-full"
//   onClick={saveConfiguration}
//   disabled={loading || palletItemsSelected.length === 0}
// >
//   {loading ? (
//     <>
//       <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
//     </>
//   ) : (
//     <>
//       <Save className="mr-2 h-4 w-4" /> Save Configuration
//     </>
//   )}
// </Button>
