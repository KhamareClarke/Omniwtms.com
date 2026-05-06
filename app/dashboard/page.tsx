// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Package,
  Truck,
  Warehouse,
  TrendingUp,
  ArrowLeftRight,
  PackageX,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  CloudSun,
  Moon,
  CloudMoon,
  Cloud,
  Building2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAllRoleStorage } from "@/lib/auth/role-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface WarehouseActivity {
  date: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  type: string;
}

interface DashboardStats {
  products: {
    total: number;
    daily: Array<{ date: string; count: number }>;
    trend: number;
    addedToday: number;
    addedYesterday: number;
    addedThisWeek: number;
    value: number;
    lowStock: number;
  };
  deliveries: {
    total: number;
    byStatus: Record<string, number>;
    daily: Array<{ date: string; count: number; isPrediction?: boolean }>;
  };
  couriers: {
    total: number;
    active: number;
    daily: Array<{ date: string; count: number }>;
    byStatus: Record<string, number>;
    totalDeliveries: number;
    averageCapacity: number;
  };
  warehouse: {
    total: number;
    byStatus: Record<string, number>;
    utilization: Array<{ name: string; utilization: number }>;
    totalWarehouses: number;
    totalStocks: number;
    stocksByWarehouse: Array<{ name: string; quantity: number }>;
    movementStats: {
      totalAssignments: number;
      totalTransfers: number;
      totalRemovals: number;
    };
    operations?: Array<{
      vehicleRegistration?: string;
      customerName?: string;
      driverName?: string;
      vehicleSize?: string;
      loadType?: string;
      arrivalTime?: string;
      warehouseName?: string;
      description?: string;
      quantity?: number;
      condition?: string;
      qualityStatus?: string;
      damageImage?: string;
      supervisor?: string;
      aisle?: string;
      bay?: string;
      level?: string;
      position?: string;
      warehouseLocation?: string;
    }>;
    operationsByType?: {
      assignments: number;
      transfers: number;
      removals: number;
    };
    totalOperations: number;
    activityData?: Array<{ date: string; count: number }>;
    dailyOperations?: number;
    weeklyOperations?: number;
    monthlyOperations?: number;
    trendPercentage?: number;
    utilizationPercentage?: number;
  };
}

// Add interface for inventory movement
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

// Add these helper functions before the DashboardPage component
const calculateTotalStocks = (warehouses: any[]) => {
  return warehouses.reduce((total, warehouse) => {
    const warehouseStocks = warehouse.stocks || [];
    const stocksTotal = warehouseStocks.reduce((sum: number, stock: any) => {
      return sum + (stock.quantity || 0);
    }, 0);
    return total + stocksTotal;
  }, 0);
};

const processStocksByWarehouse = (warehouses: any[]) => {
  return warehouses.map((warehouse) => ({
    name: warehouse.name,
    quantity: (warehouse.stocks || []).reduce(
      (sum: number, stock: any) => sum + (stock.quantity || 0),
      0
    ),
  }));
};

// Fix warehouse utilization calculation
const processWarehouseUtilization = (warehouses: any[]) => {
  return warehouses.map((warehouse) => {
    const totalStock = (warehouse.stocks || []).reduce(
      (sum: number, stock: any) => sum + (stock.quantity || 0),
      0
    );
    const capacity = warehouse.capacity || 100;
    const utilization = (totalStock / capacity) * 100;
    return {
      name: warehouse.name,
      utilization: Math.min(utilization, 100), // Cap at 100%
    };
  });
};

// Add this function after the imports
const inspectDatabase = async (supabase: any) => {
  console.log("🔍 Starting Database Inspection");

  try {
    // Check Couriers Table First
    const { data: couriersInfo, error: couriersError } = await supabase
      .from("courier") // Try 'courier' table
      .select("*")
      .limit(1);

    if (couriersError || !couriersInfo) {
      // If 'courier' fails, try 'couriers'
      const { data: couriersInfo2, error: couriersError2 } = await supabase
        .from("couriers")
        .select("*")
        .limit(1);

      console.log(
        "🚚 Couriers Table Structure:",
        couriersInfo2 ? Object.keys(couriersInfo2[0] || {}) : "No data",
        "Error:",
        couriersError2,
        "Raw Data:",
        couriersInfo2
      );
    } else {
      console.log(
        "🚚 Couriers Table Structure:",
        Object.keys(couriersInfo[0] || {}),
        "Raw Data:",
        couriersInfo
      );
    }

    // Check Warehouses Table
    const { data: warehousesInfo, error: warehousesError } = await supabase
      .from("warehouses")
      .select("*")
      .limit(1);
    console.log(
      "📦 Warehouses Table Structure:",
      warehousesInfo ? Object.keys(warehousesInfo[0] || {}) : "No data",
      "Error:",
      warehousesError
    );

    // Check Warehouse Inventory Table
    const { data: inventoryInfo, error: inventoryError } = await supabase
      .from("warehouse_inventory")
      .select("*")
      .limit(1);
    console.log(
      "📋 Warehouse Inventory Table Structure:",
      inventoryInfo ? Object.keys(inventoryInfo[0] || {}) : "No data",
      "Error:",
      inventoryError
    );

    // Check Stock/Inventory Movements Table
    const { data: movementsInfo, error: movementsError } = await supabase
      .from("inventory_movements")
      .select("*")
      .limit(1);
    console.log(
      "🔄 Movements Table Structure:",
      movementsInfo ? Object.keys(movementsInfo[0] || {}) : "No data",
      "Error:",
      movementsError
    );

    // Check Products Table
    const { data: productsInfo, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(1);
    console.log(
      "📦 Products Table Structure:",
      productsInfo ? Object.keys(productsInfo[0] || {}) : "No data",
      "Error:",
      productsError
    );

    // Check Clients Table
    const { data: clientsInfo, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .limit(1);
    console.log(
      "👥 Clients Table Structure:",
      clientsInfo ? Object.keys(clientsInfo[0] || {}) : "No data",
      "Error:",
      clientsError
    );

    // Try alternative table names
    const alternativeTables = [
      "warehouse_stocks",
      "stock_movements",
      "stock_inventory",
      "warehouses_inventory",
      "movements",
    ];

    for (const table of alternativeTables) {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (data) {
        console.log(
          `✅ Found alternative table ${table}:`,
          Object.keys(data[0] || {})
        );
      }
    }
  } catch (error) {
    console.error("❌ Database inspection error:", error);
  }
};

// Update AnimatedBackground for a more sophisticated AI look
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-gray-50 to-white">
      {/* Neural network pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute h-full w-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Primary gradient blobs with advanced animations */}
      <div
        className="absolute top-0 left-0 -z-10 h-[800px] w-[800px] rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/10 blur-[120px] animate-pulse-slow"
        style={{ animationDuration: "25s" }}
      />
      <div
        className="absolute bottom-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-violet-500/15 to-purple-500/10 blur-[100px] animate-pulse-slow"
        style={{ animationDuration: "30s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[900px] w-[900px] rounded-full bg-gradient-to-b from-cyan-500/10 to-blue-400/5 blur-[130px] animate-pulse-slow"
        style={{ animationDuration: "35s", animationDelay: "4s" }}
      />

      {/* Digital circuit pattern overlay */}
      <div className="absolute inset-0 bg-circuit-pattern opacity-[0.03] mix-blend-overlay"></div>

      {/* Floating data particles */}
      <div className="absolute inset-0 -z-5 opacity-30">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-blue-600 animate-float-slow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* AI scanning beam effect */}
      <div className="absolute inset-x-0 top-0 h-[500px] overflow-hidden opacity-20">
        <div
          className="h-[50px] w-full bg-gradient-to-b from-blue-500/50 via-blue-500/0 to-transparent translate-y-full animate-scan"
          style={{
            animationDuration: "10s",
            animationIterationCount: "infinite",
          }}
        ></div>
      </div>

      {/* Advanced glass effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-white/90 to-transparent backdrop-blur-[1px]"></div>
    </div>
  </div>
);

// Update the WeatherData interface to include daily forecast data
interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
    is_day: number;
  };
  current_units: {
    temperature_2m: string;
    precipitation: string;
    wind_speed_10m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
}

// Add a new location object at the top of locations array for current location
const weatherLocations = [
  { name: "Current Location", lat: null, long: null },
  { name: "Berlin", lat: 52.52, long: 13.41 },
  { name: "London", lat: 51.51, long: -0.13 },
  { name: "New York", lat: 40.71, long: -74.01 },
  { name: "Tokyo", lat: 35.68, long: 139.69 },
  { name: "Sydney", lat: -33.87, long: 151.21 },
];

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(weatherLocations[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "forecast">("current");
  const [userCoordinates, setUserCoordinates] = useState<{
    lat: number | null;
    long: number | null;
  }>({ lat: null, long: null });
  const [locationStatus, setLocationStatus] = useState<
    "detecting" | "granted" | "denied" | "unavailable"
  >("detecting");

  // Get user's geolocation on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus("detecting");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLong = position.coords.longitude;
          setUserCoordinates({ lat: userLat, long: userLong });

          // Update the Current Location in weatherLocations array
          const updatedLocation = {
            ...selectedLocation,
            lat: userLat,
            long: userLong,
          };
          setSelectedLocation(updatedLocation);
          setLocationStatus("granted");
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationStatus("denied");
          // If geolocation fails, default to first predefined location
          setSelectedLocation(weatherLocations[1]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
      setLocationStatus("unavailable");
      // If geolocation not supported, default to first predefined location
      setSelectedLocation(weatherLocations[1]);
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Don't fetch if coordinates are not available yet (for Current Location)
        if (
          selectedLocation.name === "Current Location" &&
          (userCoordinates.lat === null || userCoordinates.long === null)
        ) {
          // Still waiting for coordinates, don't fetch yet
          return;
        }

        setLoading(true);
        setError(null);

        // Use either selected location coordinates or user coordinates for Current Location
        const latitude =
          selectedLocation.name === "Current Location"
            ? userCoordinates.lat
            : selectedLocation.lat;

        const longitude =
          selectedLocation.name === "Current Location"
            ? userCoordinates.long
            : selectedLocation.long;

        console.log(
          "Fetching weather for:",
          selectedLocation.name,
          "at coordinates:",
          latitude,
          longitude
        );

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,precipitation_probability&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch weather data: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Weather data received:", data);
        setWeather(data);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(
          "Failed to load weather data: " +
            (err instanceof Error ? err.message : String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    // Fetch weather when coordinates are ready or location changes
    if (
      selectedLocation.name !== "Current Location" ||
      (userCoordinates.lat !== null && userCoordinates.long !== null)
    ) {
      fetchWeather();
    }
  }, [selectedLocation, userCoordinates]);

  const handleLocationChange = (location: (typeof weatherLocations)[0]) => {
    setSelectedLocation(location);
    setIsDropdownOpen(false);
  };

  // Add back the getWeatherIcon function that was removed
  const getWeatherIcon = (code: number, isDay: number) => {
    // WMO Weather interpretation codes (WW)
    // https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
    if (code === 0) {
      // Clear sky
      return isDay ? (
        <Sun className="h-8 w-8 text-yellow-500" />
      ) : (
        <Moon className="h-8 w-8 text-blue-300" />
      );
    } else if (code <= 3) {
      // Partly cloudy
      return isDay ? (
        <CloudSun className="h-8 w-8 text-yellow-500" />
      ) : (
        <CloudMoon className="h-8 w-8 text-blue-300" />
      );
    } else if (code <= 49) {
      // Foggy/cloudy
      return <Cloud className="h-8 w-8 text-gray-400" />;
    } else if (code <= 69) {
      // Drizzle/rain
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    } else if (code <= 79) {
      // Snow
      return <CloudRain className="h-8 w-8 text-blue-200" />;
    } else {
      // Thunderstorm/heavy weather
      return <CloudRain className="h-8 w-8 text-purple-500" />;
    }
  };

  // Get the next 3 days forecast from hourly data
  const getNextDaysForecast = () => {
    if (
      !weather?.hourly ||
      !weather.hourly.time ||
      !weather.hourly.temperature_2m ||
      !weather.hourly.weather_code
    ) {
      return [];
    }

    const forecast = [];
    const now = new Date();
    const currentDay = now.getDate();

    // Get data for next 3 days
    for (let day = 1; day <= 3; day++) {
      const forecastDate = new Date();
      forecastDate.setDate(currentDay + day);
      const dateString = forecastDate.toISOString().split("T")[0];

      // Find noon time index for this date (around 12:00)
      const noonTimeIndex = weather.hourly.time.findIndex(
        (time) => time.startsWith(dateString) && time.includes("T12:00")
      );

      if (
        noonTimeIndex !== -1 &&
        noonTimeIndex < weather.hourly.temperature_2m.length
      ) {
        forecast.push({
          date: forecastDate,
          temp: weather.hourly.temperature_2m[noonTimeIndex] || 0,
          weatherCode: weather.hourly.weather_code[noonTimeIndex] || 0,
          // Use optional chaining and nullish coalescing to handle potential undefined values
          precipProb:
            weather.hourly.precipitation_probability?.[noonTimeIndex] ?? 0,
        });
      }
    }

    return forecast;
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  };

  // Simplified weather card when API fails
  const renderFallbackWeatherCard = () => {
    const locationDisplay =
      selectedLocation.name === "Current Location" &&
      locationStatus === "granted"
        ? "Current Location"
        : selectedLocation.name;

    return (
      <div className="p-4 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CloudSun className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold">--°C</h3>
              <p className="text-sm text-gray-500">Weather unavailable</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {locationDisplay}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-1 z-20 min-w-[150px]">
                {weatherLocations.map((location) => (
                  <button
                    key={location.name}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      selectedLocation.name === location.name
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleLocationChange(location)}
                    disabled={
                      location.name === "Current Location" &&
                      locationStatus === "denied"
                    }
                  >
                    {location.name}
                    {location.name === "Current Location" &&
                      locationStatus === "denied" &&
                      " (unavailable)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            onClick={() => {
              setLoading(true);
              if (selectedLocation.name === "Current Location") {
                // Re-request geolocation
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserCoordinates({
                      lat: position.coords.latitude,
                      long: position.coords.longitude,
                    });
                    setLocationStatus("granted");
                  },
                  (error) => {
                    console.error("Geolocation error:", error);
                    setLocationStatus("denied");
                    setLoading(false);
                  }
                );
              }
            }}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  };

  // Show location detecting state
  if (
    selectedLocation.name === "Current Location" &&
    locationStatus === "detecting"
  ) {
    return (
      <div className="flex items-center justify-center p-4 h-full min-h-[160px]">
        <div className="text-center">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Detecting location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Weather widget error:", error);
    return renderFallbackWeatherCard();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 h-full min-h-[160px]">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!weather || !weather.current) {
    console.error("Weather data missing or invalid:", weather);
    return renderFallbackWeatherCard();
  }

  // Display location name - for current location, show "Current Location"
  const locationDisplay =
    selectedLocation.name === "Current Location"
      ? "Current Location"
      : selectedLocation.name;

  const forecast = getNextDaysForecast();

  return (
    <div className="p-4 flex flex-col h-full justify-between">
      {/* Header with location and tabs */}
      <div className="flex items-center justify-between mb-2">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {locationDisplay}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-1 z-20 min-w-[150px]">
              {weatherLocations.map((location) => (
                <button
                  key={location.name}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    selectedLocation.name === location.name
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                  onClick={() => handleLocationChange(location)}
                  disabled={
                    location.name === "Current Location" &&
                    locationStatus === "denied"
                  }
                >
                  {location.name}
                  {location.name === "Current Location" &&
                    locationStatus === "denied" &&
                    " (unavailable)"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            className={`px-3 py-1 text-xs font-medium ${
              viewMode === "current"
                ? "bg-blue-50 text-blue-600"
                : "bg-white text-gray-600"
            }`}
            onClick={() => setViewMode("current")}
          >
            Current
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium ${
              viewMode === "forecast"
                ? "bg-blue-50 text-blue-600"
                : "bg-white text-gray-600"
            }`}
            onClick={() => setViewMode("forecast")}
          >
            Forecast
          </button>
        </div>
      </div>

      {viewMode === "current" ? (
        <>
          {/* Current weather display */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              {getWeatherIcon(
                weather.current.weather_code,
                weather.current.is_day
              )}
              <div className="ml-4">
                <h3 className="text-2xl font-bold">
                  {weather.current.temperature_2m}°
                  {weather.current_units.temperature_2m}
                </h3>
                <p className="text-sm text-gray-500">
                  Feels like {weather.current.apparent_temperature}°
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Current</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center">
              <Droplets className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm">
                {weather.current.relative_humidity_2m}% Humidity
              </span>
            </div>
            <div className="flex items-center">
              <Wind className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm">
                {weather.current.wind_speed_10m}{" "}
                {weather.current_units.wind_speed_10m}
              </span>
            </div>
            {weather.current.precipitation > 0 && (
              <div className="flex items-center">
                <CloudRain className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm">
                  {weather.current.precipitation}{" "}
                  {weather.current_units.precipitation}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 3-day forecast display */}
          <div className="flex justify-between mt-3">
            {forecast.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 mb-1">
                  {formatDay(day.date)}
                </span>
                <div className="mb-1">{getWeatherIcon(day.weatherCode, 1)}</div>
                <span className="text-sm font-bold">
                  {Math.round(day.temp)}°
                </span>
                <div className="flex items-center mt-1">
                  <Droplets className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-xs">{day.precipProb}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">3-Day Forecast</p>
          </div>
        </>
      )}
    </div>
  );
};

// Enhance LiveClock component with a more advanced design
const LiveClock = () => {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    // Set initial time
    updateTime();

    // Update time every second
    const interval = setInterval(() => {
      updateTime();
    }, 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const updateTime = () => {
    const now = new Date();

    // Format time: HH:MM:SS AM/PM
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Format date: Day of Week, Month Day, Year
    const dateString = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    setTime(timeString);
    setDate(dateString);
  };

  return (
    <div className="flex flex-col items-end">
      <div className="text-2xl font-bold relative overflow-hidden bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        <span className="relative z-10">{time}</span>
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-indigo-500/50 animate-pulse-slow"></span>
      </div>
      <div className="text-sm text-gray-600 italic">{date}</div>
    </div>
  );
};

// Move this helper function to the top, before fetchDashboardData
const getWarehouseName = (warehouseId: string | undefined) => {
  if (!warehouseId) return "";
  return `Warehouse ${warehouseId.substring(0, 8)}`;
};

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      "https://qpkaklmbiwitlroykjim.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U"
    );
  }
  return supabaseInstance;
};

// Use the singleton instance
const supabase = getSupabaseClient();

interface Delivery {
  id: string;
  created_at: string;
  status: string;
  client_id: string;
}

interface Warehouse {
  id: string;
  created_at: string;
  client_id: string;
}

// Add this interface near the top with other interfaces
interface DeliveryData {
  date: string;
  count: number;
  isPrediction?: boolean;
}

interface WarehouseOperation {
  id: string;
  vehicle_registration: string;
  driver_name: string;
  vehicle_size: string;
  load_type: string;
  arrival_time: string;
  condition: string;
  quantity: number;
  customer?: {
    name?: string;
    company?: string;
  };
  warehouse?: {
    name?: string;
    location?: string;
  };
}

// Add a proper Product interface
interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  quantity?: number;
  client_id?: string;
  created_at?: string;
}

// Add a proper WarehouseOperation interface that matches your database structure
interface WarehouseOperationDB {
  id: string;
  client_id: string;
  vehicle_registration?: string;
  driver_name?: string;
  vehicle_size?: string;
  load_type?: string;
  arrival_time?: string;
  condition?: string;
  quantity?: number;
  created_at?: string;
  status?: string;
  warehouse?: {
    name?: string;
    location?: string;
  };
  customer?: {
    name?: string;
    company?: string;
  };
}

// Add before fetchDashboardData
const fetchWarehouseOperations = async (supabase: any, clientId: string) => {
  let operations: any[] = [];

  // Try warehouse_items table first
  const { data: warehouseItems, error: warehouseError } = await supabase
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
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // Fetch warehouse names for all items
  const warehouseIds =
    warehouseItems
      // @ts-expect-error jk j
      ?.filter((item) => item.truck_arrival?.warehouse_id)
      // @ts-expect-error jk j
      .map((item) => item.truck_arrival.warehouse_id) || [];

  let warehouseNames: Record<string, string> = {};

  if (warehouseIds.length > 0) {
    const { data: warehouses, error: warehousesError } = await supabase
      .from("warehouses")
      .select("id, name, location")
      .in("id", warehouseIds);

    if (!warehousesError && warehouses) {
      warehouseNames = warehouses.reduce(
        (acc: Record<string, string>, wh: any) => {
          acc[wh.id] = wh.name || `Warehouse ${wh.id.substring(0, 8)}`;
          return acc;
        },
        {}
      );
    }
  }

  if (!warehouseError && warehouseItems && warehouseItems.length > 0) {
    console.log(
      "Found operations in warehouse_items table:",
      warehouseItems.length
    );
    return warehouseItems.map((item: any) => {
      const warehouseId = item.truck_arrival?.warehouse_id;
      const warehouseName = warehouseId
        ? warehouseNames[warehouseId] ||
          `Warehouse ${warehouseId.substring(0, 8)}`
        : "Unknown Warehouse";

      return {
        customerName: item.truck_arrival?.customer_name || "Unknown Customer",
        warehouseName: warehouseName,
        warehouseLocation: "Unknown Location",
        vehicleRegistration: item.truck_arrival?.vehicle_registration || "",
        driverName: item.truck_arrival?.driver_name || "",
        vehicleSize: item.truck_arrival?.vehicle_size || "",
        loadType: item.truck_arrival?.load_type || "Standard Load",
        arrivalTime:
          item.truck_arrival?.arrival_time || new Date().toISOString(),
        condition: item.condition || "Good",
        quantity: item.quantity || 0,
        description: item.description || "",
      };
    });
  }

  // Try truck_arrivals table
  const { data: truckArrivals, error: truckError } = await supabase
    .from("truck_arrivals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // Fetch warehouse names for all truck arrivals
  const truckWarehouseIds =
    truckArrivals
      // @ts-expect-error jk j
      ?.filter((item) => item.warehouse_id)
      // @ts-expect-error jk j
      .map((item) => item.warehouse_id) || [];

  let truckWarehouseNames: Record<string, string> = {};

  if (truckWarehouseIds.length > 0) {
    const { data: warehouses, error: warehousesError } = await supabase
      .from("warehouses")
      .select("id, name, location")
      .in("id", truckWarehouseIds);

    if (!warehousesError && warehouses) {
      truckWarehouseNames = warehouses.reduce(
        (acc: Record<string, string>, wh: any) => {
          acc[wh.id] = wh.name || `Warehouse ${wh.id.substring(0, 8)}`;
          return acc;
        },
        {}
      );
    }
  }

  if (!truckError && truckArrivals && truckArrivals.length > 0) {
    console.log(
      "Found operations in truck_arrivals table:",
      truckArrivals.length
    );
    return truckArrivals.map((item: any) => {
      const warehouseId = item.warehouse_id;
      const warehouseName = warehouseId
        ? truckWarehouseNames[warehouseId] ||
          `Warehouse ${warehouseId.substring(0, 8)}`
        : "Unknown Warehouse";

      return {
        customerName: item.customer_name || "Unknown Customer",
        warehouseName: warehouseName,
        warehouseLocation: "Unknown Location",
        vehicleRegistration: item.vehicle_registration || "",
        driverName: item.driver_name || "",
        vehicleSize: item.vehicle_size || "",
        loadType: item.load_type || "Standard Load",
        arrivalTime: item.arrival_time || new Date().toISOString(),
        condition: "Good",
        quantity: 1,
      };
    });
  }

  // Sample data if everything else fails
  console.log("No warehouse operations found in any table, using sample data");
  return [
    {
      customerName: "Acme Corp",
      warehouseName: "Central Warehouse",
      warehouseLocation: "Downtown",
      vehicleRegistration: "ABC123",
      driverName: "John Smith",
      vehicleSize: "Large",
      loadType: "Standard Load",
      arrivalTime: new Date().toISOString(),
      condition: "Good",
      quantity: 25,
    },
    {
      customerName: "Global Shipping Inc",
      warehouseName: "North Warehouse",
      warehouseLocation: "Industrial Zone",
      vehicleRegistration: "XYZ789",
      driverName: "Jane Doe",
      vehicleSize: "Medium",
      loadType: "Transfer",
      arrivalTime: new Date().toISOString(),
      condition: "Excellent",
      quantity: 15,
    },
    {
      customerName: "Quick Logistics",
      warehouseName: "South Warehouse",
      warehouseLocation: "Port Area",
      vehicleRegistration: "DEF456",
      driverName: "Bob Johnson",
      vehicleSize: "Small",
      loadType: "Removal",
      arrivalTime: new Date().toISOString(),
      condition: "Fair",
      quantity: 10,
    },
  ];
};

export default function DashboardPage() {
  const router = useRouter();
  const [clientData, setClientData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOrgs, setAdminOrgs] = useState<any[]>([]);
  const [adminCouriers, setAdminCouriers] = useState<any[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<"organizations" | "couriers" | "customers" | "activity">("organizations");
  const [adminAuditLog, setAdminAuditLog] = useState<any[]>([]);
  const [adminAuditLoading, setAdminAuditLoading] = useState(false);
  const [adminAuditMigrationSuggested, setAdminAuditMigrationSuggested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<WarehouseActivity[]>(
    []
  );
  const [allRecentMovements, setAllRecentMovements] = useState<
    WarehouseActivity[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    products: {
      total: 0,
      daily: [],
      trend: 0,
      addedToday: 0,
      addedYesterday: 0,
      addedThisWeek: 0,
      value: 0,
      lowStock: 0,
    },
    deliveries: {
      total: 0,
      byStatus: {},
      daily: [],
    },
    couriers: {
      total: 0,
      active: 0,
      daily: [],
      byStatus: {},
      totalDeliveries: 0,
      averageCapacity: 0,
    },
    warehouse: {
      total: 0,
      byStatus: {},
      utilization: [],
      totalWarehouses: 0,
      totalStocks: 0,
      stocksByWarehouse: [],
      movementStats: {
        totalAssignments: 0,
        totalTransfers: 0,
        totalRemovals: 0,
      },
      operations: [], // Ensure initial state is an empty array
      operationsByType: {
        assignments: 0,
        transfers: 0,
        removals: 0,
      },
      totalOperations: 0,
    },
  });
  const [truckArrivals, setTruckArrivals] = useState<any[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [putawayAssignments, setPutawayAssignments] = useState<any[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);

  const fetchStockMovements = async (clientId: string) => {
    try {
      const { data, error } = await supabase
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
        .eq("client_id", clientId)
        .order("timestamp", { ascending: false })
        .limit(5);

      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to fetch stock movements");
    }
  };

  // Enhanced client/admin authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      try {
        const userData = JSON.parse(currentUser);
        if (!userData.id) {
          router.push("/auth/login");
          return;
        }

        if (userData.type === "admin") {
          const { data: adminCheck, error } = await supabase
            .from("admins")
            .select("id, email, name, status")
            .eq("id", userData.id)
            .single();

          if (error || !adminCheck || adminCheck.status !== "active") {
            console.error("Admin verification failed:", error);
            localStorage.removeItem("currentUser");
            router.push("/auth/login");
            return;
          }
          setClientData(userData);
          setIsAdmin(true);
          fetchAdminDashboard();
          setLoading(false);
          return;
        }

        // Verify client exists in database
        const { data: clientCheck, error } = await supabase
          .from("clients")
          .select("id, company")
          .eq("id", userData.id)
          .single();

        if (error || !clientCheck) {
          console.error("Client verification failed:", error);
          localStorage.removeItem("currentUser");
          router.push("/auth/login");
          return;
        }

        setClientData(userData);

        // Load cached dashboard data if available
        const cachedStats = localStorage.getItem(
          `dashboard_stats_${userData.id}`
        );
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            setStats(parsedStats);
          } catch (e) {
            console.error("Error parsing cached stats:", e);
          }
        }

        // Fetch fresh data
        fetchDashboardData();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router, supabase]);

  const fetchAdminDashboard = async () => {
    setAdminLoading(true);
    try {
      const [clientsRes, couriersRes, customersRes] = await Promise.all([
        supabase.from("clients").select("id, email, company, status, created_at").order("created_at", { ascending: false }),
        supabase.from("couriers").select("id, email, name, status, created_at").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, email, name, status, created_at").order("created_at", { ascending: false }),
      ]);
      setAdminOrgs(clientsRes.data || []);
      setAdminCouriers(couriersRes.data || []);
      setAdminCustomers(customersRes.data || []);
    } catch (e) {
      console.error("Admin dashboard fetch error:", e);
      toast.error("Failed to load admin data");
    } finally {
      setAdminLoading(false);
    }
  };

  const updateAdminStatus = async (
    table: "clients" | "couriers" | "customers",
    id: string,
    status: "active" | "inactive"
  ) => {
    try {
      const { error } = await supabase.from(table).update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(status === "inactive" ? "Suspended" : "Reactivated");
      fetchAdminDashboard();
    } catch (e: any) {
      console.error("Update status error:", e);
      toast.error(e?.message || "Failed to update");
    }
  };

  const fetchAdminAuditLog = async () => {
    setAdminAuditLoading(true);
    setAdminAuditMigrationSuggested(false);
    try {
      const res = await fetch("/api/admin/audit-log?limit=100");
      const data = await res.json();
      if (res.ok) {
        setAdminAuditLog(Array.isArray(data?.list) ? data.list : []);
        setAdminAuditMigrationSuggested(!!data?.migration_suggested);
      } else {
        setAdminAuditLog([]);
      }
    } catch (e) {
      console.error("Audit log fetch error:", e);
      setAdminAuditLog([]);
    } finally {
      setAdminAuditLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && adminTab === "activity") fetchAdminAuditLog();
  }, [isAdmin, adminTab]);

  // Update the useEffect to call inspectDatabase (client only)
  useEffect(() => {
    if (clientData?.id && !isAdmin) {
      console.log("🔑 Client ID:", clientData.id);
      inspectDatabase(supabase).then(() => {
        fetchDashboardData();
      });
    }
  }, [clientData?.id, isAdmin]);

  // Update fetchRecentMovements to fetch all movements for the client (no date filter)
  const fetchRecentMovements = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select(
          `
          *,
          warehouses:warehouse_id (name),
          products:product_id (name)
        `
        )
        .eq("client_id", clientId)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching recent movements:", error);
        throw error;
      }

      // Map to the format expected by Recent Activity
      // @ts-expect-error jk j
      const mappedActivities = (data || []).map((m: InventoryMovement) => ({
        date: new Date(m.timestamp).toISOString().split("T")[0],
        productName: m.products?.name || "Unknown Product",
        warehouseName: m.warehouses?.name || "Unknown Warehouse",
        quantity: m.quantity,
        type: m.movement_type,
      }));

      // For the chart, return all; for the list, return the latest 10
      return {
        all: mappedActivities,
        latest: mappedActivities.slice(0, 10),
      };
    } catch (error) {
      console.error("Error in fetchRecentMovements:", error);
      return { all: [], latest: [] };
    }
  };

  // Update fetchDashboardData to use new fetchRecentMovements
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) {
        router.push("/auth/login");
        return;
      }
      const user = JSON.parse(userStr);

      // Fetch products data
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error fetching products:", productsError);
        throw productsError;
      }

      console.log("Raw products data:", productsData);

      // Process products data
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const productsStats = {
        total: productsData.length,
        daily: processDaily(productsData, "created_at"),
        trend: calculateTrend(
          //  @ts-expect-error jk j
          productsData.filter((p) => new Date(p.created_at) > yesterday).length,
          //  @ts-expect-error jk j
          productsData.filter(
            (p) =>
              new Date(p.created_at) > lastWeek &&
              new Date(p.created_at) <= yesterday
          ).length
        ),
        // @ts-expect-error jk j
        addedToday: productsData.filter((p) => new Date(p.created_at) > today)
          .length,
        // @ts-expect-error jk j
        addedYesterday: productsData.filter(
          (p) =>
            new Date(p.created_at) > yesterday &&
            new Date(p.created_at) <= today
        ).length,
        // @ts-expect-error jk j
        addedThisWeek: productsData.filter(
          (p) => new Date(p.created_at) > lastWeek
        ).length,
        // @ts-expect-error jk j
        value: productsData.reduce(
          (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
          0
        ),
        // @ts-expect-error jk j
        lowStock: productsData.filter((p) => (p.quantity || 0) < 10).length,
      };

      // Update stats with products data
      setStats((prev) => ({
        ...prev,
        products: productsStats,
      }));

      // Fetch deliveries data with status
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("deliveries")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: true });

      if (deliveriesError) {
        console.error("Error fetching deliveries:", deliveriesError);
        throw deliveriesError;
      }

      console.log("Raw deliveries data:", deliveriesData);

      // Process delivery data for the last 7 days
      const last7Days = [...Array(7)]
        .map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        })
        .reverse();

      // Create a map of dates to delivery counts
      const deliveryCounts = last7Days.reduce((acc, date) => {
        acc[date] = 0;
        return acc;
      }, {} as Record<string, number>);

      // Count deliveries for each date
      if (deliveriesData && Array.isArray(deliveriesData)) {
        deliveriesData.forEach((delivery) => {
          if (delivery.created_at) {
            // @ts-expect-error jk j
            const date = new Date(delivery.created_at)
              .toISOString()
              .split("T")[0];
            if (deliveryCounts.hasOwnProperty(date)) {
              deliveryCounts[date]++;
            }
          }
        });
      }

      // Convert to array format for the chart
      const deliveryData = last7Days.map((date) => ({
        date,
        count: deliveryCounts[date] || 0,
      }));

      // Update stats with the processed data
      setStats((prev) => ({
        ...prev,
        deliveries: {
          total: Array.isArray(deliveriesData) ? deliveriesData.length : 0,
          byStatus: {
            pending: Array.isArray(deliveriesData)
              ? deliveriesData.filter((d) => d.status === "pending").length
              : 0,
            in_progress: Array.isArray(deliveriesData)
              ? deliveriesData.filter((d) => d.status === "in_progress").length
              : 0,
            completed: Array.isArray(deliveriesData)
              ? deliveriesData.filter((d) => d.status === "completed").length
              : 0,
            failed: Array.isArray(deliveriesData)
              ? deliveriesData.filter((d) => d.status === "failed").length
              : 0,
          },
          daily: deliveryData,
        },
      }));

      // Save to localStorage
      localStorage.setItem(`dashboard_stats_${user.id}`, JSON.stringify(stats));

      // Fetch warehouses data
      const { data: warehousesData, error: warehousesError } = await supabase
        .from("warehouses")
        .select("id, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: true });

      if (warehousesError) {
        console.error("Error fetching warehouses:", warehousesError);
        throw warehousesError;
      }

      // Process warehouse additions by date
      const warehouseAdditions: Record<string, number> = {};
      (warehousesData as Warehouse[]).forEach((warehouse) => {
        if (warehouse.created_at) {
          const date = new Date(warehouse.created_at)
            .toISOString()
            .split("T")[0];
          warehouseAdditions[date] = (warehouseAdditions[date] || 0) + 1;
        }
      });

      const warehouseActivityData = last7Days.map((date) => ({
        date,
        count: warehouseAdditions[date] || 0,
      }));

      // Update stats with both delivery and warehouse data
      setStats((prev) => ({
        ...prev,
        warehouse: {
          ...prev.warehouse,
          totalWarehouses: warehousesData.length,
          activityData: warehouseActivityData,
        },
      }));

      // Fetch stock movements
      await fetchStockMovements(user.id);

      // First, fetch warehouse operations with proper joins
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
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (warehouseError) {
        console.error("Error fetching warehouse items:", warehouseError);
        // Continue with empty data rather than throwing
        // throw warehouseError;
      }

      console.log("Raw warehouse items data:", warehouseData);
      console.log("Warehouse data count:", warehouseData?.length || 0);

      // Try different tables to find operations data
      let alternativeData = null;

      // Try truck_arrivals table
      if (!warehouseData || warehouseData.length === 0) {
        console.log("Trying to fetch from truck_arrivals table...");

        try {
          const { data: truckData, error: truckError } = await supabase
            .from("truck_arrivals")
            .select("*")
            .eq("client_id", user.id);

          if (!truckError && truckData && truckData.length > 0) {
            console.log(
              "Found data in truck_arrivals table:",
              truckData.length
            );
            alternativeData = truckData;
          } else if (truckError) {
            console.log("Error fetching from truck_arrivals:", truckError);
          }
        } catch (err) {
          console.log("Error fetching from truck_arrivals:", err);

          // Try a simple query without filters as fallback
          try {
            const { data: truckData, error: truckError } = await supabase
              .from("truck_arrivals")
              .select("*");

            if (!truckError && truckData && truckData.length > 0) {
              console.log(
                "Found data in truck_arrivals table (unfiltered):",
                truckData.length
              );
              alternativeData = truckData;
            }
          } catch (fallbackErr) {
            console.log("Fallback query failed:", fallbackErr);
          }
        }
      }

      // Try truck_items table with similar approach
      if (!warehouseData && !alternativeData) {
        console.log("Trying to fetch from truck_items table...");

        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from("truck_items")
            .select("*")
            .limit(30);

          if (!itemsError && itemsData && itemsData.length > 0) {
            console.log("Found data in truck_items table:", itemsData.length);
            alternativeData = itemsData;
          } else if (itemsError) {
            console.log("Error fetching from truck_items:", itemsError);
          }
        } catch (err) {
          console.log("Error fetching from truck_items:", err);
        }
      }

      // Ensure we have some data to display, even if the query returned nothing
      const sampleOperations = [
        {
          customerName: "Acme Corp",
          warehouseName: "Central Warehouse",
          warehouseLocation: "Downtown",
          vehicleRegistration: "ABC123",
          driverName: "John Smith",
          vehicleSize: "Large",
          loadType: "Standard Load",
          arrivalTime: new Date().toISOString(),
          condition: "Good",
          quantity: 25,
        },
        {
          customerName: "Global Shipping Inc",
          warehouseName: "North Warehouse",
          warehouseLocation: "Industrial Zone",
          vehicleRegistration: "XYZ789",
          driverName: "Jane Doe",
          vehicleSize: "Medium",
          loadType: "Transfer",
          arrivalTime: new Date().toISOString(),
          condition: "Excellent",
          quantity: 15,
        },
        {
          customerName: "Quick Logistics",
          warehouseName: "South Warehouse",
          warehouseLocation: "Port Area",
          vehicleRegistration: "DEF456",
          driverName: "Bob Johnson",
          vehicleSize: "Small",
          loadType: "Removal",
          arrivalTime: new Date().toISOString(),
          condition: "Fair",
          quantity: 10,
        },
      ];

      // If database query returns empty, use sample data for demonstration
      // In production, you would remove this and only use real data
      let operations: any[] = [];

      // Try to parse real data if available
      if (warehouseData && warehouseData.length > 0) {
        try {
          // Fetch warehouse names for all warehouse items
          const warehouseIds = warehouseData
            // @ts-expect-error jk j
            .filter((item) => item.truck_arrival?.warehouse_id)
            // @ts-expect-error jk j
            .map((item) => item.truck_arrival.warehouse_id)
            .filter(Boolean);

          let warehouseNames: Record<string, string> = {};

          if (warehouseIds.length > 0) {
            const { data: warehouses, error: warehousesError } = await supabase
              .from("warehouses")
              .select("id, name, location")
              .in("id", warehouseIds);

            if (!warehousesError && warehouses) {
              warehouseNames = warehouses.reduce(
                (acc: Record<string, string>, wh: any) => {
                  acc[wh.id] = wh.name || `Warehouse ${wh.id.substring(0, 8)}`;
                  return acc;
                },
                {}
              );
            }
          }

          operations = warehouseData.map((item: any) => {
            const warehouseId = item.truck_arrival?.warehouse_id;
            const warehouseName = warehouseId
              ? warehouseNames[warehouseId] ||
                `Warehouse ${warehouseId.substring(0, 8)}`
              : "Unknown Warehouse";

            return {
              customerName:
                item.truck_arrival?.customer_name || "Unknown Customer",
              warehouseName: warehouseName,
              warehouseLocation: "Unknown Location",
              vehicleRegistration:
                item.truck_arrival?.vehicle_registration || "",
              driverName: item.truck_arrival?.driver_name || "",
              vehicleSize: item.truck_arrival?.vehicle_size || "",
              loadType: item.truck_arrival?.load_type || "Standard Load",
              arrivalTime:
                item.truck_arrival?.arrival_time || new Date().toISOString(),
              condition: item.condition || "Good",
              quantity: item.quantity || 0,
              description: item.description || "",
            };
          });
          console.log(
            "Processed operations from warehouse_items:",
            operations.length
          );
        } catch (err) {
          console.error("Error processing warehouse operations:", err);
        }
      }

      // Try to use alternative data if main data not available
      if (
        operations.length === 0 &&
        alternativeData &&
        alternativeData.length > 0
      ) {
        try {
          console.log(
            "Processing alternative data source with length:",
            alternativeData.length
          );

          // Fetch warehouse names for truck arrivals
          const warehouseIds = alternativeData
            .filter((item) => item.warehouse_id)
            .map((item) => item.warehouse_id)
            .filter(Boolean);

          let warehouseNames: Record<string, string> = {};

          if (warehouseIds.length > 0) {
            const { data: warehouses, error: warehousesError } = await supabase
              .from("warehouses")
              .select("id, name, location")
              .in("id", warehouseIds);

            if (!warehousesError && warehouses) {
              warehouseNames = warehouses.reduce(
                (acc: Record<string, string>, wh: any) => {
                  acc[wh.id] = wh.name || `Warehouse ${wh.id.substring(0, 8)}`;
                  return acc;
                },
                {}
              );
            }
          }

          operations = alternativeData.map((item: any) => {
            // Different mapping format based on the table structure
            const warehouseId = item.warehouse_id;
            const warehouseName = warehouseId
              ? warehouseNames[warehouseId] ||
                `Warehouse ${warehouseId.substring(0, 8)}`
              : "Unknown Warehouse";

            return {
              customerName: item.customer_name || "Unknown Customer",
              warehouseName: warehouseName,
              warehouseLocation: "Unknown Location",
              vehicleRegistration: item.vehicle_registration || "",
              driverName: item.driver_name || "",
              vehicleSize: item.vehicle_size || "",
              loadType: item.load_type || "Standard Load",
              arrivalTime:
                item.arrival_time ||
                item.created_at ||
                new Date().toISOString(),
              condition: "Good",
              quantity: item.quantity || 1,
            };
          });

          console.log(
            "Processed operations from alternative source:",
            operations.length
          );
        } catch (err) {
          console.error("Error processing alternative data:", err);
        }
      }

      // If we couldn't get real data, use sample data
      if (operations.length === 0) {
        console.log("Using sample warehouse operations data");
        operations = sampleOperations;
      }

      console.log("Processed warehouse operations:", operations);

      // Calculate operations by type
      const operationsByType = {
        assignments: operations.filter(
          (op) =>
            op.loadType === "Standard Load" || op.loadType === "PALLETIZED"
        ).length,
        transfers: operations.filter(
          (op) => op.loadType === "Transfer" || op.loadType === "LOOSE"
        ).length,
        removals: operations.filter(
          (op) => op.loadType === "Removal" || op.loadType === "OTHER"
        ).length,
      };

      console.log("Operations by type:", operationsByType);

      // Calculate utilization percentage (simple example: 1% per item, max 100%)
      const utilizationPercentage = Math.min(100, operations.length);
      console.log("Warehouse utilization:", utilizationPercentage + "%");

      // Update stats with the new operations data
      setStats((prev) => {
        console.log("Updating warehouse stats with:", {
          operations: operations.length,
          byType: operationsByType,
          utilization: utilizationPercentage,
        });

        return {
          ...prev,
          warehouse: {
            ...prev.warehouse,
            operations: operations,
            operationsByType: operationsByType,
            totalOperations: operations.length,
            utilizationPercentage: utilizationPercentage,
          },
        };
      });

      // Fetch warehouse inventory data for the Warehouse Capacity card
      try {
        // Fetch inventory data with warehouse details
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("warehouse_inventory")
          .select(
            `
            *,
            warehouses:warehouse_id (
              id,
              name,
              capacity
            )
          `
          )
          .eq("client_id", user.id);

        if (inventoryError) {
          console.error("Error fetching warehouse inventory:", inventoryError);
        } else {
          console.log("Warehouse inventory data:", inventoryData);

          // Process warehouse inventory data
          if (inventoryData && inventoryData.length > 0) {
            // Group by warehouse
            // @ts-expect-error jk j
            const warehousesWithStocks = [];

            // Group inventory by warehouse
            const warehouseMap = {};
            inventoryData.forEach((item) => {
              const warehouseId = item.warehouse_id;
              // @ts-expect-error jk j
              if (!warehouseMap[warehouseId]) {
                // @ts-expect-error jk j
                warehouseMap[warehouseId] = {
                  id: warehouseId,
                  // @ts-expect-error jk j
                  name:
                    item.warehouses?.name ||
                    `Warehouse ${warehouseId.substring(0, 8)}`,
                  // @ts-expect-error jk j
                  capacity: item.warehouses?.capacity || 100,
                  stocks: [],
                };
              }
              // @ts-expect-error jk j
              warehouseMap[warehouseId].stocks.push({
                quantity: item.quantity || 0,
              });
            });

            // Convert map to array
            Object.values(warehouseMap).forEach((warehouse) => {
              warehousesWithStocks.push(warehouse);
            });

            // Calculate stocks data
            // @ts-expect-error jk j
            const totalStocks = calculateTotalStocks(warehousesWithStocks);
            // @ts-expect-error jk j
            const stocksByWarehouse =
              processStocksByWarehouse(warehousesWithStocks);
            // @ts-expect-error jk j
            const warehouseUtilization =
              processWarehouseUtilization(warehousesWithStocks);

            console.log("Warehouse statistics:", {
              totalStocks,
              stocksByWarehouse,
              utilization: warehouseUtilization,
            });

            // Update warehouse stats with inventory data
            setStats((prev) => ({
              ...prev,
              warehouse: {
                ...prev.warehouse,
                totalStocks: totalStocks,
                stocksByWarehouse: stocksByWarehouse,
                utilization: warehouseUtilization,
              },
            }));
          } else {
            console.log("No warehouse inventory data found");
          }
        }
      } catch (inventoryErr) {
        console.error("Error processing warehouse inventory:", inventoryErr);
      }

      // ... rest of your fetchDashboardData ...
    } catch (error) {
      console.error("Error in fetchDashboardData:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate trend
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper function to process daily data - updated to aggregate counts by date
  const processDaily = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];

    // Get the latest date from the data
    const latestDate = new Date(
      Math.max(...data.map((item) => new Date(item[dateField]).getTime()))
    );

    // Generate last 7 days relative to the latest date
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date(latestDate);
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    // Aggregate counts by day
    const countsByDay = data.reduce((acc: Record<string, number>, item) => {
      const date = new Date(item[dateField]).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Map to the required format with aggregated counts
    return last7Days.map((date) => ({
      date,
      count: countsByDay[date] || 0,
    }));
  };

  // Setup real-time subscriptions with enhanced error handling (client only, not admin)
  useEffect(() => {
    if (!clientData?.id || isAdmin) return;

    let retryCount = 0;
    const maxRetries = 3;

    const setupSubscription = () => {
      try {
        const channel = supabase
          .channel(`client-${clientData.id}-dashboard`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "deliveries",
              filter: `client_id=eq.${clientData.id}`,
            },
            () => fetchDashboardData()
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "warehouses",
              filter: `client_id=eq.${clientData.id}`,
            },
            () => fetchDashboardData()
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "products",
              filter: `client_id=eq.${clientData.id}`,
            },
            async (payload) => {
              console.log("Product update received:", payload);
              try {
                // Immediately fetch updated product data
                const { data: productsData, error: productsError } =
                  await supabase
                    .from("products")
                    .select("*")
                    .eq("client_id", clientData.id);

                if (productsError) {
                  console.error(
                    "Error fetching updated products:",
                    productsError
                  );
                  return;
                }

                // Update stats with new product data
                setStats((prev) => ({
                  ...prev,
                  products: {
                    ...prev.products,
                    total: productsData.length,
                    daily: processDaily(productsData, "created_at"),
                    trend: calculateTrend(
                      // @ts-expect-error jk j
                      productsData.filter(
                        (p) =>
                          new Date(p.created_at) >
                          new Date(Date.now() - 86400000)
                      ).length,
                      // @ts-expect-error jk j
                      productsData.filter(
                        (p) =>
                          new Date(p.created_at) >
                            new Date(Date.now() - 172800000) &&
                          new Date(p.created_at) <=
                            new Date(Date.now() - 86400000)
                      ).length
                    ),
                    // @ts-expect-error jk j
                    addedToday: productsData.filter(
                      (p) =>
                        new Date(p.created_at) > new Date(Date.now() - 86400000)
                    ).length,
                    // @ts-expect-error jk j
                    addedYesterday: productsData.filter(
                      (p) =>
                        new Date(p.created_at) >
                          new Date(Date.now() - 172800000) &&
                        new Date(p.created_at) <=
                          new Date(Date.now() - 86400000)
                    ).length,
                    // @ts-expect-error jk j
                    addedThisWeek: productsData.filter(
                      (p) =>
                        new Date(p.created_at) >
                        new Date(Date.now() - 604800000)
                    ).length,
                    // @ts-expect-error jk j
                    value: productsData.reduce(
                      (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
                      0
                    ),
                    // @ts-expect-error jk j
                    lowStock: productsData.filter((p) => (p.quantity || 0) < 10)
                      .length,
                  },
                }));
              } catch (error) {
                console.error("Error processing product update:", error);
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "stock_movements",
              filter: `client_id=eq.${clientData.id}`,
            },
            () => fetchDashboardData()
          )
          .subscribe((status) => {
            console.log(
              `Subscription status for client ${clientData.id}:`,
              status
            );
            if (status === "SUBSCRIBED") {
              fetchDashboardData();
            }
          });

        return () => {
          channel.unsubscribe();
        };
      } catch (error) {
        console.error("Subscription error:", error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupSubscription, 1000 * retryCount);
        }
      }
    };

    return setupSubscription();
  }, [clientData?.id]);

  // Show loading or authentication states
  if (!clientData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please log in to view your dashboard
          </h2>
          <Button onClick={() => router.push("/auth/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Admin dashboard: all organizations, couriers, customers
  if (isAdmin) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30 pb-12">
        <header className="w-full bg-white border-b border-gray-200 mb-4 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-slate-600" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">All organizations, couriers & customers</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fetchAdminDashboard()}
                disabled={adminLoading}
                variant="outline"
                size="sm"
              >
                {adminLoading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAllRoleStorage();
                  router.push("/auth/login");
                }}
              >
                Log out
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {adminLoading && adminOrgs.length === 0 && adminCouriers.length === 0 && adminCustomers.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
          ) : (
            <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as "organizations" | "couriers" | "customers" | "activity")} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="organizations" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizations
                  <Badge variant="secondary" className="ml-1">{adminOrgs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="couriers" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Couriers
                  <Badge variant="secondary" className="ml-1">{adminCouriers.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customers
                  <Badge variant="secondary" className="ml-1">{adminCustomers.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity log
                  <Badge variant="secondary" className="ml-1">{adminAuditLog.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organizations" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> All Organizations
                  </CardTitle>
                  <CardDescription>Registered client organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminOrgs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              No organizations yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          adminOrgs.map((org: any) => (
                            <TableRow key={org.id}>
                              <TableCell className="font-medium">{org.company || "—"}</TableCell>
                              <TableCell>{org.email}</TableCell>
                              <TableCell>
                                <Badge variant={org.status === "active" ? "default" : "secondary"}>
                                  {org.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm">
                                {org.created_at ? new Date(org.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {org.status === "active" ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("clients", org.id, "inactive")}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("clients", org.id, "active")}
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="couriers" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" /> Registered Couriers
                  </CardTitle>
                  <CardDescription>All courier accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminCouriers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              No couriers yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          adminCouriers.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.name || "—"}</TableCell>
                              <TableCell>{c.email}</TableCell>
                              <TableCell>
                                <Badge variant={c.status === "active" ? "default" : "secondary"}>
                                  {c.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm">
                                {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {c.status === "active" ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("couriers", c.id, "inactive")}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("couriers", c.id, "active")}
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="customers" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Customers
                  </CardTitle>
                  <CardDescription>All customer accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminCustomers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              No customers yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          adminCustomers.map((cust: any) => (
                            <TableRow key={cust.id}>
                              <TableCell className="font-medium">{cust.name || "—"}</TableCell>
                              <TableCell>{cust.email}</TableCell>
                              <TableCell>
                                <Badge variant={(cust.status || "active") === "active" ? "default" : "secondary"}>
                                  {cust.status || "active"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm">
                                {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {(cust.status || "active") === "active" ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("customers", cust.id, "inactive")}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => updateAdminStatus("customers", cust.id, "active")}
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Activity log
                  </CardTitle>
                  <CardDescription>Delivery status updates, assignments, and audit events. All activity emails go to admin.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-3">
                    <Button size="sm" variant="outline" onClick={fetchAdminAuditLog} disabled={adminAuditLoading}>
                      {adminAuditLoading ? "Loading…" : "Refresh"}
                    </Button>
                  </div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Package / Delivery</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Old → New</TableHead>
                          <TableHead>POD</TableHead>
                          <TableHead>IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminAuditLog.length === 0 && !adminAuditLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="text-gray-500 space-y-1">
                                {adminAuditMigrationSuggested ? (
                                  <>
                                    <p className="font-medium">Activity logging not set up</p>
                                    <p className="text-sm">Run the migration <code className="bg-gray-100 px-1 rounded text-xs">20250625000000_delivery_audit_and_timeline.sql</code> in Supabase, then refresh.</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">No activity yet</p>
                                    <p className="text-sm">Activity appears when you assign a delivery (Couriers) or update status (Customer Activity / courier app).</p>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          adminAuditLog.map((entry: any) => {
                            const podUrl = entry.action === "pod_uploaded" ? entry.new_value : entry.metadata?.pod_file;
                            return (
                            <TableRow key={entry.id}>
                              <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                                {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs">{entry.package_id || entry.delivery_id || "—"}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{entry.action || "—"}</Badge>
                              </TableCell>
                              <TableCell>{entry.actor_type || "—"}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {entry.old_value != null || entry.new_value != null
                                  ? `${entry.old_value ?? "—"} → ${entry.new_value ?? "—"}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {podUrl ? (
                                  <a href={podUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View POD</a>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {entry.metadata?.ip ?? "—"}
                              </TableCell>
                            </TableRow>
                          );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    );
  }

  const groupByDay = (data: any[]) => {
    return data.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  };

  const countByStatus = (data: any[]) => {
    return data.reduce((acc: any, item) => {
      const status = item.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  };

  const processWarehouseGrowth = (data: any[]) => {
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    const warehousesByDay = data.reduce((acc: any, warehouse) => {
      const date = new Date(warehouse.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return last7Days.map((date) => ({
      date,
      count: warehousesByDay[date] || 0,
    }));
  };

  const calculateTrends = (data: any[], field: string) => {
    if (!data || data.length < 2) return 0;
    const latest = data[0][field];
    const previous = data[1][field];
    return previous ? ((latest - previous) / previous) * 100 : 0;
  };

  const getActivityStatus = (activity: WarehouseActivity) => {
    switch (activity.type) {
      case "in":
        return { color: "bg-green-500", label: "Assignment" };
      case "out":
        return { color: "bg-red-500", label: "Removal" };
      case "transfer":
        return { color: "bg-blue-500", label: "Transfer" };
      default:
        return { color: "bg-gray-500", label: "Unknown" };
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50/30 relative overflow-hidden pb-12">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Dashboard Header */}
      <header className="w-full backdrop-blur-md bg-white/60 sticky top-0 z-50 border-b border-white/20 mb-2 sm:mb-4 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent relative">
              Dashboard Overview
              <span className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-blue-600 to-transparent"></span>
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 flex items-center">
              <Activity className="h-3 w-3 text-blue-500 mr-1.5 animate-pulse" />
              Monitor your logistics operations in real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <Button
              onClick={() => fetchDashboardData()}
              className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md shadow-blue-500/20 transition-all text-sm"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-1.5 relative z-10">
                <Activity className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </div>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* AI Insights Banner */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-circuit-pattern opacity-5"></div>
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg mr-2.5">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800">
                AI-Powered Insights
              </h3>
              <p className="text-xs text-blue-600">
                Your logistics network is operating at 87% efficiency. Warehouse
                #3 could be optimized to improve capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Products Card */}
          <div className="relative overflow-hidden group">
            <Card className="border-0 glass-card rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-1 space-y-0 px-3 sm:px-4 pt-2 sm:pt-3">
                <CardTitle className="text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700">
                  Products
                </CardTitle>
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white shadow-lg shadow-purple-500/20">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-3">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 flex items-baseline">
                  {stats.products.total || 0}
                  <span className="ml-2 text-xs font-normal px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-md">
                    {stats.products.trend > 0 ? "+" : ""}
                    {stats.products.trend}%
                  </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-gray-600">Added this week</span>
                    <span className="text-purple-600 font-medium flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats.products.addedThisWeek || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Stock Health</span>
                    <span
                      className={`font-medium flex items-center ${
                        stats.products.lowStock > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {stats.products.lowStock > 0 ? (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {stats.products.lowStock} Low
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Good
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((stats.products.addedThisWeek || 0) / 10) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warehouse Operations Card */}
          <div className="relative overflow-hidden group">
            <Card className="border-0 glass-card rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-1 space-y-0 px-3 sm:px-4 pt-2 sm:pt-3">
                <CardTitle className="text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                  Warehouse Operations
                </CardTitle>
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                  <Warehouse className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-3">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 flex items-baseline">
                  {stats.warehouse.totalOperations || 0}
                  <span className="ml-2 text-xs font-normal px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                    Total Items
                  </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  {/* Utilization bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Warehouse Utilization
                      </span>
                      <span className="text-xs font-medium">
                        {stats.warehouse.utilizationPercentage || 0}%
                      </span>
                    </div>
                    <Progress
                      value={stats.warehouse.utilizationPercentage || 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Metrics Card */}
          <div className="relative overflow-hidden group">
            <Card className="border-0 glass-card rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-1 space-y-0 px-3 sm:px-4 pt-2 sm:pt-3">
                <CardTitle className="text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-teal-700">
                  Delivery Metrics
                </CardTitle>
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg text-white shadow-lg shadow-green-500/20">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-3">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 flex items-baseline">
                  {stats.deliveries.total || 0}
                  <span className="ml-2 text-xs font-normal px-1.5 py-0.5 bg-green-50 text-green-600 rounded-md">
                    {(() => {
                      const completed =
                        stats.deliveries.byStatus?.completed || 0;
                      const total = stats.deliveries.total || 1;
                      const completionRate = Math.round(
                        (completed / total) * 100
                      );
                      return `${completionRate}% Success`;
                    })()}
                  </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-gray-600">Completed</span>
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {stats.deliveries.byStatus?.completed || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">On-Time Rate</span>
                    <span className="text-green-600 font-medium flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {(() => {
                        const completed =
                          stats.deliveries.byStatus?.completed || 0;
                        const total = stats.deliveries.total || 1;
                        return Math.round((completed / total) * 100);
                      })()}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warehouse Capacity Card */}
          <div className="relative overflow-hidden group">
            <Card className="border-0 glass-card rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-1 space-y-0 px-3 sm:px-4 pt-2 sm:pt-3">
                <CardTitle className="text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700">
                  Warehouse Capacity
                </CardTitle>
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white shadow-lg shadow-purple-500/20">
                  <Warehouse className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-3">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 flex items-baseline">
                  {stats.warehouse.totalWarehouses} Units
                </div>
                <div className="text-sm text-gray-600 mt-1 flex items-center">
                  <Package className="h-3 w-3 mr-1 text-purple-500" />
                  {stats.warehouse.totalStocks} Items Stored
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Weather Updates Card */}
          <Card className="border-0 glass-card rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                Weather Updates
              </CardTitle>
              <CardDescription>Real-time weather conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <WeatherWidget />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Status Distribution */}
          <Card className="border-0 glass-card rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                Delivery Status
              </CardTitle>
              <CardDescription>AI Enhanced</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Pending",
                          value: stats.deliveries.byStatus?.pending || 0,
                          color: "#f59e0b",
                        },
                        {
                          name: "In Progress",
                          value: stats.deliveries.byStatus?.in_progress || 0,
                          color: "#3b82f6",
                        },
                        {
                          name: "Completed",
                          value: stats.deliveries.byStatus?.completed || 0,
                          color: "#10b981",
                        },
                        {
                          name: "Failed",
                          value: stats.deliveries.byStatus?.failed || 0,
                          color: "#ef4444",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        {
                          name: "Pending",
                          value: stats.deliveries.byStatus?.pending || 0,
                          color: "#f59e0b",
                        },
                        {
                          name: "In Progress",
                          value: stats.deliveries.byStatus?.in_progress || 0,
                          color: "#3b82f6",
                        },
                        {
                          name: "Completed",
                          value: stats.deliveries.byStatus?.completed || 0,
                          color: "#10b981",
                        },
                        {
                          name: "Failed",
                          value: stats.deliveries.byStatus?.failed || 0,
                          color: "#ef4444",
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: number) => [
                        `${value} deliveries`,
                        "Count",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution Details */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[
                  {
                    name: "Pending",
                    value: stats.deliveries.byStatus?.pending || 0,
                    color: "#f59e0b",
                    icon: Clock,
                  },
                  {
                    name: "In Progress",
                    value: stats.deliveries.byStatus?.in_progress || 0,
                    color: "#3b82f6",
                    icon: Activity,
                  },
                  {
                    name: "Completed",
                    value: stats.deliveries.byStatus?.completed || 0,
                    color: "#10b981",
                    icon: CheckCircle2,
                  },
                  {
                    name: "Failed",
                    value: stats.deliveries.byStatus?.failed || 0,
                    color: "#ef4444",
                    icon: AlertCircle,
                  },
                ].map((status) => {
                  const total = stats.deliveries.total || 1;
                  const percentage = Math.round((status.value / total) * 100);
                  const Icon = status.icon;

                  return (
                    <div
                      key={status.name}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="p-2 rounded-lg mr-3"
                        style={{ backgroundColor: `${status.color}20` }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: status.color }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {status.name}
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: status.color }}
                        >
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Insight */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">
                      AI Insight
                    </h3>
                    <p className="text-sm text-blue-600">
                      {(() => {
                        const completed =
                          stats.deliveries.byStatus?.completed || 0;
                        const total = stats.deliveries.total || 1;
                        const completionRate = Math.round(
                          (completed / total) * 100
                        );
                        const previousRate = 88; // This should come from historical data
                        const improvement = completionRate - previousRate;

                        if (improvement > 0) {
                          return `Completion rates improved by ${improvement}% this week`;
                        } else if (improvement < 0) {
                          return `Completion rates decreased by ${Math.abs(
                            improvement
                          )}% this week`;
                        } else {
                          return "Completion rates remain stable this week";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-3 sm:mt-6">
          <Card className="border-0 glass-card rounded-xl overflow-hidden">
            <CardHeader className="py-2 sm:py-4 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                    Recent Activity
                    <span className="ml-2 flex items-center text-xs font-normal px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                      <Activity className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1 animate-pulse" />
                      Live
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <ArrowLeftRight className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 text-blue-500" />
                    Latest stock movements and operations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3 sm:space-y-4 max-h-[260px] sm:max-h-[320px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : stockMovements.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base">No recent activities</p>
                  </div>
                ) : (
                  stockMovements.map((movement, index) => {
                    const isNew = index === 0;
                    const movementType = movement.movement_type;
                    const typeColor =
                      movementType === "in"
                        ? "green"
                        : movementType === "out"
                        ? "red"
                        : "blue";

                    return (
                      <div
                        key={movement.id}
                        className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
                          isNew
                            ? "bg-gradient-to-r from-blue-50/50 to-transparent border border-blue-100"
                            : "bg-gray-50/80 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center mb-1.5 sm:mb-2">
                          <div
                            className={`w-1.5 sm:w-2 h-6 sm:h-8 rounded-full bg-${typeColor}-500 mr-2 sm:mr-3`}
                          >
                            {isNew && (
                              <span className="absolute -mt-1 -ml-1 flex h-1.5 sm:h-2 w-1.5 sm:w-2">
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${typeColor}-400 opacity-75`}
                                ></span>
                                <span
                                  className={`relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 bg-${typeColor}-500`}
                                ></span>
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-0.5 sm:mb-1">
                              <p className="text-sm sm:text-base font-medium text-gray-800 truncate mr-2">
                                {movement.products?.name ||
                                  movement.products?.sku ||
                                  "Product"}
                              </p>
                              {isNew && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {movement.warehouses?.name || "Warehouse"}
                            </p>
                          </div>

                          <div className="ml-2 shrink-0">
                            <div className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 flex items-center whitespace-nowrap">
                              <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                              {movement.quantity} units
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center ml-3.5 sm:ml-5 text-xs sm:text-sm text-gray-600">
                          <Badge
                            variant="outline"
                            className={`text-xs bg-${typeColor}-50 text-${typeColor}-700 border-${typeColor}-200`}
                          >
                            {movementType.toUpperCase()}
                          </Badge>
                          <span className="mx-1.5 sm:mx-2">•</span>
                          <span className="font-mono text-xs">
                            {movement.reference_number}
                          </span>
                          <div className="ml-auto flex items-center text-2xs sm:text-xs text-gray-500">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {new Date(movement.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Latest Activity Summary */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-600 mr-1.5 sm:mr-2 animate-pulse"></div>
                    <span className="text-2xs sm:text-xs text-gray-600">
                      Latest Activity:
                    </span>
                  </div>
                  <span className="text-xs sm:text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate max-w-[60%] sm:max-w-none">
                    {stockMovements.length > 0
                      ? `${
                          stockMovements[0].products?.name ||
                          stockMovements[0].products?.sku ||
                          "Product"
                        } - ${stockMovements[0].quantity} units (${
                          stockMovements[0].movement_type
                        })`
                      : "No recent activities"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Operations Details */}
        <div className="mt-3 sm:mt-6">
          <Card className="border-0 glass-card rounded-xl overflow-hidden">
            <CardHeader className="py-2 sm:py-4 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center">
                    <Warehouse className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                    Warehouse Operations
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <Truck className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 text-blue-500" />
                    Recent arrivals and activities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3 sm:space-y-4 max-h-[260px] sm:max-h-[320px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : stats.warehouse.operations?.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Warehouse className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base">
                      No warehouse operations found
                    </p>
                  </div>
                ) : (
                  stats.warehouse.operations?.map((operation, index) => {
                    const isNew = index === 0;
                    let typeColor = "blue";
                    let typeIcon = Package;

                    if (operation.loadType === "Transfer") {
                      typeColor = "green";
                      typeIcon = ArrowLeftRight;
                    } else if (operation.loadType === "Removal") {
                      typeColor = "red";
                      typeIcon = PackageX;
                    }

                    const Icon = typeIcon;

                    return (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
                          isNew
                            ? "bg-gradient-to-r from-blue-50/50 to-transparent border border-blue-100"
                            : "bg-gray-50/80 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center mb-1.5 sm:mb-2">
                          <div
                            className={`p-2 rounded-lg mr-3 bg-${typeColor}-100`}
                          >
                            <Icon className={`h-5 w-5 text-${typeColor}-500`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-0.5 sm:mb-1">
                              <p className="text-sm sm:text-base font-medium text-gray-800 truncate mr-2">
                                {operation.vehicleRegistration ||
                                  "Unknown Vehicle"}
                              </p>
                              {isNew && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {operation.warehouseName || "Unknown Warehouse"} -{" "}
                              {operation.customerName || "Unknown Customer"}
                            </p>
                          </div>

                          <div className="ml-2 shrink-0">
                            <div className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 flex items-center whitespace-nowrap">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              {operation.quantity || 0} units
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center ml-3.5 sm:ml-5 text-xs sm:text-sm text-gray-600">
                          <Badge
                            variant="outline"
                            className={`text-xs bg-${typeColor}-50 text-${typeColor}-700 border-${typeColor}-200`}
                          >
                            {operation.loadType || "Standard"}
                          </Badge>
                          <span className="mx-1.5 sm:mx-2">•</span>
                          <span className="font-mono text-xs">
                            {operation.driverName || "No Driver"}
                          </span>
                          <div className="ml-auto flex items-center text-2xs sm:text-xs text-gray-500">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {new Date(
                              operation.arrivalTime || new Date()
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-600 mr-1.5 sm:mr-2 animate-pulse"></div>
                    <span className="text-2xs sm:text-xs text-gray-600">
                      Total Operations:
                    </span>
                  </div>
                  <span className="text-xs sm:text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stats.warehouse.totalOperations || 0} operations (
                    {stats.warehouse.operationsByType?.assignments || 0}{" "}
                    standard, {stats.warehouse.operationsByType?.transfers || 0}{" "}
                    transfers, {stats.warehouse.operationsByType?.removals || 0}{" "}
                    removals)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
