// @ts-nocheck
// This file contains the fixed button sections for the Pallet Mixer
// Copy these sections to replace the corresponding sections in page.tsx

// Button section with fixed loading references
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
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
      </>
    ) : (
      <>
        <Save className="mr-2 h-4 w-4" /> Save Configuration
      </>
    )}
  </Button>
</div>;

// Fixed toast implementations for the functions
// For runAIOptimization:
toast({
  title: "No Items",
  description: "Please add items to the pallet before running optimization.",
});

toast({
  title: "AI Optimization Complete",
  description: `${optimizedItems.length} items have been optimally arranged on the pallet.`,
});

toast({
  title: "Optimization Failed",
  description: "There was an error optimizing the pallet arrangement.",
});

// For saveConfiguration:
toast({
  title: "No Items",
  description:
    "Please add items to the pallet before saving the configuration.",
});

toast({
  title: "Configuration Saved",
  description: `"${configurationName}" has been saved to your configurations.`,
});

toast({
  title: "Save Failed",
  description: "There was an error saving your pallet configuration.",
});
