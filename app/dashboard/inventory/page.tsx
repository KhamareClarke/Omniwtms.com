// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new URL
    router.replace("/dashboard/inventories");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-heading font-bold">Redirecting...</h1>
        <p className="text-gray-500">
          Please wait while we redirect you to the new Inventories page
        </p>
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
