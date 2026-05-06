// @ts-nocheck
// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  FlipHorizontal,
  Search,
  RefreshCw,
  ArrowLeft,
  History,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
} from "@zxing/library";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Initialize Supabase client
const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [checkInQuantity, setCheckInQuantity] = useState(1);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<
    "idle" | "scanning" | "found"
  >("idle");
  const [cameraMode, setCameraMode] = useState<"environment" | "user">(
    "environment"
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("courierBarcodeSearchHistory");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "courierBarcodeSearchHistory",
        JSON.stringify(searchHistory)
      );
    }
  }, [searchHistory]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const addToHistory = (
    barcode: string,
    found: boolean,
    productName?: string
  ) => {
    const newHistory = [
      { barcode, timestamp: Date.now(), found, productName },
      ...searchHistory,
    ].slice(0, 5);
    setSearchHistory(newHistory);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("courierBarcodeSearchHistory");
    }
  };

  const handleHistoryClick = (barcode: string) => {
    setManualCode(barcode);
    handleManualSearch();
  };

  const startScanner = async () => {
    try {
      setScanningStatus("scanning");
      setIsCameraReady(false);
      stopScanner();

      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
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
              setIsCameraReady(true);
              setScanningStatus("idle");
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              toast.error("Error starting video stream");
              setIsScanning(false);
              setScanningStatus("idle");
              setIsCameraReady(false);
            });
        };

        videoRef.current.onerror = (err) => {
          console.error("Video element error:", err);
          toast.error("Error with video stream");
          setIsScanning(false);
          setScanningStatus("idle");
          setIsCameraReady(false);
        };

        codeReader.current.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (result) {
              handleScan(result.getText());
              setIsScanning(false);
            }
          },
          hints
        );
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error(
        "Failed to access camera. Please make sure you have granted camera permissions."
      );
      setIsScanning(false);
      setScanningStatus("idle");
      setIsCameraReady(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanningStatus("idle");
    setIsCameraReady(false);
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

  const toggleCamera = () => {
    const newMode = cameraMode === "environment" ? "user" : "environment";
    setCameraMode(newMode);
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
        toast.success(`Found product: ${data.name}`);
        setScanningStatus("found");
        addToHistory(code, true, data.name);
      } else {
        toast.error("Product not found");
        setProduct(null);
        setScanningStatus("idle");
        addToHistory(code, false);
      }
    } catch (error) {
      console.error("Error searching product:", error);
      toast.error("Product not found");
      setScanningStatus("idle");
      addToHistory(code, false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a barcode");
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
        toast.success(`Found product: ${data.name}`);
        setScanningStatus("found");
        addToHistory(manualCode.trim(), true, data.name);
      } else {
        toast.error("Product not found");
        setProduct(null);
        setScanningStatus("idle");
        addToHistory(manualCode.trim(), false);
      }
    } catch (error) {
      console.error("Error searching product:", error);
      toast.error("Product not found");
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
      toast.success(
        `Successfully checked in ${checkInQuantity} item(s) for ${product.name}`
      );
    } catch (error) {
      console.error("Error checking in product:", error);
      toast.error("Failed to check in product");
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
      toast.success("Product successfully removed from inventory");
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Failed to remove product from inventory");
    }
  };

  const handleRefresh = () => {
    setManualCode("");
    setProduct(null);
    setScanningStatus("idle");
    setLoading(false);
    setIsScanning(false);
    stopScanner();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
              Barcode Scanner
            </h1>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
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
            </div>

            <div className="relative w-full aspect-video overflow-hidden rounded-lg border-2 border-gray-300">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform origin-center"
                style={{
                  transform: cameraMode === "user" ? "scaleX(-1)" : "none",
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {isScanning && !loading && scanningStatus !== "found" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="relative w-[70%] h-[70%] border-4 border-white rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      Position barcode in frame
                    </span>
                    <span className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white" />
                    <span className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white" />
                  </div>
                </div>
              )}

              {scanningStatus === "found" && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-50 rounded-lg">
                  <div className="text-white text-xl font-bold p-4 rounded-lg">
                    Barcode Detected!
                  </div>
                </div>
              )}
            </div>

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
          </div>

          {/* Recent Scans Section */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Searches
              </h2>
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
            <ScrollArea className="h-[calc(100vh-300px)]">
              {searchHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recent searches
                </p>
              ) : (
                <div className="space-y-2">
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
            </ScrollArea>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {product && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
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
                  <p className="font-medium">${product.price}</p>
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
