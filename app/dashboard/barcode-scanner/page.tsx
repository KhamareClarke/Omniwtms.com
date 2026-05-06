// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Barcode,
  Camera,
  Search,
  RefreshCw,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  History,
  X,
  FlipHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/auth/SupabaseClient";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import { DecodeHintType, Result } from "@zxing/library";
import { BrowserCodeReader } from "@zxing/browser";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  quantity: number;
  category: string;
  condition: string;
  status: "pending" | "saved";
  current_stock: number;
  updated_at: string;
}

interface SearchHistory {
  barcode: string;
  timestamp: number;
  found: boolean;
  productName?: string;
}

export default function BarcodeScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [checkInQuantity, setCheckInQuantity] = useState(1);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<
    "idle" | "scanning" | "found"
  >("idle");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [cameraMode, setCameraMode] = useState<"environment" | "user">(
    "environment"
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("barcodeSearchHistory");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [checkOutQuantity, setCheckOutQuantity] = useState(1);

  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<BrowserCodeReader | null>(null); // To store the controls returned by decodeFromVideoDevice
  const [isCameraReady, setIsCameraReady] = useState(false); // New state to indicate if camera stream is ready

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "barcodeSearchHistory",
        JSON.stringify(searchHistory)
      );
    }
  }, [searchHistory]);

  // Handle starting/stopping scanner based on isScanning state (runs when isScanning or cameraMode changes)
  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }
    // Cleanup for this effect: ensures scanner stops if dependencies change or component unmounts
    return () => {
      stopScanner();
    };
  }, [isScanning, cameraMode]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const stopScanner = () => {
    // No longer stopping ZXing continuous decoding here, as it's not continuous
    if (controlsRef.current) {
      console.log("Clearing ZXing controls reference.");
      controlsRef.current.stop(); // Stop the continuous decoding process
      controlsRef.current = null;
    }

    // Stop the video stream
    if (videoRef.current?.srcObject) {
      console.log("Stopping video stream.");
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Reset the BrowserMultiFormatReader instance
    if (codeReader.current) {
      try {
        codeReader.current.reset(); // This method should exist on BrowserMultiFormatReader
      } catch (error) {
        console.error("Error resetting codeReader:", error);
      } finally {
        codeReader.current = null; // Ensure it's nullified after attempt to reset
      }
    }

    setScanningStatus("idle");
    setIsCameraReady(false); // Camera is no longer ready
    // Clear canvas when stopping scanner
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }
  };

  const startScanner = async () => {
    try {
      console.log("Starting scanner...");
      setScanningStatus("scanning"); // Still show scanning status during camera start-up
      setIsCameraReady(false); // Reset before starting camera

      stopScanner(); // Ensure any previous streams are stopped

      if (!codeReader.current) {
        console.log("Creating new BrowserMultiFormatReader instance");
        codeReader.current = new BrowserMultiFormatReader();
      }

      // Configure hints for barcode detection
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.TRY_HARDER, true); // Instructs the reader to spend more time looking for a barcode
      hints.set(DecodeHintType.ALSO_INVERTED, true); // Try decoding the inverted image as well
      // Explicitly set possible formats for the reader to consider (focused on 1D for Code 128)
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13, // Keep EAN_13 as it's a common 1D format
      ]);

      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      console.log("Camera access granted:", stream.getVideoTracks()[0].label);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current
            ?.play()
            .then(() => {
              console.log(
                "Video is playing. ReadyState:",
                videoRef.current?.readyState,
                "Dimensions:",
                videoRef.current?.videoWidth,
                "x",
                videoRef.current?.videoHeight
              );
              // Ensure canvas is correctly sized after video loads.
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                // Initial clear of canvas for visual cleanliness
                const context = canvasRef.current.getContext("2d");
                if (context) {
                  context.clearRect(
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height
                  );
                }
              }
              setIsCameraReady(true); // Camera is now ready for capture
              setScanningStatus("idle"); // Change status to idle after camera is ready
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              showNotification("Error starting video stream", "error");
              setIsScanning(false);
              setScanningStatus("idle");
              setIsCameraReady(false);
            });
        };

        videoRef.current.onerror = (err) => {
          console.error("Video element error:", err);
          showNotification("Error with video stream", "error");
          setIsScanning(false);
          setScanningStatus("idle");
          setIsCameraReady(false);
        };
        // Start continuous decoding
        codeReader.current
          .decodeFromStream(
            stream,
            videoRef.current,
            (
              result: Result | undefined | null,
              err: Error | undefined | null
            ) => {
              if (result) {
                console.log("Continuous Barcode detected:", result.getText());
                handleScan(result.getText());
                setIsScanning(false); // Stop scanning after a barcode is found
              }
              if (err && err.name !== "NotFoundException") {
                console.error("Continuous scanning error:", err);
                // Optionally show notification for persistent errors, but not for NotFoundException
              }
            },
            hints
          )
          .then((controls: BrowserCodeReader) => {
            // Store the controls to be able to stop the continuous scanning later
            controlsRef.current = controls;
          })
          .catch((err: any) => {
            console.error("Error starting continuous decodeFromVideo:", err);
            showNotification("Failed to start continuous scanning.", "error");
            setIsScanning(false);
            setScanningStatus("idle");
            setIsCameraReady(false);
          });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      showNotification(
        "Failed to access camera. Please make sure you have granted camera permissions.",
        "error"
      );
      setIsScanning(false);
      setScanningStatus("idle");
      setIsCameraReady(false);
    }
  };

  const toggleCamera = async () => {
    const newMode = cameraMode === "environment" ? "user" : "environment";
    setCameraMode(newMode);
  };

  const addToHistory = (
    barcode: string,
    found: boolean,
    productName?: string
  ) => {
    const newHistory = [
      { barcode, timestamp: Date.now(), found, productName },
      ...searchHistory,
    ].slice(0, 5); // Keep only last 5 searches
    setSearchHistory(newHistory);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("barcodeSearchHistory");
    }
  };

  const handleHistoryClick = (barcode: string) => {
    setManualCode(barcode);
    handleManualSearch();
  };

  const handleScan = async (code: string) => {
    if (!code) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", code)
        .single();

      if (error) throw error;

      if (data) {
        setProduct(data);
        showNotification(`Successfully found product: ${data.name}`, "success");
        setScanningStatus("found");
        addToHistory(code, true, data.name);
      } else {
        showNotification(
          "Product not found. Please check available barcodes in the Inventory tab.",
          "error"
        );
        setProduct(null);
        setScanningStatus("idle");
        addToHistory(code, false);
      }
    } catch (error) {
      console.error("Error searching product:", error);
      showNotification(
        "Product not found. Please check available barcodes in the Inventory tab.",
        "error"
      );
      setScanningStatus("idle");
      addToHistory(code, false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      showNotification("Please enter a barcode", "error");
      return;
    }

    setLoading(true);
    setScanningStatus("scanning");

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", manualCode.trim())
        .single();

      if (error) throw error;

      if (data) {
        setProduct(data);
        showNotification(`Successfully found product: ${data.name}`, "success");
        setScanningStatus("found");
        addToHistory(manualCode.trim(), true, data.name);
      } else {
        showNotification(
          "Product not found. Please check available barcodes in the Inventory tab.",
          "error"
        );
        setProduct(null);
        setScanningStatus("idle");
        addToHistory(manualCode.trim(), false);
      }
    } catch (error) {
      console.error("Error searching product:", error);
      showNotification(
        "Product not found. Please check available barcodes in the Inventory tab.",
        "error"
      );
      setScanningStatus("idle");
      addToHistory(manualCode.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ quantity: product.quantity + checkInQuantity })
        .eq("id", product.id);

      if (error) throw error;

      setProduct((prev) =>
        prev ? { ...prev, quantity: prev.quantity + checkInQuantity } : null
      );
      setShowCheckInDialog(false);
      showNotification(
        `Successfully checked in ${checkInQuantity} item(s) for ${product.name}`,
        "success"
      );
    } catch (error) {
      console.error("Error checking in product:", error);
      showNotification("Failed to check in product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!product) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      setProduct(null);
      setShowCheckOutDialog(false);
      showNotification(
        "Product successfully removed from inventory",
        "success"
      );
    } catch (error) {
      console.error("Error removing product:", error);
      showNotification("Failed to remove product from inventory", "error");
    }
  };

  const handleRefresh = () => {
    setManualCode("");
    setProduct(null);
    setScanningStatus("idle");
    setLoading(false);
    setIsScanning(false);
    stopScanner(); // Call stopScanner for full cleanup
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Barcode Scanner
          </h1>
          <p className="text-gray-600 mt-1">
            Scan or enter barcodes to manage inventory
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setIsScanning(!isScanning)}
            className="flex-1 md:flex-none flex items-center gap-2 bg-[#3456FF] hover:bg-[#3456FF]/90 text-white"
          >
            {isScanning ? (
              <>
                <X className="h-4 w-4" />
                Stop Scanner
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start Scanner
              </>
            )}
          </Button>
          <Button
            onClick={toggleCamera}
            variant="outline"
            className="flex-1 md:flex-none"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex-1 md:flex-none"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="space-y-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border-2 border-gray-300">
            <video
              ref={videoRef}
              className="w-full h-auto transform origin-center"
              style={{
                transform: cameraMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />

            {/* Scanning Guide Box and Text (JSX controlled) */}
            {isScanning && !loading && scanningStatus !== "found" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="relative w-[70%] h-[70%] border-4 border-white rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    Position barcode in frame
                  </span>
                  {/* Corner markers */}
                  <span className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white" />
                </div>
              </div>
            )}

            {/* Barcode Detected Overlay (JSX controlled) */}
            {scanningStatus === "found" && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-50 rounded-lg">
                <div className="text-white text-xl font-bold p-4 rounded-lg">
                  Barcode Detected!
                </div>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode manually"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleManualSearch}
              disabled={loading || !manualCode.trim()}
              className="flex items-center gap-2 min-w-[100px] md:min-w-[120px] justify-center bg-[#3456FF] hover:bg-[#3456FF]/90 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden md:inline">Scanning...</span>
                  <span className="md:hidden">...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="hidden md:inline">Search</span>
                  <span className="md:hidden">Go</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Product Info */}
          {product && (
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowDetailsDialog(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none min-w-[100px]"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => setShowCheckInDialog(true)}
                    className="flex-1 md:flex-none min-w-[100px] bg-[#3456FF] hover:bg-[#3456FF]/90 text-white"
                    size="sm"
                  >
                    Check In
                  </Button>
                  <Button
                    onClick={() => setShowCheckOutDialog(true)}
                    className="flex-1 md:flex-none min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Check Out
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.current_stock}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search History */}
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Searches
              </h3>
              {searchHistory.length > 0 && (
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              )}
            </div>
            {searchHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No recent searches
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleHistoryClick(item.barcode)}
                  >
                    <div className="flex items-center gap-2">
                      {item.found ? (
                        <Package className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.barcode}
                        </p>
                        {item.productName && (
                          <p className="text-xs text-gray-500">
                            {item.productName}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check In Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Product</DialogTitle>
            <DialogDescription>
              Enter the quantity of items to check in
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min="1"
              value={checkInQuantity}
              onChange={(e) =>
                setCheckInQuantity(parseInt(e.target.value) || 1)
              }
              className="w-full"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckInDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              className="flex-1 bg-[#3456FF] hover:bg-[#3456FF]/90"
            >
              Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {product && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SKU</p>
                <p className="font-medium">{product.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Barcode</p>
                <p className="font-medium">{product.barcode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">£{product.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{product.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Condition</p>
                <p className="font-medium">{product.condition}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{product.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="font-medium">{product.current_stock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {new Date(product.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Inventory</DialogTitle>
            <DialogDescription>
              Are you sure you want to completely remove this product from
              inventory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckOutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
