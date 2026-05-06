// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  Settings,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Users,
  FileBarChart,
  ArrowLeftRight,
  LogOut,
  User,
  ShoppingCart,
  Store,
  Tag,
  Receipt,
  Car,
  BarChart3,
  Layers,
  Barcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearAllRoleStorage } from "@/lib/auth/role-guard";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface NavItem {
  label: string;
  icon: any;
  href: string;
  active: boolean;
  shortcut?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function Logo() {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    // Load custom logo from localStorage if available
    const savedLogo = localStorage.getItem("customLogo");
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, []);

  if (customLogo) {
    return (
      <div className="flex items-center justify-center p-2">
        <img
          src={customLogo}
          alt="Company Logo"
          className="max-h-12 w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <h2 className="text-xl font-heading font-bold tracking-wide bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
        OmniDeploy
      </h2>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = () => {
    clearAllRoleStorage();
    localStorage.removeItem("customLogo");
    sessionStorage.clear();
    router.push("/auth/login");
  };

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node) &&
        isMobileOpen
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen]);

  // Navigation sections with organized menu items
  const navSections: NavSection[] = [
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          active: pathname === "/dashboard",
          shortcut: "Ctrl+D",
        },
        {
          label: "Live Tracking",
          icon: MapPin,
          href: "/dashboard/live-tracking",
          active: pathname === "/dashboard/live-tracking",
          shortcut: "Ctrl+L",
        },
      ],
    },
    {
      title: "WAREHOUSE",
      items: [
        {
          label: "Inventories",
          icon: Package,
          href: "/dashboard/inventories",
          active: pathname === "/dashboard/inventories",
          shortcut: "Ctrl+I",
        },
        {
          label: "Barcode Scanner",
          icon: Barcode,
          href: "/dashboard/barcode-scanner",
          active: pathname === "/dashboard/barcode-scanner",
          shortcut: "Ctrl+B",
        },
        {
          label: "Warehouses",
          icon: Warehouse,
          href: "/dashboard/warehouses",
          active: pathname === "/dashboard/warehouses",
          shortcut: "Ctrl+W",
        },
        {
          label: "Warehouse Operations",
          icon: ArrowLeftRight,
          href: "/dashboard/warehouse-operations",
          active: pathname === "/dashboard/warehouse-operations",
          shortcut: "Ctrl+O",
        },
        {
          label: "Warehouse Visualization",
          icon: BarChart3,
          href: "/dashboard/warehouse-visualization",
          active: pathname === "/dashboard/warehouse-visualization",
          shortcut: "Ctrl+V",
        },
        {
          label: "Pallet Mixer",
          icon: Layers,
          href: "/dashboard/pallet-mixer",
          active: pathname === "/dashboard/pallet-mixer",
          shortcut: "Ctrl+M",
        },
      ],
    },
    {
      title: "TRANSPORT",
      items: [
        {
          label: "Courier Management",
          icon: Truck,
          href: "/dashboard/couriers",
          active: pathname.includes("/dashboard/couriers"),
          shortcut: "Ctrl+C",
        },
        {
          label: "Fleet Management",
          icon: Car,
          href: "/dashboard/fleet",
          active: pathname.includes("/dashboard/fleet"),
          shortcut: "Ctrl+F",
        },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        {
          label: "Customers",
          icon: Users,
          href: "/dashboard/customers",
          active: pathname === "/dashboard/customers",
        },
        {
          label: "Customer Activity",
          icon: BarChart3,
          href: "/dashboard/customer-activity",
          active: pathname === "/dashboard/customer-activity",
          shortcut: "Ctrl+A",
        },
        {
          label: "Invoices",
          icon: Receipt,
          href: "/dashboard/invoices",
          active: pathname.includes("/dashboard/invoices"),
          shortcut: "Ctrl+I",
        },
        {
          label: "Reports",
          icon: FileBarChart,
          href: "/dashboard/reports",
          active: pathname === "/dashboard/reports",
        },
        {
          label: "Ecommerce",
          icon: ShoppingCart,
          href: "/dashboard/ecommerce",
          active: pathname.includes("/dashboard/ecommerce"),
          shortcut: "Ctrl+E",
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          label: "Settings",
          icon: Settings,
          href: "/dashboard/settings",
          active: pathname === "/dashboard/settings",
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <Logo />

      <div className="pt-2 pb-3 px-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#3456FF] to-[#8763FF] flex items-center justify-center text-white font-heading font-bold text-lg shadow-md overflow-hidden">
              <div className="absolute inset-0 bg-white/10 rounded-lg"></div>
              <span className="relative z-10">K</span>
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] mr-2 animate-pulse"></div>
                <p className="text-xs text-gray-500 tracking-wide">Online</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3"></div>

      <div className="space-y-4 py-2 flex-1 overflow-y-auto custom-scrollbar">
        {navSections.map((section, index) => (
          <div key={index} className="px-3 py-1">
            <h3 className="mb-2 px-3 text-xs font-heading font-bold tracking-wider flex items-center">
              <div className="w-1 h-4 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></div>
              <span className="bg-gradient-to-br from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                {section.title}
              </span>
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm group flex px-3 py-2.5 w-full justify-between items-center font-medium cursor-pointer rounded-lg transition-all duration-300 overflow-hidden relative",
                    item.active
                      ? "bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10 text-[#3456FF] shadow-sm"
                      : "text-gray-700 hover:bg-[#3456FF]/5"
                  )}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <div className="flex items-center z-10">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 mr-3 relative overflow-hidden",
                        item.active
                          ? "bg-gradient-to-br from-[#3456FF] to-[#8763FF] text-white shadow-md shadow-[#3456FF]/20"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gradient-to-br group-hover:from-[#3456FF]/80 group-hover:to-[#8763FF]/80 group-hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5 relative z-10" />
                    </div>
                    <span
                      className={cn(
                        "transition-colors font-medium tracking-wide",
                        item.active
                          ? "bg-gradient-to-r from-[#3456FF] via-[#5C4EFF] to-[#8763FF] bg-clip-text text-transparent font-semibold"
                          : "text-gray-700 group-hover:bg-gradient-to-r group-hover:from-[#3456FF] group-hover:to-[#8763FF] group-hover:bg-clip-text group-hover:text-transparent"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 z-10">
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-600 hover:bg-red-100 border-red-200 animate-pulse"
                      >
                        {item.badge}
                      </Badge>
                    )}

                    {item.shortcut && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-mono tracking-tighter transition-all duration-300",
                          item.active
                            ? "bg-[#3456FF]/10 text-[#3456FF]"
                            : "bg-gray-100 text-gray-500 group-hover:bg-[#3456FF]/10 group-hover:text-[#3456FF]"
                        )}
                      >
                        {item.shortcut}
                      </span>
                    )}

                    {item.active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3456FF] animate-pulse"></div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 text-center">
        <p className="text-xs text-gray-400">v1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          id="sidebar-toggle"
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-full shadow-md border-gray-200 bg-white"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Desktop sidebar with enhanced design */}
      <div
        className={cn(
          "hidden md:flex flex-col h-full border-r border-[#3456FF]/10 shadow-[5px_0_30px_-15px_rgba(0,0,0,0.1)]",
          "bg-white/90 backdrop-blur-sm relative overflow-hidden",
          className
        )}
      >
        {/* Modern dashboard-style background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3456FF10_1px,transparent_1px)] [background-size:20px_20px] opacity-25"></div>
        <div className="absolute top-0 left-0 right-0 h-[150px] bg-gradient-to-b from-[#3456FF]/5 to-transparent -z-10"></div>

        {/* Add floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-[#3456FF]/30 animate-float-slow"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Main content positioned above the background */}
        <div className="relative z-10 h-full">{sidebarContent}</div>
      </div>

      {/* Mobile sidebar - conditionally visible */}
      <div
        id="mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pt-16 h-full overflow-y-auto">{sidebarContent}</div>
      </div>
    </>
  );
}
