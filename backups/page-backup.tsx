// // @ts-nocheck
// "use client";

// import { useState, useRef, useEffect } from 'react';
// import dynamic from 'next/dynamic';

// // Dynamically import the 3D renderer component to avoid SSR issues
// const Warehouse3DRenderer = dynamic(() => import('./3dRenderer'), { ssr: false });
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Upload, ZoomIn, ZoomOut, RefreshCw, Loader2, Package, Grid, Box, BarChart } from 'lucide-react';
// import { useToast } from "@/components/ui/use-toast";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// // Define warehouse zone type
// type Zone = {
//   id: number;
//   name: string;
//   color: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   items: number;
//   efficiency: number;
//   congestion: number;
//   travelDistance: number;
//   type: string;
// };

// // Define point type for pathways
// type Point = {
//   x: number;
//   y: number;
// };

// export default function WarehouseVisualization() {
//   const { toast } = useToast();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   // State management
//   const [uploadedImage, setUploadedImage] = useState<string | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'heatmap'>('2d');
//   const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
//   const [detectedZones, setDetectedZones] = useState<Zone[]>([]);
//   const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
//   const [processingStatus, setProcessingStatus] = useState({
//     uploadComplete: false,
//     processingComplete: false,
//     zonesDetected: false,
//     view2DGenerated: false,
//     view3DGenerated: false,
//     heatmapGenerated: false
//   });

//   // 3D view state
//   const [view3DState, setView3DState] = useState({
//     rotateX: 45,
//     rotateZ: -15,
//     scale: 1,
//     isDragging: false,
//     lastMouseX: 0,
//     lastMouseY: 0
//   });

//   // Default warehouse zones data
//   const defaultZones: Zone[] = [
//     {
//       id: 1,
//       name: 'Receiving Area',
//       color: '#B3C9F5',
//       x: 50,
//       y: 50,
//       width: 150,
//       height: 100,
//       items: 208,
//       efficiency: 94,
//       congestion: 24,
//       travelDistance: 123,
//       type: 'receiving'
//     },
//     {
//       id: 2,
//       name: 'Bulk Storage',
//       color: '#A8F0F9',
//       x: 220,
//       y: 50,
//       width: 200,
//       height: 200,
//       items: 579,
//       efficiency: 80,
//       congestion: 51,
//       travelDistance: 161,
//       type: 'storage'
//     },
//     {
//       id: 3,
//       name: 'Picking Zone',
//       color: '#C2F5D2',
//       x: 50,
//       y: 170,
//       width: 150,
//       height: 150,
//       items: 322,
//       efficiency: 93,
//       congestion: 11,
//       travelDistance: 83,
//       type: 'processing'
//     },
//     {
//       id: 4,
//       name: 'Packing Station',
//       color: '#FEE4C2',
//       x: 220,
//       y: 270,
//       width: 150,
//       height: 100,
//       items: 177,
//       efficiency: 87,
//       congestion: 16,
//       travelDistance: 112,
//       type: 'processing'
//     },
//     {
//       id: 5,
//       name: 'Shipping Dock',
//       color: '#FFDBD9',
//       x: 50,
//       y: 340,
//       width: 150,
//       height: 100,
//       items: 186,
//       efficiency: 82,
//       congestion: 35,
//       travelDistance: 131,
//       type: 'shipping'
//     },
//     {
//       id: 6,
//       name: 'QC Area',
//       color: '#E4CEF7',
//       x: 390,
//       y: 270,
//       width: 100,
//       height: 100,
//       items: 70,
//       efficiency: 94,
//       congestion: 5,
//       travelDistance: 73,
//       type: 'quality'
//     },
//     {
//       id: 7,
//       name: 'Returns Processing',
//       color: '#FFD1A3',
//       x: 380,
//       y: 40,
//       width: 110,
//       height: 100,
//       items: 99,
//       efficiency: 77,
//       congestion: 34,
//       travelDistance: 125,
//       type: 'returns'
//     }
//   ];

//   // Total metrics calculation
//   const totalItems = defaultZones.reduce((sum, zone) => sum + zone.items, 0);

//   // Process uploaded image
//   const processImage = (imageUrl: string) => {
//     setIsProcessing(true);
//     setProgress(0);

//     // Progress updates
//     const interval = setInterval(() => {
//       setProgress(prev => {
//         if (prev >= 95) {
//           clearInterval(interval);
//           return prev;
//         }
//         return prev + 5;
//       });
//     }, 150);

//     // Create an image object to get dimensions and analyze the image
//     const img = new Image();

//     img.onload = () => {
//       try {
//         // Get image dimensions for proper scaling
//         const aspectRatio = img.width / img.height;
//         let displayWidth = 550;
//         let displayHeight = displayWidth / aspectRatio;

//         if (displayHeight > 500) {
//           displayHeight = 500;
//           displayWidth = displayHeight * aspectRatio;
//         }

//         setImageDimensions({ width: displayWidth, height: displayHeight });

//         // Process the image
//         analyzeImage(img);

//         // Start generating 3D view after a delay
//         setTimeout(() => {
//           generate3DView(img);
//         }, 1500);

//         // Start generating heatmap after a delay
//         setTimeout(() => {
//           generateHeatmap();
//         }, 2500);

//         // Complete the processing
//         clearInterval(interval);
//         setProgress(100);

//         toast({
//           title: "Floor plan processed successfully"
//         });

//         setTimeout(() => {
//           setIsProcessing(false);
//         }, 1000);
//       } catch (error) {
//         clearInterval(interval);
//         setIsProcessing(false);
//         toast({
//           title: "Error during image processing",
//           variant: "destructive"
//         });
//       }
//     };

//     img.onerror = () => {
//       clearInterval(interval);
//       setIsProcessing(false);
//       toast({
//         title: "Failed to load image",
//         variant: "destructive"
//       });
//     };

//     // Set the image source to the uploaded image
//     img.src = imageUrl;
//   };

//   // Generate 3D view from 2D floor plan with enhanced processing
//   const generate3DView = (img: HTMLImageElement) => {
//     console.log('Generating enhanced 3D view from image with dimensions:', img.width, 'x', img.height);

//     // Create a canvas to analyze the image for 3D generation
//     const canvas = document.createElement('canvas');
//     canvas.width = img.width;
//     canvas.height = img.height;
//     const ctx = canvas.getContext('2d');

//     if (ctx) {
//       // Draw the image on the canvas
//       ctx.drawImage(img, 0, 0, img.width, img.height);

//       // Get image data for analysis
//       const imageData = ctx.getImageData(0, 0, img.width, img.height);
//       const data = imageData.data;

//       // Advanced image analysis to extract 3D information
//       const gridSize = 20; // Grid size for analyzing the image
//       const heightMap: number[][] = [];
//       const colorMap: string[][] = [];

//       // Divide the image into a grid and analyze each cell
//       const cellWidth = Math.floor(img.width / gridSize);
//       const cellHeight = Math.floor(img.height / gridSize);

//       for (let y = 0; y < gridSize; y++) {
//         heightMap[y] = [];
//         colorMap[y] = [];

//         for (let x = 0; x < gridSize; x++) {
//           // Sample pixels in this grid cell
//           let totalBrightness = 0;
//           let pixelCount = 0;
//           let r = 0, g = 0, b = 0;

//           // Calculate the boundaries of this cell
//           const startX = x * cellWidth;
//           const startY = y * cellHeight;

//           // Sample pixels in this cell
//           for (let cy = startY; cy < startY + cellHeight && cy < img.height; cy++) {
//             for (let cx = startX; cx < startX + cellWidth && cx < img.width; cx++) {
//               // Get pixel index
//               const i = (cy * img.width + cx) * 4;

//               // Check if the index is valid
//               if (i < data.length - 3) {
//                 // Sum up RGB values
//                 r += data[i];
//                 g += data[i + 1];
//                 b += data[i + 2];

//                 // Calculate brightness of this pixel
//                 const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
//                 totalBrightness += brightness;
//                 pixelCount++;
//               }
//             }
//           }

//           // Calculate average brightness for this cell
//           const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;

//           // Use brightness to determine height
//           // Darker areas typically represent objects/walls (higher elevation)
//           // Lighter areas typically represent floor/empty space (lower elevation)
//           const normalizedHeight = 1 - (avgBrightness / 255); // Invert: darker = higher
//           heightMap[y][x] = normalizedHeight * 50; // Scale for visual effect

//           // Determine color from average RGB
//           if (pixelCount > 0) {
//             r = Math.floor(r / pixelCount);
//             g = Math.floor(g / pixelCount);
//             b = Math.floor(b / pixelCount);
//             colorMap[y][x] = `rgb(${r},${g},${b})`;
//           } else {
//             colorMap[y][x] = 'rgb(200,200,200)';
//           }
//         }
//       }

//       // Store heightMap and colorMap in state for use in 3D rendering
//       // In a real implementation, these would be used to create a detailed 3D model
//       console.log('Height map and color map generated for 3D rendering');

//       // Store the analyzed data for the 3D view
//       localStorage.setItem('warehouseHeightMap', JSON.stringify(heightMap));
//       localStorage.setItem('warehouseColorMap', JSON.stringify(colorMap));
//     }

//     // Complete the 3D view generation
//     setTimeout(() => {
//       setProcessingStatus(prev => ({
//         ...prev,
//         view3DGenerated: true
//       }));
//     }, 1500);
//   };

//   // Generate heatmap visualization
//   const generateHeatmap = () => {
//     // In a real implementation, this would analyze activity patterns
//     // For this demo, we're simulating heatmap generation
//     console.log('Generating heatmap visualization');

//     setTimeout(() => {
//       setProcessingStatus(prev => ({
//         ...prev,
//         heatmapGenerated: true
//       }));
//     }, 1000);
//   };

//   // Analyze image to detect zones
//   const analyzeImage = (img: HTMLImageElement) => {
//     // Create a canvas to analyze the image
//     const canvas = document.createElement('canvas');
//     canvas.width = img.width;
//     canvas.height = img.height;
//     const ctx = canvas.getContext('2d');

//     if (!ctx) {
//       throw new Error("Failed to get canvas context");
//     }

//     // Draw the image on the canvas
//     ctx.drawImage(img, 0, 0, img.width, img.height);

//     // For this demo, we'll use a simplified approach based on color analysis
//     const newZones: Zone[] = [];

//     // Zone distribution patterns
//     const zonePatterns = [
//       { x: 0.1, y: 0.1, w: 0.3, h: 0.2, type: 'receiving' },
//       { x: 0.4, y: 0.1, w: 0.4, h: 0.4, type: 'storage' },
//       { x: 0.1, y: 0.35, w: 0.3, h: 0.3, type: 'processing' },
//       { x: 0.4, y: 0.55, w: 0.3, h: 0.2, type: 'processing' },
//       { x: 0.1, y: 0.7, w: 0.3, h: 0.2, type: 'shipping' },
//       { x: 0.75, y: 0.55, w: 0.2, h: 0.2, type: 'quality' },
//       { x: 0.75, y: 0.1, w: 0.2, h: 0.2, type: 'returns' }
//     ];

//     // Generate zones based on image sections and dominant colors
//     zonePatterns.forEach((pattern, i) => {
//       const sectionX = Math.floor(pattern.x * imageDimensions.width);
//       const sectionY = Math.floor(pattern.y * imageDimensions.height);
//       const sectionWidth = Math.floor(pattern.w * imageDimensions.width);
//       const sectionHeight = Math.floor(pattern.h * imageDimensions.height);

//       // Get the color data for this section
//       const sectionData = ctx.getImageData(
//         Math.floor(pattern.x * img.width),
//         Math.floor(pattern.y * img.height),
//         Math.floor(pattern.w * img.width),
//         Math.floor(pattern.h * img.height)
//       );

//       // Calculate average color for this section
//       let r = 0, g = 0, b = 0;
//       const data = sectionData.data;

//       for (let j = 0; j < data.length; j += 4) {
//         r += data[j];
//         g += data[j + 1];
//         b += data[j + 2];
//       }

//       const pixelCount = data.length / 4;
//       r = Math.floor(r / pixelCount);
//       g = Math.floor(g / pixelCount);
//       b = Math.floor(b / pixelCount);

//       // Add some variation to make zones distinguishable
//       r = Math.min(255, r + (i * 10) % 50);
//       g = Math.min(255, g + (i * 15) % 50);
//       b = Math.min(255, b + (i * 20) % 50);

//       // Create a zone based on this section
//       const zone: Zone = {
//         id: i + 1,
//         name: defaultZones[i].name,
//         color: `rgba(${r}, ${g}, ${b}, 0.7)`,
//         x: sectionX,
//         y: sectionY,
//         width: sectionWidth,
//         height: sectionHeight,
//         items: defaultZones[i].items,
//         efficiency: defaultZones[i].efficiency,
//         congestion: defaultZones[i].congestion,
//         travelDistance: defaultZones[i].travelDistance,
//         type: pattern.type
//       };

//       newZones.push(zone);
//     });

//     // Update the detected zones state
//     setDetectedZones(newZones);
//   };

//   // Handle file upload
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     // Check if file is a PNG or JPEG
//     if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
//       toast({
//         title: "Invalid file format - Please upload a PNG or JPEG image",
//         variant: "destructive"
//       });
//       return;
//     }

//     setIsUploading(true);

//     // Read file
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const imageUrl = e.target?.result as string;
//       setUploadedImage(imageUrl);
//       toast({
//         title: "Floor plan uploaded"
//       });
//       setIsUploading(false);

//       // Process the image
//       processImage(imageUrl);
//     };

//     reader.onerror = () => {
//       toast({
//         title: "Upload failed",
//         variant: "destructive"
//       });
//       setIsUploading(false);
//     };

//     reader.readAsDataURL(file);
//   };

//   // Trigger file input click
//   const triggerFileUpload = () => {
//     fileInputRef.current?.click();
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header with Upload Button */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-2xl font-bold">Warehouse Visualization</h1>
//           <p className="text-gray-500">View and analyze warehouse layout and metrics</p>
//         </div>
//         <div>
//           <input
//             type="file"
//             ref={fileInputRef}
//             onChange={handleFileUpload}
//             accept="image/*"
//             className="hidden"
//           />
//           <Button
//             onClick={triggerFileUpload}
//             disabled={isUploading}
//             className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
//           >
//             <Upload size={16} />
//             Upload Floor Plan
//           </Button>
//         </div>
//       </div>

//       {/* Processing Status */}
//       {isProcessing && (
//         <Card className="bg-white shadow-sm border mt-8">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2 mb-2">
//               <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
//               <span className="font-medium">Processing warehouse floor plan...</span>
//             </div>
//             <Progress value={progress} className="h-2 mb-1" />
//             <p className="text-xs text-gray-500">Analyzing image and generating visualizations ({progress}%)</p>
//           </CardContent>
//         </Card>
//       )}

//       {/* Overview Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <Card className="bg-white shadow-sm border">
//           <CardContent className="p-4">
//             <div className="flex items-center">
//               <Badge className="bg-blue-500 mr-2 w-8 h-8 flex items-center justify-center rounded-full">7</Badge>
//               <div>
//                 <p className="text-sm text-gray-500">Total Zones</p>
//                 <p className="text-lg font-bold">7 Zones</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="bg-white shadow-sm border">
//           <CardContent className="p-4">
//             <div className="flex items-center">
//               <Badge className="bg-green-500 mr-2 w-8 h-8 flex items-center justify-center rounded-full"><Package size={14} /></Badge>
//               <div>
//                 <p className="text-sm text-gray-500">Total Items</p>
//                 <p className="text-lg font-bold">{totalItems} Items</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Warehouse Floor Plan */}
//       <div className="mt-8">
//         <h2 className="text-xl font-bold mb-4">Warehouse Floor Plan</h2>

//         <Tabs defaultValue="2d" value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <div className="flex justify-between items-center mb-4">
//             <TabsList>
//               <TabsTrigger value="2d" className="flex items-center gap-1">
//                 <Grid size={14} /> 2D Layout
//               </TabsTrigger>
//               <TabsTrigger value="3d" className="flex items-center gap-1" disabled={!processingStatus.view3DGenerated && uploadedImage !== null}>
//                 <Box size={14} /> 3D View {!processingStatus.view3DGenerated && uploadedImage !== null && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
//               </TabsTrigger>
//               <TabsTrigger value="heatmap" className="flex items-center gap-1" disabled={!processingStatus.heatmapGenerated && uploadedImage !== null}>
//                 <BarChart size={14} /> Heatmap {!processingStatus.heatmapGenerated && uploadedImage !== null && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
//               </TabsTrigger>
//             </TabsList>

//             <div className="flex gap-1">
//               <Button variant="ghost" size="icon">
//                 <ZoomIn size={16} className="text-gray-500" />
//               </Button>
//               <Button variant="ghost" size="icon">
//                 <ZoomOut size={16} className="text-gray-500" />
//               </Button>
//               <Button variant="ghost" size="icon">
//                 <RefreshCw size={16} className="text-gray-500" />
//               </Button>
//             </div>
//           </div>

//           <Card className="bg-white shadow-sm border">
//             <CardContent className="p-4">
//               {/* 2D Layout Tab */}
//               <TabsContent value="2d" className="mt-0">
//                 <div className="mb-4">
//                   <p className="text-sm font-medium mb-2">Uploaded Floor Plan</p>
//                   <div className="bg-gray-100 rounded-md p-4 flex justify-center">
//                     {uploadedImage ? (
//                       <img
//                         src={uploadedImage}
//                         alt="Uploaded floor plan"
//                         className="max-h-[200px] object-contain"
//                       />
//                     ) : (
//                       <div className="h-[200px] w-[300px] bg-blue-50 flex items-center justify-center border border-blue-100 rounded">
//                         <div className="text-center">
//                           <div className="text-blue-500 font-bold mb-2">Warehouse Floor Plan</div>
//                           <div className="text-xs text-gray-500">Upload a floor plan to generate visualization</div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="bg-gray-100 rounded-md p-4 grid place-items-center">
//                   <svg width="550" height="500" viewBox="0 0 550 500" style={{ background: '#f5f5f5' }}>
//                     {/* Grid pattern */}
//                     <defs>
//                       <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
//                         <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
//                       </pattern>
//                     </defs>
//                     <rect width="100%" height="100%" fill="url(#grid)" />

//                     {/* Render uploaded image as background if available */}
//                     {uploadedImage && (
//                       <image
//                         href={uploadedImage}
//                         x={(550 - imageDimensions.width) / 2}
//                         y={(500 - imageDimensions.height) / 2}
//                         width={imageDimensions.width}
//                         height={imageDimensions.height}
//                         opacity="0.3"
//                       />
//                     )}

//                     {/* Render zones - use detected zones if available, otherwise use default zones */}
//                     {(detectedZones.length > 0 ? detectedZones : defaultZones).map((zone) => (
//                       <g key={zone.id}>
//                         <rect
//                           x={zone.x}
//                           y={zone.y}
//                           width={zone.width}
//                           height={zone.height}
//                           fill={zone.color}
//                           stroke="#333"
//                           strokeWidth="1"
//                           rx="2"
//                           ry="2"
//                           opacity="0.8"
//                         />
//                         <text
//                           x={zone.x + zone.width / 2}
//                           y={zone.y + zone.height / 2}
//                           textAnchor="middle"
//                           dominantBaseline="middle"
//                           fill="#333"
//                           fontSize="12"
//                           fontWeight="bold"
//                         >
//                           {zone.name}
//                         </text>
//                         <text
//                           x={zone.x + zone.width / 2}
//                           y={zone.y + zone.height / 2 + 16}
//                           textAnchor="middle"
//                           dominantBaseline="middle"
//                           fill="#333"
//                           fontSize="10"
//                         >
//                           {zone.items} items
//                         </text>
//                       </g>
//                     ))}
//                   </svg>
//                 </div>
//               </TabsContent>

//               {/* 3D View Tab */}
//               <TabsContent value="3d" className="mt-0">
//                 <div className="mb-4">
//                   <p className="text-sm font-medium mb-2">3D Warehouse Visualization</p>
//                   {processingStatus.view3DGenerated ? (
//                     <div className="bg-gray-100 rounded-md p-4 h-[500px] relative overflow-hidden">
//                       {/* Controls */}
//                       <div className="absolute top-4 right-4 z-10 flex space-x-2">
//                         <Button variant="outline" size="sm" className="bg-white" onClick={() => {
//                           setView3DState(prev => ({
//                             ...prev,
//                             rotateX: 60,
//                             rotateZ: -25
//                           }));
//                         }}>
//                           <RefreshCw size={14} className="mr-1" /> Rotate
//                         </Button>
//                         <Button variant="outline" size="sm" className="bg-white" onClick={() => {
//                           setView3DState({
//                             rotateX: 45,
//                             rotateZ: -15,
//                             scale: 1,
//                             isDragging: false,
//                             lastMouseX: 0,
//                             lastMouseY: 0
//                           });
//                         }}>
//                           <RefreshCw size={14} className="mr-1" /> Reset
//                         </Button>
//                         <Button variant="outline" size="sm" className="bg-white" onClick={() => {
//                           setView3DState(prev => ({
//                             ...prev,
//                             scale: prev.scale + 0.1
//                           }));
//                         }}>
//                           <ZoomIn size={14} className="mr-1" /> Zoom In
//                         </Button>
//                         <Button variant="outline" size="sm" className="bg-white" onClick={() => {
//                           setView3DState(prev => ({
//                             ...prev,
//                             scale: Math.max(0.5, prev.scale - 0.1)
//                           }));
//                         }}>
//                           <ZoomOut size={14} className="mr-1" /> Zoom Out
//                         </Button>
//                       </div>

//                       {/* Enhanced 3D Scene with mouse interaction */}
//                       <div
//                         className="w-full h-full flex items-center justify-center"
//                         style={{
//                           perspective: '1200px',
//                           transformStyle: 'preserve-3d'
//                         }}
//                         onMouseDown={(e) => {
//                           setView3DState(prev => ({
//                             ...prev,
//                             isDragging: true,
//                             lastMouseX: e.clientX,
//                             lastMouseY: e.clientY
//                           }));
//                         }}
//                         onMouseMove={(e) => {
//                           if (view3DState.isDragging) {
//                             // Calculate how much the mouse has moved
//                             const deltaX = e.clientX - view3DState.lastMouseX;
//                             const deltaY = e.clientY - view3DState.lastMouseY;

//                             // Update rotation based on mouse movement
//                             setView3DState(prev => ({
//                               ...prev,
//                               rotateX: prev.rotateX - deltaY * 0.5,
//                               rotateZ: prev.rotateZ - deltaX * 0.5,
//                               lastMouseX: e.clientX,
//                               lastMouseY: e.clientY
//                             }));
//                           }
//                         }}
//                         onMouseUp={() => {
//                           setView3DState(prev => ({ ...prev, isDragging: false }));
//                         }}
//                         onMouseLeave={() => {
//                           setView3DState(prev => ({ ...prev, isDragging: false }));
//                         }}
//                         onWheel={(e) => {
//                           // Zoom with mouse wheel
//                           e.preventDefault();
//                           const delta = e.deltaY > 0 ? -0.05 : 0.05;
//                           setView3DState(prev => ({
//                             ...prev,
//                             scale: Math.max(0.5, Math.min(2, prev.scale + delta))
//                           }));
//                         }}
//                       >
//                         <div
//                           className="relative w-[85%] h-[85%] transition-transform duration-300 scene-container cursor-move"
//                           style={{
//                             transform: `rotateX(${view3DState.rotateX}deg) rotateZ(${view3DState.rotateZ}deg) scale(${view3DState.scale})`,
//                             transformStyle: 'preserve-3d',
//                             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
//                           }}
//                         >
//                           {/* Floor with uploaded image */}
//                           <div
//                             className="absolute inset-0 border border-blue-200"
//                             style={{ transform: 'translateZ(0px)' }}
//                           >
//                             {/* Enhanced 3D floor with uploaded image and textures */}
//                             {uploadedImage ? (
//                               <>
//                                 {/* Base floor with the uploaded image */}
//                                 <div
//                                   className="w-full h-full relative overflow-hidden"
//                                   style={{
//                                     backgroundImage: `url(${uploadedImage})`,
//                                     backgroundSize: 'cover',
//                                     backgroundPosition: 'center',
//                                     filter: 'contrast(1.15) brightness(1.05)'
//                                   }}
//                                 >
//                                   {/* Floor reflection effect */}
//                                   <div className="absolute inset-0" style={{
//                                     background: 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 100%)',
//                                     pointerEvents: 'none'
//                                   }}></div>
//                                 </div>

//                                 {/* 3D elevation effect based on image analysis */}
//                                 <div className="absolute inset-0 opacity-20" style={{
//                                   boxShadow: 'inset 0 0 50px 10px rgba(0,0,0,0.5)',
//                                   pointerEvents: 'none'
//                                 }}></div>

//                                 {/* Enhanced 3D grid */}
//                                 <div className="absolute inset-0" style={{
//                                   backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
//                                   backgroundSize: '20px 20px',
//                                   pointerEvents: 'none',
//                                   boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2)'
//                                 }}></div>

//                                 {/* Edge highlights for 3D effect */}
//                                 <div className="absolute inset-0 border border-white opacity-40" style={{
//                                   boxShadow: '0 0 15px 5px rgba(255,255,255,0.1)'
//                                 }}></div>

//                                 {/* Depth markers */}
//                                 {Array.from({ length: 5 }).map((_, i) => (
//                                   <div
//                                     key={`depth-${i}`}
//                                     className="absolute inset-0 border border-blue-100 opacity-10"
//                                     style={{
//                                       transform: `translateZ(${-5 * (i+1)}px)`,
//                                       pointerEvents: 'none'
//                                     }}
//                                   ></div>
//                                 ))}
//                               </>
//                             ) : (
//                               /* Enhanced grid lines fallback if no image */
//                               <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100" style={{
//                                 backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
//                                 backgroundSize: '20px 20px',
//                                 boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1)'
//                               }}></div>
//                             )}
//                           </div>

//                           {/* Advanced 3D warehouse zones with realistic effects */}
//                           {(detectedZones.length > 0 ? detectedZones : defaultZones).map((zone, index) => (
//                             <div
//                               key={zone.id}
//                               className="absolute flex flex-col items-center justify-center text-center transition-all duration-300"
//                               style={{
//                                 left: `${(zone.x / 550) * 100}%`,
//                                 top: `${(zone.y / 500) * 100}%`,
//                                 width: `${(zone.width / 550) * 100}%`,
//                                 height: `${(zone.height / 500) * 100}%`,
//                                 backgroundColor: `${zone.color}`,
//                                 border: '1px solid rgba(0,0,0,0.2)',
//                                 transform: `translateZ(${25 + (zone.efficiency / 3)}px)`,
//                                 boxShadow: `0 ${10 + (zone.efficiency / 8)}px ${15 + (zone.efficiency / 4)}px rgba(0,0,0,0.2)`,
//                                 fontSize: '10px',
//                                 color: '#333',
//                                 fontWeight: 'bold',
//                                 overflow: 'hidden',
//                                 borderRadius: '3px',
//                                 cursor: 'pointer'
//                               }}
//                               onMouseEnter={() => setHoveredZone(zone)}
//                               onMouseLeave={() => setHoveredZone(null)}
//                             >
//                               {/* 3D Zone Construction */}
//                               <div className="absolute inset-0 flex flex-col">
//                                 {/* Zone roof with glossy effect */}
//                                 <div
//                                   className="absolute inset-0"
//                                   style={{
//                                     background: `linear-gradient(135deg, ${zone.color}dd 0%, ${zone.color}ff 50%, ${zone.color}aa 100%)`,
//                                     borderRadius: '2px 2px 0 0',
//                                     boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5)'
//                                   }}
//                                 ></div>

//                                 {/* Zone roof patterns based on zone type */}
//                                 {zone.type === 'storage' && (
//                                   <div className="absolute inset-0 opacity-20" style={{
//                                     backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, #000 4px, #000 5px)',
//                                     backgroundSize: '100% 20px'
//                                   }}></div>
//                                 )}

//                                 {zone.type === 'processing' && (
//                                   <div className="absolute inset-0 opacity-10" style={{
//                                     backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 5px, transparent 5px, transparent 10px)',
//                                   }}></div>
//                                 )}

//                                 {/* Zone activity indicator */}
//                                 <div
//                                   className="absolute top-2 right-2 h-2 w-2 rounded-full"
//                                   style={{
//                                     backgroundColor: zone.efficiency > 90 ? '#4ade80' :
//                                                    zone.efficiency > 80 ? '#facc15' : '#f87171',
//                                     boxShadow: '0 0 5px rgba(255,255,255,0.7)'
//                                   }}
//                                 ></div>
//                               </div>

//                               {/* Zone content with 3D positioning */}
//                               <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-2">
//                                 <div
//                                   className="font-bold text-[10px] transform rotate-[-25deg] text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
//                                   style={{
//                                     textShadow: '0 0 2px rgba(255,255,255,0.7)'
//                                   }}
//                                 >
//                                   {zone.name}
//                                 </div>
//                                 <div className="transform rotate-[-25deg] text-[8px] text-gray-700">
//                                   {zone.items} items
//                                 </div>
//                               </div>

//                               {/* 3D walls with shadows */}
//                               <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-black to-transparent opacity-30"
//                                    style={{transform: `translateZ(${-(25 + (zone.efficiency / 3))}px) translateX(-0.5px) rotateY(90deg) scaleX(${25 + (zone.efficiency / 3)})`}}></div>
//                               <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-black to-transparent opacity-30"
//                                    style={{transform: `translateZ(${-(25 + (zone.efficiency / 3))}px) translateX(0.5px) rotateY(-90deg) scaleX(${25 + (zone.efficiency / 3)})`}}></div>
//                               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-black to-transparent opacity-30"
//                                    style={{transform: `translateZ(${-(25 + (zone.efficiency / 3))}px) translateY(0.5px) rotateX(90deg) scaleY(${25 + (zone.efficiency / 3)})`}}></div>

//                               {/* Hover effect - elevate on hover */}
//                               {hoveredZone?.id === zone.id && (
//                                 <div
//                                   className="absolute -inset-2 border-2 border-blue-400 rounded-md opacity-70 z-0"
//                                   style={{
//                                     transform: 'translateZ(5px)',
//                                     boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)',
//                                     pointerEvents: 'none'
//                                   }}
//                                 ></div>
//                               )}
//                             </div>
//                           ))}

//                           {/* Connection paths between zones */}
//                           <svg
//                             className="absolute inset-0 w-full h-full"
//                             style={{ transform: 'translateZ(2px)' }}
//                           >
//                             {(detectedZones.length > 0 ? detectedZones : defaultZones).map((zone, i, arr) => {
//                               if (i === arr.length - 1) return null;
//                               const nextZone = arr[i + 1];
//                               const startX = zone.x + zone.width / 2;

//               {/* Heatmap Tab */}
//               <TabsContent value="heatmap" className="mt-0">
//                 <div className="mb-4">
//                   <p className="text-sm font-medium mb-2">Activity Heatmap</p>
//                   {processingStatus.heatmapGenerated ? (
//                     <div className="bg-gray-100 rounded-md p-4 grid place-items-center">
//                       <svg width="550" height="500" viewBox="0 0 550 500" style={{ background: '#f5f5f5' }}>
//                         {/* Grid pattern */}
//                         <defs>
//                           <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
//                             <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
//                           </pattern>

//                           {/* Heatmap gradients */}
//                           <radialGradient id="heatGradient1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
//                             <stop offset="0%" stopColor="rgba(255, 0, 0, 0.9)" />
//                             <stop offset="70%" stopColor="rgba(255, 100, 0, 0.6)" />
//                             <stop offset="100%" stopColor="rgba(255, 255, 0, 0)" />
//                           </radialGradient>
//                           <radialGradient id="heatGradient2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
//                             <stop offset="0%" stopColor="rgba(255, 30, 0, 0.9)" />
//                             <stop offset="80%" stopColor="rgba(255, 120, 0, 0.5)" />
//                             <stop offset="100%" stopColor="rgba(255, 255, 0, 0)" />
//                           </radialGradient>
//                           <radialGradient id="heatGradient3" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
//                             <stop offset="0%" stopColor="rgba(255, 60, 0, 0.8)" />
//                             <stop offset="90%" stopColor="rgba(255, 150, 0, 0.4)" />
//                             <stop offset="100%" stopColor="rgba(255, 255, 0, 0)" />
//                           </radialGradient>
//                         </defs>

//                         {/* Background */}
//                         <rect width="100%" height="100%" fill="url(#grid)" />

//                         {/* Warehouse outline - simplified for heatmap view */}
//                         {(detectedZones.length > 0 ? detectedZones : defaultZones).map((zone) => (
//                           <rect
//                             key={zone.id}
//                             x={zone.x}
//                             y={zone.y}
//                             width={zone.width}
//                             height={zone.height}
//                             fill="#f0f0f0"
//                             stroke="#aaa"
//                             strokeWidth="1"
//                             rx="2"
//                             ry="2"
//                             opacity="0.4"
//                           />
//                         ))}

//                         {/* Heat spots */}
//                         <circle cx="120" cy="90" r="50" fill="url(#heatGradient1)" />
//                         <circle cx="300" cy="150" r="70" fill="url(#heatGradient2)" />
//                         <circle cx="180" cy="230" r="60" fill="url(#heatGradient3)" />
//                         <circle cx="400" cy="300" r="40" fill="url(#heatGradient1)" />
//                         <circle cx="100" cy="380" r="45" fill="url(#heatGradient2)" />
//                       </svg>
//                     </div>
//                   ) : (
//                     <div className="bg-gray-100 rounded-md p-4 h-[500px] flex flex-col items-center justify-center">
//                       <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
//                       <p className="text-sm text-gray-500">Generating activity heatmap...</p>
//                     </div>
//                   )}
//                 </div>
//               </TabsContent>
//             </CardContent>
//           </Card>
//         </Tabs>
//       </div>

//       {/* Zone Details */}
//       <div className="mt-8">
//         <h2 className="text-xl font-bold mb-4">Zone Details</h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {(detectedZones.length > 0 ? detectedZones : defaultZones).map((zone) => (
//             <Card key={zone.id} className="bg-white shadow-sm border">
//               <CardHeader className="pb-2 pt-4 px-4" style={{ borderBottom: `1px solid ${zone.color}` }}>
//                 <CardTitle className="text-md font-medium">{zone.name}</CardTitle>
//               </CardHeader>
//               <CardContent className="p-4">
//                 <div className="grid grid-cols-2 gap-y-2">
//                   <div className="text-sm text-gray-500">Items:</div>
//                   <div className="text-sm font-semibold text-right">{zone.items}</div>

//                   <div className="text-sm text-gray-500">Efficiency:</div>
//                   <div className="text-sm font-semibold text-right">{zone.efficiency}%</div>

//                   <div className="text-sm text-gray-500">Congestion:</div>
//                   <div className="text-sm font-semibold text-right">{zone.congestion}%</div>

//                   <div className="text-sm text-gray-500">Travel Distance:</div>
//                   <div className="text-sm font-semibold text-right">{zone.travelDistance}m</div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
