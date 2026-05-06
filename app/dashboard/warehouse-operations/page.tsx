// @ts-nocheck
"use client";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { AIParticleEffect } from "@/components/ui/ai-particle-effect";
import dynamic from "next/dynamic";

const WarehouseOperations = dynamic(
  () =>
    import("@/components/warehouses/warehouse-operations").then(
      (mod) => mod.WarehouseOperations
    ),
  {
    ssr: false,
  }
);

export default function WarehouseOperationsPage() {
  return (
    <AnimatedGradientBackground className="min-h-screen">
      <AIParticleEffect particleColor="#3456FF" density="low" />

      <div className="space-y-8 px-4 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
            Warehouse Operations
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 animate-pulse-slow absolute inset-0"></div>
                <LoadingSpinner className="w-12 h-12 text-[#3456FF]" />
              </div>
            </div>
          }
        >
          <WarehouseOperations />
        </Suspense>
      </div>
    </AnimatedGradientBackground>
  );
}
