// @ts-nocheck
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  {
    href: "/customer",
    label: "Dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/customer/inventory",
    label: "Inventory",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    href: "/customer/orders",
    label: "Orders",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    href: "/customer/labels",
    label: "Labels",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 2v4h-2V4H9v2H7V2a2 2 0 012-2h6a2 2 0 012 2zm-1 7a3 3 0 00-3-3H7a3 3 0 00-3 3v11a2 2 0 002 2h12a2 2 0 002-2V9z"
        />
      </svg>
    ),
  },
  {
    href: "/customer/profile",
    label: "Profile",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    href: "/customer/barcode-scanner",
    label: "Barcode Scanner",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
        <path
          d="M7 7v10M10 7v10M14 7v10M17 7v10"
          strokeWidth="2"
          stroke="currentColor"
        />
      </svg>
    ),
  },
];

function ClientSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const customerStr = localStorage.getItem("currentCustomer");
    if (customerStr) setCustomer(JSON.parse(customerStr));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentCustomer");
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#3456FF]/10 flex flex-col justify-between">
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
            {customer?.name || "Customer Portal"}
          </h1>
          <p className="text-sm text-gray-500">Customer Portal</p>
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 text-sm bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10 hover:from-[#3456FF]/20 hover:to-[#8763FF]/20 text-[#3456FF] rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 p-3 rounded-lg text-gray-700 transition-all ${
                pathname === link.href
                  ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                  : "hover:bg-gradient-to-r hover:from-[#3456FF]/10 hover:to-[#8763FF]/10 hover:text-[#3456FF]"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// Server component
export default function CustomerSidebar() {
  return <ClientSidebar />;
}
