// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  TruckIcon,
  BoxIcon,
  BarChart3Icon,
  Users2Icon,
  LayoutDashboard,
  LockIcon,
  BarChart,
  Zap,
  Shield,
  Globe,
  Database,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Initialize Supabase client
const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";
const supabase = createClient(supabaseUrl, supabaseKey);

// Animated gradient background component - optimized for performance
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-slate-50 to-white">
      {/* Reduced number of blobs and simplified animations */}
      <div
        className="absolute top-0 left-0 -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-blue-500/20 to-violet-500/10 blur-[60px] animate-blob"
        style={{ animationDuration: "20s" }}
      />
      <div
        className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-500/15 to-pink-500/10 blur-[60px] animate-blob-slow"
        style={{ animationDuration: "25s" }}
      />

      {/* Reduced number of particles */}
      <div className="absolute inset-0 -z-5 opacity-20">
        <div
          className="absolute top-[10%] left-[15%] h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"
          style={{ animationDuration: "3s", animationDelay: "0.5s" }}
        />
        <div
          className="absolute top-[65%] left-[30%] h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-[80%] left-[70%] h-1 w-1 rounded-full bg-pink-500 animate-ping"
          style={{ animationDuration: "4.5s", animationDelay: "2.5s" }}
        />
      </div>

      {/* Simplified light beam */}
      <div className="absolute inset-0 -z-5 overflow-hidden opacity-5">
        <div className="absolute top-0 left-1/4 h-[800px] w-[150px] bg-gradient-to-b from-blue-500 via-transparent to-transparent rotate-[30deg]" />
      </div>

      {/* Glass effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-white/80 to-transparent"></div>
    </div>
  </div>
);

// Animated number component that counts up
const CountUpNumber = ({ value, label }: { value: number; label: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1000; // in ms
    const interval = duration / value;
    let timer: NodeJS.Timeout;
    let currentCount = 0;

    const step = () => {
      currentCount += 1;
      setCount(currentCount);

      if (currentCount < value) {
        timer = setTimeout(step, interval);
      }
    };

    setTimeout(() => step(), 300); // Delay start

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-blue-600">{count}+</span>
      <span className="text-sm text-gray-500 mt-1">{label}</span>
    </div>
  );
};

// Modern feature card with hover effects and gradients
const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{
      scale: 1.03,
      boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.15)",
    }}
    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 p-6 relative overflow-hidden group"
  >
    <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/20 rounded-full group-hover:scale-[10] transition-all duration-700" />
    <div className="relative z-10">
      <div className="flex items-center mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-4 text-white shadow-lg shadow-blue-500/20">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h3>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    email: "",
    password: "",
  });
  const [courierFormData, setCourierFormData] = useState({
    email: "",
    password: "",
  });
  const [customerFormData, setCustomerFormData] = useState({
    email: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState("client");
  const [autoFillAnimation, setAutoFillAnimation] = useState(false);
  const [showPassword, setShowPassword] = useState({
    client: false,
    customer: false,
    courier: false,
  });
  const [clientError, setClientError] = useState("");
  const [courierError, setCourierError] = useState("");
  const [customerError, setCustomerError] = useState("");

  // Add this useEffect to clear form data on page load/refresh
  useEffect(() => {
    // Clear all form data
    setClientFormData({ email: "", password: "" });
    setCourierFormData({ email: "", password: "" });
    setCustomerFormData({ email: "", password: "" });

    // Clear all errors
    setClientError("");
    setCourierError("");
    setCustomerError("");

    // Reset password visibility
    setShowPassword({
      client: false,
      customer: false,
      courier: false,
    });

    // Reset loading and success states
    setIsLoading(false);
    setLoginSuccess(false);
  }, []); // Empty dependency array means this runs once on mount

  // Pre-load dashboard components to reduce loading time after login
  useEffect(() => {
    // Prefetch the dashboard route
    router.prefetch("/dashboard");
    router.prefetch("/courier");
    router.prefetch("/customer");
  }, [router]);

  // Auto-filling animation for demo purposes
  const triggerAutoFill = () => {
    setAutoFillAnimation(true);
    setTimeout(() => {
      if (activeTab === "client") {
        setClientFormData({
          email: "demo@omnideploy.ai",
          password: "AIpowered2023",
        });
      } else if (activeTab === "courier") {
        setCourierFormData({
          email: "driver@omnideploy.ai",
          password: "AIpowered2023",
        });
      } else {
        setCustomerFormData({
          email: "customer@omnideploy.ai",
          password: "AIpowered2023",
        });
      }
    }, 600);

    setTimeout(() => {
      setAutoFillAnimation(false);
    }, 2000);
  };

  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setClientError(""); // Clear previous error

    try {
      // Block courier-only users from signing in as organization (role separation)
      const { data: courierOnly } = await supabase
        .from("couriers")
        .select("id")
        .eq("email", clientFormData.email)
        .single();

      const { data: orgUser } = await supabase
        .from("clients")
        .select("id")
        .eq("email", clientFormData.email)
        .single();

      if (courierOnly && !orgUser) {
        setClientError("This email is registered as a courier. Please use the Courier tab to sign in.");
        setIsLoading(false);
        return;
      }

      const { data: client, error } = await supabase
        .from("clients")
        .select("id, email, company, status")
        .eq("email", clientFormData.email)
        .eq("password", clientFormData.password)
        .single();

      if (error || !client) {
        setClientError("Incorrect email or password. Please try again.");
        return;
      }

      if (client.status !== "active") {
        setClientError("Account is not active. Please contact support.");
        return;
      }

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: client.id,
          email: client.email,
          company: client.company,
          type: "client",
        })
      );

      setLoginSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Sign in error:", error);
      setClientError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourierSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCourierError(""); // Clear previous error

    try {
      // Block organization users from signing in as courier (role separation)
      const { data: orgUser } = await supabase
        .from("clients")
        .select("id")
        .eq("email", courierFormData.email)
        .single();

      if (orgUser) {
        setCourierError("This email is registered as an organization. Please use the Organization tab to sign in.");
        setIsLoading(false);
        return;
      }

      const { data: courier, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("email", courierFormData.email)
        .eq("password", courierFormData.password)
        .single();

      if (error || !courier) {
        setCourierError("Incorrect email or password. Please try again.");
        return;
      }

      if (courier.status !== "active") {
        setCourierError("Account is not active. Please contact support.");
        return;
      }

      // Store courier data in localStorage
      localStorage.setItem("currentCourier", JSON.stringify(courier));
      setLoginSuccess(true);
      setTimeout(() => {
        router.push("/courier");
      }, 500);
    } catch (error) {
      console.error("Sign in error:", error);
      setCourierError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCustomerError(""); // Clear previous error

    try {
      const { data: customer, error } = await supabase
        .from("customers")
        .select("*")
        .eq("email", customerFormData.email)
        .single();

      if (error || !customer) {
        setCustomerError("Incorrect email or password. Please try again.");
        return;
      }

      if (customer.password !== customerFormData.password) {
        setCustomerError("Incorrect password. Please try again.");
        return;
      }

      // Store customer data in localStorage
      localStorage.setItem("currentCustomer", JSON.stringify(customer));
      setLoginSuccess(true);
      setTimeout(() => {
        router.push("/customer");
      }, 500);
    } catch (error) {
      console.error("Sign in error:", error);
      setCustomerError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      const data = await response.json();
      if (data && data[0]) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Add full-page loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-blue-600 animate-spin"></div>
        <p className="text-lg font-medium text-gray-700">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Show loading overlay when redirect is happening */}
      {loginSuccess && <LoadingOverlay />}

      {/* Animated background */}
      <AnimatedBackground />

      {/* Header */}
      {/* <header className="w-full flex items-center justify-between px-4 md:px-8 py-4 backdrop-blur-md bg-white/60 sticky top-0 z-50 border-b border-white/20">
        <div className="flex items-center gap-2"></div>
        <nav className="hidden md:flex gap-6 items-center text-gray-600 text-sm">
          <Link
            href="#features"
            className="hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            Features
          </Link>
          <Link
            href="#pricing"
            className="hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            <Database className="h-3.5 w-3.5 text-blue-500" />
            Solutions
          </Link>
          <Link
            href="#support"
            className="hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            <Globe className="h-3.5 w-3.5 text-green-500" />
            Enterprise
          </Link>
          <Button className="ml-4 relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md shadow-blue-500/20">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">Request Demo</span>
          </Button>
        </nav>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden border border-gray-200"
        >
          Menu
        </Button>
      </header> */}
      <Header />
      <main className="flex-1 flex mt-32 flex-col lg:flex-row items-start lg:items-center justify-center gap-6 sm:gap-8 lg:gap-12 xl:gap-16 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 overflow-x-hidden">
        {/* Login Card - Left Side */}
        <div className="w-full max-w-[420px] z-10 order-2 lg:order-1 mt-10 lg:mt-0 mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative card accent */}
            <div className="absolute -left-6 -top-6 w-12 h-12 bg-blue-500/10 rounded-full hidden sm:block"></div>
            <div className="absolute -right-6 -bottom-6 w-12 h-12 bg-indigo-500/10 rounded-full hidden sm:block"></div>

            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-xl overflow-hidden w-full">
              <CardHeader className="pb-2 text-center relative">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-indigo-500/40 animate-pulse"
                    style={{ animationDuration: "3s" }}
                  ></div>
                  <Warehouse className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-800 to-gray-600 font-sans">
                  AI-Powered Logistics Platform
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1 text-sm sm:text-base">
                  Sign in to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-3">
                <Tabs
                  defaultValue="client"
                  className="w-full"
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-5 bg-gray-50/80 rounded-xl overflow-hidden p-1 border border-gray-100 backdrop-blur-sm">
                    <TabsTrigger
                      value="client"
                      className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-indigo-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-medium"
                    >
                      Organization
                    </TabsTrigger>
                    <TabsTrigger
                      value="customer"
                      className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:via-pink-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-medium"
                    >
                      Customer
                    </TabsTrigger>
                    <TabsTrigger
                      value="courier"
                      className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:via-teal-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-medium"
                    >
                      Courier
                    </TabsTrigger>
                  </TabsList>

                  {/* Organization Tab */}
                  <TabsContent value="client">
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-lg text-blue-700 text-xs sm:text-sm flex items-start gap-2 sm:gap-3 backdrop-blur-sm">
                      <div className="mt-0.5 bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2 rounded-lg text-white shadow-md shadow-blue-500/10 flex-shrink-0">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-0.5 sm:mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                          Organization Portal
                        </div>
                        <div className="text-xs text-blue-600">
                          Access your organization's logistics dashboard with AI
                          insights
                        </div>
                      </div>
                    </div>

                    {clientError && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-shake">
                        <div className="flex items-center gap-2 text-red-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium text-sm">
                            {clientError}
                          </span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleClientSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="client-email"
                          className="text-xs sm:text-sm font-medium flex items-center justify-between"
                        >
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-500">
                            Email
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-email"
                            type="email"
                            placeholder="your@company.com"
                            value={clientFormData.email || ""}
                            onChange={(e) =>
                              setClientFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-blue-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="client-password"
                          className="text-xs sm:text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-500"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="client-password"
                            type={showPassword.client ? "text" : "password"}
                            placeholder="••••••••"
                            value={clientFormData.password || ""}
                            onChange={(e) =>
                              setClientFormData((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-blue-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                client: !prev.client,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                            aria-label={
                              showPassword.client
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword.client ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-medium py-2 sm:py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all text-sm"
                        disabled={isLoading || loginSuccess}
                      >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {isLoading ? (
                          <span className="flex items-center gap-2 relative z-10">
                            <svg
                              className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Authenticating...
                          </span>
                        ) : loginSuccess ? (
                          <span className="flex items-center justify-center gap-2 relative z-10">
                            <svg
                              className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Success!
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2 relative z-10">
                            Sign In{" "}
                            <ArrowRight
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse"
                              style={{ animationDuration: "2s" }}
                            />
                          </span>
                        )}
                      </Button>
                    </form>
                    <div className="mt-3 text-center text-xs sm:text-sm text-gray-500">
                      <div className="flex flex-col gap-2">
                        <a
                          href="#"
                          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:underline flex items-center justify-center gap-1.5 group"
                        >
                          <span>Forgot password?</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 transform group-hover:translate-x-1 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="text-gray-600">
                          Don't have an account?{" "}
                          <Link
                            href="/auth/signup?type=client"
                            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:underline font-medium"
                          >
                            Create one
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Customer Tab */}
                  <TabsContent value="customer">
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-100 rounded-lg text-purple-700 text-xs sm:text-sm flex items-start gap-2 sm:gap-3 backdrop-blur-sm">
                      <div className="mt-0.5 bg-gradient-to-br from-purple-500 to-pink-600 p-1.5 sm:p-2 rounded-lg text-white shadow-md shadow-purple-500/10">
                        <Users2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-0.5 sm:mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700">
                          Customer Portal
                        </div>
                        <div className="text-xs text-purple-600">
                          Track your orders and manage your shipments
                        </div>
                      </div>
                    </div>

                    {customerError && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-shake">
                        <div className="flex items-center gap-2 text-red-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium text-sm">
                            {customerError}
                          </span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleCustomerSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="customer-email"
                          className="text-xs sm:text-sm font-medium flex items-center justify-between"
                        >
                          Email
                        </Label>
                        <div className="relative">
                          <Input
                            id="customer-email"
                            type="email"
                            placeholder="your@email.com"
                            value={customerFormData.email || ""}
                            onChange={(e) =>
                              setCustomerFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 rounded-lg focus:ring-2 focus:ring-purple-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-purple-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="customer-password"
                          className="text-xs sm:text-sm font-medium"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="customer-password"
                            type={showPassword.customer ? "text" : "password"}
                            placeholder="••••••••"
                            value={customerFormData.password || ""}
                            onChange={(e) =>
                              setCustomerFormData((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-purple-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-purple-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                customer: !prev.customer,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                            aria-label={
                              showPassword.customer
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword.customer ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 rounded-lg shadow-md shadow-purple-500/20 transition-all"
                        disabled={isLoading || loginSuccess}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Authenticating...
                          </span>
                        ) : loginSuccess ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Success!
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Sign In <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-gray-500">
                      <div className="flex flex-col gap-2">
                        <a
                          href="#"
                          className="text-purple-600 hover:underline flex items-center justify-center gap-1.5 group"
                        >
                          <span>Forgot password?</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="text-gray-600">
                          Don't have an account?{" "}
                          <Link
                            href="/auth/signup?type=customer"
                            className="text-purple-600 hover:underline font-medium"
                          >
                            Create one
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Courier Tab */}
                  <TabsContent value="courier">
                    <div className="mb-4 p-3 bg-gradient-to-r from-green-50/50 to-teal-50/50 border border-green-100 rounded-lg text-green-700 text-xs sm:text-sm flex items-start gap-2 sm:gap-3 backdrop-blur-sm">
                      <div className="mt-0.5 bg-gradient-to-br from-green-500 to-teal-600 p-1.5 sm:p-2 rounded-lg text-white shadow-md shadow-green-500/10">
                        <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-0.5 sm:mb-1 text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-teal-700">
                          Courier Portal
                        </div>
                        <div className="text-xs text-green-600">
                          Manage deliveries with AI-optimized routes
                        </div>
                      </div>
                    </div>

                    {courierError && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-shake">
                        <div className="flex items-center gap-2 text-red-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium text-sm">
                            {courierError}
                          </span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleCourierSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="courier-email"
                          className="text-xs sm:text-sm font-medium flex items-center justify-between"
                        >
                          Email
                        </Label>
                        <div className="relative">
                          <Input
                            id="courier-email"
                            type="email"
                            placeholder="your@email.com"
                            value={courierFormData.email || ""}
                            onChange={(e) =>
                              setCourierFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 rounded-lg focus:ring-2 focus:ring-green-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-green-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="courier-password"
                          className="text-xs sm:text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-500"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="courier-password"
                            type={showPassword.courier ? "text" : "password"}
                            placeholder="••••••••"
                            value={courierFormData.password || ""}
                            onChange={(e) =>
                              setCourierFormData((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            required
                            className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-green-500/20 transition-all text-sm ${
                              autoFillAnimation
                                ? "animate-pulse bg-green-50"
                                : ""
                            }`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                courier: !prev.courier,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
                            aria-label={
                              showPassword.courier
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword.courier ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium py-2.5 rounded-lg shadow-md shadow-green-500/20 transition-all"
                        disabled={isLoading || loginSuccess}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Authenticating...
                          </span>
                        ) : loginSuccess ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Success!
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Sign In <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-gray-500">
                      <div className="flex flex-col gap-2">
                        <a
                          href="#"
                          className="text-green-600 hover:underline flex items-center justify-center gap-1.5 group"
                        >
                          <span>Forgot password?</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="text-gray-600">
                          Don't have an account?{" "}
                          <Link
                            href="/auth/signup?type=courier"
                            className="text-green-600 hover:underline font-medium"
                          >
                            Create one
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="px-4 sm:px-6 py-3 bg-gray-50/50 border-t border-gray-100 rounded-b-lg">
                <div className="w-full flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span>
                    Protected by enterprise-grade security and AI threat
                    detection
                  </span>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        {/* Right Side - Features content */}
        <div className="flex-1 flex flex-col items-center lg:items-start justify-center w-full max-w-xl lg:max-w-2xl order-1 lg:order-2 mb-6 lg:mb-0 mx-auto lg:mx-0">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full text-center lg:text-left mb-6 sm:mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-[#3456FF] via-[#8763FF] to-[#FF3456] bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight tracking-tight">
              Next-Gen
              <br className="hidden sm:block" /> Logistics
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 lg:pr-8 leading-relaxed">
              Streamline operations, boost productivity, and gain real-time
              visibility with predictive analytics and AI-optimized routes.
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/50 p-4 sm:p-5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/20 rounded-full group-hover:scale-[10] transition-all duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 text-white shadow-lg shadow-blue-500/20">
                      <BarChart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      AI-Powered Analytics
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    Predictive analytics and real-time dashboards with
                    actionable insights for your logistics operations.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/50 p-4 sm:p-5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/20 rounded-full group-hover:scale-[10] transition-all duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 text-white shadow-lg shadow-blue-500/20">
                      <Warehouse className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Smart Inventory
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    Automated inventory optimization with AI demand forecasting
                    and smart replenishment.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/50 p-4 sm:p-5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/20 rounded-full group-hover:scale-[10] transition-all duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 text-white shadow-lg shadow-blue-500/20">
                      <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Intelligent Routing
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    Machine learning algorithms optimize delivery routes in
                    real-time saving time and fuel.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/50 p-4 sm:p-5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/20 rounded-full group-hover:scale-[10] transition-all duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 text-white shadow-lg shadow-blue-500/20">
                      <LockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Advanced Security
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    Enterprise-grade security with AI-powered threat detection
                    and prevention systems.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-md border border-gray-100/50 mb-6 sm:mb-8 relative overflow-hidden"
          >
            <div className="text-center mb-2 sm:mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                TRUSTED GLOBALLY
              </span>
            </div>
            <div className="flex justify-around gap-2 sm:gap-4">
              <div className="text-center px-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  500+
                </div>
                <div className="text-xs text-gray-500">Enterprise Clients</div>
              </div>
              <div className="text-center px-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  99.9%
                </div>
                <div className="text-xs text-gray-500">Uptime Percentage</div>
              </div>
              <div className="text-center px-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  24/7
                </div>
                <div className="text-xs text-gray-500">Expert Support</div>
              </div>
            </div>
          </motion.div>

          {/* Tech Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2"
          >
            <div className="bg-yellow-500/10 px-2 py-1 sm:py-1.5 rounded-full text-xs font-medium text-yellow-700 flex items-center gap-1 border border-yellow-400/30">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>AI-Powered Routing</span>
            </div>
            <div className="bg-blue-500/10 px-2 py-1 sm:py-1.5 rounded-full text-xs font-medium text-blue-700 flex items-center gap-1 border border-blue-400/30">
              <Globe className="h-3 w-3 text-blue-500" />
              <span>Global Coverage</span>
            </div>
            <div className="bg-green-500/10 px-2 py-1 sm:py-1.5 rounded-full text-xs font-medium text-green-700 flex items-center gap-1 border border-green-400/30">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Enterprise Security</span>
            </div>
            <div className="bg-indigo-500/10 px-2 py-1 sm:py-1.5 rounded-full text-xs font-medium text-indigo-700 flex items-center gap-1 border border-indigo-400/30">
              <CheckCircle className="h-3 w-3 text-indigo-500" />
              <span>ISO 27001 Certified</span>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      {/* Footer */}
      {/* <footer className="w-full bg-white/80 backdrop-blur-md border-t border-gray-100 py-8 relative z-10 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md"></div>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"></span>
            </div>

            <div className="flex gap-8">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-colors relative group"
              >
                Privacy Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-colors relative group"
              >
                Terms of Service
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-colors relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>

            <div className="text-sm text-gray-500 flex items-center gap-1">
              <span>© 2023</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-medium"></span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
