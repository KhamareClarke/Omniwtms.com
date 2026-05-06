// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Store,
  Tag,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Check,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "recharts";

// Get Supabase client with direct credentials
const getSupabaseClient = () => {
  const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U";
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// Chart colors
const COLORS = ["#3456FF", "#5C4EFF", "#8763FF", "#00C49F", "#FFBB28"];

// We'll fetch all data from Supabase

interface PlatformConnection {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  lastSynced: string | null;
  status: "active" | "error" | "syncing" | "disconnected";
  metrics?: {
    orders: number;
    revenue: number;
    products: number;
  };
}

interface EcommerceStats {
  orders: {
    total: number;
    today: number;
    trend: number;
    byStatus: {
      processing: number;
      shipped: number;
      completed: number;
      cancelled: number;
    };
  };
  revenue: {
    total: number;
    today: number;
    trend: number;
  };
  products: {
    total: number;
    outOfStock: number;
    lowStock: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  stores: {
    total: number;
    active: number;
  };
  promotions: {
    active: number;
    scheduled: number;
  };
  platforms: {
    connected: number;
    total: number;
    list: PlatformConnection[];
  };
}

export default function EcommerceDashboard() {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [connectionDialog, setConnectionDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<EcommerceStats>({
    orders: {
      total: 1547,
      today: 52,
      trend: 18.5,
      byStatus: {
        processing: 45,
        shipped: 78,
        completed: 1392,
        cancelled: 32,
      },
    },
    revenue: {
      total: 243580.75,
      today: 6900.5,
      trend: 23.2,
    },
    products: {
      total: 876,
      outOfStock: 23,
      lowStock: 48,
    },
    customers: {
      total: 1235,
      new: 35,
      returning: 1200,
    },
    stores: {
      total: 5,
      active: 5,
    },
    promotions: {
      active: 8,
      scheduled: 3,
    },
    platforms: {
      connected: 3,
      total: 7,
      list: [
        {
          id: "shopify",
          name: "Shopify",
          logo: "/images/platforms/shopify.png",
          connected: true,
          lastSynced: "2025-05-22T14:30:00",
          status: "active",
          metrics: {
            orders: 487,
            revenue: 78500,
            products: 352,
          },
        },
        {
          id: "amazon",
          name: "Amazon",
          logo: "/images/platforms/amazon.png",
          connected: true,
          lastSynced: "2025-05-22T15:45:00",
          status: "active",
          metrics: {
            orders: 312,
            revenue: 95400,
            products: 187,
          },
        },
        {
          id: "ebay",
          name: "eBay",
          logo: "/images/platforms/ebay.png",
          connected: true,
          lastSynced: "2025-05-22T12:15:00",
          status: "active",
          metrics: {
            orders: 175,
            revenue: 31520,
            products: 143,
          },
        },
        {
          id: "etsy",
          name: "Etsy",
          logo: "/images/platforms/etsy.png",
          connected: false,
          lastSynced: null,
          status: "disconnected",
        },
        {
          id: "woocommerce",
          name: "WooCommerce",
          logo: "/images/platforms/woocommerce.png",
          connected: false,
          lastSynced: null,
          status: "disconnected",
        },
        {
          id: "bigcommerce",
          name: "BigCommerce",
          logo: "/images/platforms/bigcommerce.png",
          connected: false,
          lastSynced: null,
          status: "disconnected",
        },
        {
          id: "square",
          name: "Square",
          logo: "/images/platforms/square.png",
          connected: false,
          lastSynced: null,
          status: "disconnected",
        },
      ],
    },
  });

  useEffect(() => {
    // Fetch real data from Supabase
    const fetchEcommerceStats = async () => {
      setLoading(true);
      try {
        // Fetch orders data
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*");

        if (ordersError) throw ordersError;

        // Fetch products data
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*");

        if (productsError) throw productsError;

        // Fetch customers data
        const { data: customers, error: customersError } = await supabase
          .from("customers")
          .select("*");

        if (customersError) throw customersError;

        // Fetch platforms data
        const { data: platforms, error: platformsError } = await supabase
          .from("platforms")
          .select("*");

        if (platformsError) throw platformsError;

        // Process orders data for charts
        const ordersByDate = orders ? processOrdersByDate(orders) : [];
        setOrderData(ordersByDate);

        // Process revenue data for charts
        const revenueByDate = orders ? processRevenueByDate(orders) : [];
        setRevenueData(revenueByDate);

        // Process category data for charts
        const categoryCounts = products ? processCategoryData(products) : [];
        setCategoryData(categoryCounts);

        // Get recent orders
        const recent = orders ? getRecentOrders(orders, customers) : [];
        setRecentOrders(recent);

        // Update stats object with all the data
        const updatedStats = calculateStats(
          orders,
          products,
          customers,
          platforms
        );
        setStats(updatedStats);

        console.log("Fetched and processed all data from Supabase");
      } catch (error) {
        console.error("Error fetching ecommerce stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // Data processing helper functions
    const processOrdersByDate = (orders: any[]) => {
      const last7Days = getLast7Days();
      const ordersByDate = last7Days.map((date) => {
        const dayOrders = orders.filter(
          (order) =>
            new Date(order.created_at).toISOString().split("T")[0] === date
        );
        return {
          date,
          orders: dayOrders.length,
        };
      });
      return ordersByDate;
    };

    const processRevenueByDate = (orders: any[]) => {
      const last7Days = getLast7Days();
      const revenueByDate = last7Days.map((date) => {
        const dayOrders = orders.filter(
          (order) =>
            new Date(order.created_at).toISOString().split("T")[0] === date
        );
        const dayRevenue = dayOrders.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        );
        return {
          date,
          revenue: dayRevenue,
        };
      });
      return revenueByDate;
    };

    const processCategoryData = (products: any[]) => {
      const categories: Record<string, number> = {};

      products.forEach((product) => {
        const category = product.category || "Uncategorized";
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category]++;
      });

      return Object.entries(categories).map(([name, count]) => ({
        name,
        value: Math.round((count / products.length) * 100),
      }));
    };

    const getRecentOrders = (orders: any[], customers: any[]) => {
      // Get last 5 orders
      const sortedOrders = [...orders]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      return sortedOrders.map((order) => {
        const customer = customers.find((c) => c.id === order.customer_id) || {
          name: "Unknown Customer",
        };
        return {
          id: order.id,
          customer: customer.name,
          date: new Date(order.created_at).toISOString().split("T")[0],
          amount: order.total_amount || 0,
          status: order.status || "processing",
        };
      });
    };

    const calculateStats = (
      orders: any[],
      products: any[],
      customers: any[],
      platforms: any[]
    ) => {
      // If data doesn't exist yet, provide reasonable defaults
      if (!orders || !products || !customers || !platforms) {
        return { ...stats };
      }

      const today = new Date().toISOString().split("T")[0];
      const ordersToday = orders.filter(
        (order) =>
          new Date(order.created_at).toISOString().split("T")[0] === today
      ).length;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const ordersYesterday = orders.filter(
        (order) =>
          new Date(order.created_at).toISOString().split("T")[0] ===
          yesterdayStr
      ).length;

      const ordersTrend =
        ordersYesterday > 0
          ? Math.round(
              ((ordersToday - ordersYesterday) / ordersYesterday) * 100
            )
          : 100;

      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const revenueToday = orders
        .filter(
          (order) =>
            new Date(order.created_at).toISOString().split("T")[0] === today
        )
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const revenueYesterday = orders
        .filter(
          (order) =>
            new Date(order.created_at).toISOString().split("T")[0] ===
            yesterdayStr
        )
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const revenueTrend =
        revenueYesterday > 0
          ? Math.round(
              ((revenueToday - revenueYesterday) / revenueYesterday) * 100
            )
          : 100;

      const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
      const lowStock = products.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= 10
      ).length;

      const ordersByStatus = orders.reduce(
        (acc: Record<string, number>, order) => {
          const status = order.status || "processing";
          if (!acc[status]) acc[status] = 0;
          acc[status]++;
          return acc;
        },
        {}
      );

      const connectedPlatforms = platforms.filter((p) => p.connected).length;

      return {
        orders: {
          total: orders.length,
          today: ordersToday,
          trend: ordersTrend,
          byStatus: {
            processing: ordersByStatus.processing || 0,
            shipped: ordersByStatus.shipped || 0,
            completed: ordersByStatus.completed || 0,
            cancelled: ordersByStatus.cancelled || 0,
          },
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          trend: revenueTrend,
        },
        products: {
          total: products.length,
          outOfStock: outOfStock,
          lowStock: lowStock,
        },
        customers: {
          total: customers.length,
          new: customers.filter((c) => {
            const createdDate = new Date(c.created_at)
              .toISOString()
              .split("T")[0];
            return createdDate === today;
          }).length,
          returning:
            customers.length -
            customers.filter((c) => {
              const createdDate = new Date(c.created_at)
                .toISOString()
                .split("T")[0];
              return createdDate === today;
            }).length,
        },
        stores: {
          total: platforms.length,
          active: platforms.filter((p) => p.status === "active").length,
        },
        promotions: {
          active: 0, // Default if no promotions table exists yet
          scheduled: 0,
        },
        platforms: {
          connected: connectedPlatforms,
          total: platforms.length,
          list: platforms.map((platform) => ({
            id: platform.id,
            name: platform.name,
            logo: platform.logo || "/images/platforms/default.png",
            connected: platform.connected,
            lastSynced: platform.last_synced,
            status: platform.status || "disconnected",
            metrics: platform.metrics
              ? {
                  orders: platform.metrics.orders || 0,
                  revenue: platform.metrics.revenue || 0,
                  products: platform.metrics.products || 0,
                }
              : undefined,
          })),
        },
      };
    };

    const getLast7Days = () => {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
      return dates;
    };

    // Fetch data initially
    fetchEcommerceStats();

    // Set up polling for live updates
    const intervalId = setInterval(fetchEcommerceStats, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  const handleConnectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    setConnectionDialog(true);
  };

  const handleSyncPlatform = (platformId: string) => {
    // Find platform in state
    const platformsCopy = [...stats.platforms.list];
    const platformIndex = platformsCopy.findIndex((p) => p.id === platformId);

    if (platformIndex !== -1) {
      // Set status to syncing
      platformsCopy[platformIndex].status = "syncing";
      setStats({
        ...stats,
        platforms: {
          ...stats.platforms,
          list: platformsCopy,
        },
      });

      // Simulate syncing
      setTimeout(() => {
        platformsCopy[platformIndex].status = "active";
        platformsCopy[platformIndex].lastSynced = new Date().toISOString();
        setStats({
          ...stats,
          platforms: {
            ...stats.platforms,
            list: platformsCopy,
          },
        });
      }, 2000);
    }
  };

  const handleSubmitConnection = () => {
    // Show connecting state
    setConnecting(true);

    // Simulate connection
    setTimeout(() => {
      // Update platform to connected state
      const platformsCopy = [...stats.platforms.list];
      const platformIndex = platformsCopy.findIndex(
        (p) => p.id === selectedPlatform
      );

      if (platformIndex !== -1) {
        platformsCopy[platformIndex].connected = true;
        platformsCopy[platformIndex].status = "active";
        platformsCopy[platformIndex].lastSynced = new Date().toISOString();
        platformsCopy[platformIndex].metrics = {
          orders: Math.floor(Math.random() * 200) + 50,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          products: Math.floor(Math.random() * 150) + 30,
        };

        setStats({
          ...stats,
          platforms: {
            connected: stats.platforms.connected + 1,
            total: stats.platforms.total,
            list: platformsCopy,
          },
        });
      }

      // Reset state
      setConnecting(false);
      setConnectionDialog(false);
    }, 2000);
  };

  const handleDisconnectPlatform = (platformId: string) => {
    // Find platform in state
    const platformsCopy = [...stats.platforms.list];
    const platformIndex = platformsCopy.findIndex((p) => p.id === platformId);

    if (platformIndex !== -1 && platformsCopy[platformIndex].connected) {
      // Update platform to disconnected state
      platformsCopy[platformIndex].connected = false;
      platformsCopy[platformIndex].status = "disconnected";
      platformsCopy[platformIndex].lastSynced = null;
      delete platformsCopy[platformIndex].metrics;

      setStats({
        ...stats,
        platforms: {
          connected: stats.platforms.connected - 1,
          total: stats.platforms.total,
          list: platformsCopy,
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPlatformStatusColor = (
    status: "active" | "error" | "syncing" | "disconnected"
  ) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 text-[#00C49F]";
      case "error":
        return "bg-red-100 text-red-700";
      case "syncing":
        return "bg-[#8763FF]/20 text-[#8763FF]";
      case "disconnected":
        return "bg-gray-100 text-gray-500";
    }
  };

  const getPlatformStatusText = (
    status: "active" | "error" | "syncing" | "disconnected"
  ) => {
    switch (status) {
      case "active":
        return "Connected";
      case "error":
        return "Error";
      case "syncing":
        return "Syncing...";
      case "disconnected":
        return "Disconnected";
    }
  };

  const getPlatformStatusIcon = (
    status: "active" | "error" | "syncing" | "disconnected"
  ) => {
    switch (status) {
      case "active":
        return <Check className="h-3.5 w-3.5 mr-1" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "syncing":
        return <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />;
      case "disconnected":
        return <LinkIcon className="h-3.5 w-3.5 mr-1" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
          Ecommerce Dashboard
        </h1>
        <div className="flex items-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 mr-2">
            Live Data
          </Badge>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    {stats.orders.total.toLocaleString()}
                  </h3>
                  <Badge className="ml-2 bg-green-50 text-green-700 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {stats.orders.trend}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats.orders.today} today
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#3456FF]/20 to-[#8763FF]/20 rounded-lg flex items-center justify-center text-[#3456FF]">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    £
                    {stats.revenue.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h3>
                  <Badge className="ml-2 bg-green-50 text-green-700 flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {stats.revenue.trend}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  +£
                  {stats.revenue.today.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  today
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 rounded-lg flex items-center justify-center text-[#00C49F]">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Products
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.products.total}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.products.outOfStock} out of stock
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#FFBB28]/20 to-[#FF8042]/20 rounded-lg flex items-center justify-center text-[#FFBB28]">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Customers
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    {stats.customers.total}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats.customers.new} new today
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#8763FF]/20 to-[#3456FF]/20 rounded-lg flex items-center justify-center text-[#8763FF]">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
            <CardDescription>Daily orders for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3456FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8763FF"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Categories and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <RefreshCw className="h-8 w-8 text-[#3456FF] animate-spin" />
                </div>
              ) : categoryData.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="text-gray-400 mb-2">
                    <Package className="h-12 w-12" />
                  </div>
                  <p className="text-gray-500 text-center">
                    No product categories available
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Add products with categories to see distribution
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({
                        name,
                        percent,
                      }: {
                        name: string;
                        percent: number;
                      }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 text-[#3456FF] animate-spin" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent orders found</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3456FF]/20 to-[#8763FF]/20 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-[#3456FF]" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {order.customer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="mt-1 text-sm font-medium">
                        £{order.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Performance</CardTitle>
            <CardDescription>Metrics across all stores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Stores Online</span>
                  <span className="text-sm text-gray-500">
                    {stats.stores.active}/{stats.stores.total}
                  </span>
                </div>
                <Progress
                  value={(stats.stores.active / stats.stores.total) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Active Promotions</span>
                  <span className="text-sm text-gray-500">
                    {stats.promotions.active}
                  </span>
                </div>
                <Progress value={70} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Inventory Health</span>
                  <span className="text-sm text-gray-500">
                    {stats.products.total -
                      stats.products.outOfStock -
                      stats.products.lowStock}
                    /{stats.products.total}
                  </span>
                </div>
                <Progress
                  value={
                    ((stats.products.total -
                      stats.products.outOfStock -
                      stats.products.lowStock) /
                      stats.products.total) *
                    100
                  }
                  className="h-2"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs">Healthy</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
                    <span className="text-xs">Low Stock</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                    <span className="text-xs">Out of Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#3456FF]/10 to-[#5C4EFF]/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-5 w-5 text-[#3456FF]" />
                  <Badge
                    variant="outline"
                    className="bg-[#3456FF]/20 text-[#3456FF]"
                  >
                    Processing
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mt-2">
                  {stats.orders.byStatus.processing}
                </h3>
                <p className="text-sm text-gray-500">Orders</p>
              </div>

              <div className="bg-gradient-to-br from-[#8763FF]/10 to-[#5C4EFF]/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <Package className="h-5 w-5 text-[#8763FF]" />
                  <Badge
                    variant="outline"
                    className="bg-[#8763FF]/20 text-[#8763FF]"
                  >
                    Shipped
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mt-2">
                  {stats.orders.byStatus.shipped}
                </h3>
                <p className="text-sm text-gray-500">Orders</p>
              </div>

              <div className="bg-gradient-to-br from-[#00C49F]/10 to-[#5C4EFF]/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <Package className="h-5 w-5 text-[#00C49F]" />
                  <Badge
                    variant="outline"
                    className="bg-[#00C49F]/20 text-[#00C49F]"
                  >
                    Completed
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mt-2">
                  {stats.orders.byStatus.completed}
                </h3>
                <p className="text-sm text-gray-500">Orders</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    Cancelled
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mt-2">
                  {stats.orders.byStatus.cancelled}
                </h3>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-[#3456FF] h-full"
                    style={{
                      width: `${
                        (stats.orders.byStatus.processing /
                          stats.orders.total) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="bg-[#8763FF] h-full"
                    style={{
                      width: `${
                        (stats.orders.byStatus.shipped / stats.orders.total) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="bg-[#00C49F] h-full"
                    style={{
                      width: `${
                        (stats.orders.byStatus.completed / stats.orders.total) *
                        100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="bg-red-500 h-full"
                    style={{
                      width: `${
                        (stats.orders.byStatus.cancelled / stats.orders.total) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* E-commerce Platform Integration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>E-commerce Platforms</CardTitle>
              <CardDescription>
                Connect and manage your online selling channels
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 text-[#3456FF]"
            >
              {stats.platforms.connected}/{stats.platforms.total} Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connected" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="connected">Connected</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="all">All Platforms</TabsTrigger>
            </TabsList>

            <TabsContent value="connected" className="space-y-4">
              {stats.platforms.list.filter((platform) => platform.connected)
                .length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <LinkIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Connected Platforms
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Connect to your first e-commerce platform to start syncing
                    data
                  </p>
                  <Button
                    onClick={() => {}}
                    variant="outline"
                    className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Connect Platform
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.platforms.list
                    .filter((platform) => platform.connected)
                    .map((platform) => (
                      <Card
                        key={platform.id}
                        className="overflow-hidden border border-gray-200"
                      >
                        <CardContent className="p-0">
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                                  {/* Placeholder for actual logo */}
                                  <Store className="h-6 w-6 text-[#3456FF]" />
                                </div>
                                <div>
                                  <h3 className="font-medium">
                                    {platform.name}
                                  </h3>
                                  <Badge
                                    className={`${getPlatformStatusColor(
                                      platform.status
                                    )} flex items-center text-xs font-normal mt-0.5`}
                                  >
                                    {getPlatformStatusIcon(platform.status)}
                                    {getPlatformStatusText(platform.status)}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleSyncPlatform(platform.id)}
                                disabled={platform.status === "syncing"}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    platform.status === "syncing"
                                      ? "animate-spin text-[#8763FF]"
                                      : "text-gray-500"
                                  }`}
                                />
                              </Button>
                            </div>

                            {/* Platform metrics */}
                            {platform.metrics && (
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="text-center p-2 bg-[#3456FF]/5 rounded">
                                  <p className="text-xs text-gray-500 mb-1">
                                    Orders
                                  </p>
                                  <p className="font-medium">
                                    {platform.metrics.orders}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-[#8763FF]/5 rounded">
                                  <p className="text-xs text-gray-500 mb-1">
                                    Revenue
                                  </p>
                                  <p className="font-medium">
                                    £{platform.metrics.revenue.toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-[#00C49F]/5 rounded">
                                  <p className="text-xs text-gray-500 mb-1">
                                    Products
                                  </p>
                                  <p className="font-medium">
                                    {platform.metrics.products}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {platform.lastSynced ? (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last synced:{" "}
                                  {new Date(
                                    platform.lastSynced
                                  ).toLocaleString()}
                                </span>
                              ) : (
                                "Not synced yet"
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-gray-500 hover:text-red-600 text-xs p-0"
                              onClick={() =>
                                handleDisconnectPlatform(platform.id)
                              }
                            >
                              Disconnect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.platforms.list
                  .filter((platform) => !platform.connected)
                  .map((platform) => (
                    <Card
                      key={platform.id}
                      className="overflow-hidden border border-gray-200"
                    >
                      <CardContent className="p-0">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                                {/* Placeholder for actual logo */}
                                <Store className="h-6 w-6 text-gray-400" />
                              </div>
                              <div>
                                <h3 className="font-medium">{platform.name}</h3>
                                <p className="text-xs text-gray-500">
                                  Sell on {platform.name} marketplace
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                            onClick={() => handleConnectPlatform(platform.id)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.platforms.list.map((platform) => (
                  <Card
                    key={platform.id}
                    className="overflow-hidden border border-gray-200"
                  >
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                              {/* Placeholder for actual logo */}
                              <Store
                                className={`h-6 w-6 ${
                                  platform.connected
                                    ? "text-[#3456FF]"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{platform.name}</h3>
                              <Badge
                                className={`${getPlatformStatusColor(
                                  platform.status
                                )} flex items-center text-xs font-normal mt-0.5`}
                              >
                                {getPlatformStatusIcon(platform.status)}
                                {getPlatformStatusText(platform.status)}
                              </Badge>
                            </div>
                          </div>
                          {platform.connected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSyncPlatform(platform.id)}
                              disabled={platform.status === "syncing"}
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${
                                  platform.status === "syncing"
                                    ? "animate-spin text-[#8763FF]"
                                    : "text-gray-500"
                                }`}
                              />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {platform.connected ? (
                            platform.lastSynced ? (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Last synced:{" "}
                                {new Date(platform.lastSynced).toLocaleString()}
                              </span>
                            ) : (
                              "Not synced yet"
                            )
                          ) : (
                            ""
                          )}
                        </div>
                        {platform.connected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-gray-500 hover:text-red-600 text-xs p-0"
                            onClick={() =>
                              handleDisconnectPlatform(platform.id)
                            }
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                            onClick={() => handleConnectPlatform(platform.id)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={connectionDialog} onOpenChange={setConnectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Connect to{" "}
              {selectedPlatform &&
                stats.platforms.list.find((p) => p.id === selectedPlatform)
                  ?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect your store
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" placeholder="Enter your API key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                placeholder="Enter your API secret"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input
                id="storeUrl"
                placeholder="https://your-store.example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="syncProducts" />
              <Label htmlFor="syncProducts">Sync products automatically</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="syncOrders" defaultChecked />
              <Label htmlFor="syncOrders">Sync orders automatically</Label>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setConnectionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitConnection}
              disabled={connecting}
              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
            >
              {connecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
