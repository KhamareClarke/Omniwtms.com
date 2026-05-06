"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

/**
 * Public tracking landing: enter tracking number, redirect to /track/[number].
 * No login required.
 */
export default function PublicTrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tn = trackingNumber?.trim();
    if (!tn) return;
    router.push(`/track/${encodeURIComponent(tn)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-[#3456FF]">
            OmniWTMS
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Track your shipment</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your tracking number to see status and delivery history. No login required.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <label htmlFor="tracking" className="block text-sm font-medium text-gray-700">
            Tracking number
          </label>
          <Input
            id="tracking"
            type="text"
            placeholder="e.g. PKG-12345"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full"
            autoFocus
          />
          <Button type="submit" className="w-full bg-[#3456FF] hover:bg-[#3456FF]/90">
            Track
          </Button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-6">
          Use the tracking number from your order confirmation or delivery email.
        </p>
      </div>
    </div>
  );
}
