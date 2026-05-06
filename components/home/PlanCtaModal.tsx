import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Star } from "lucide-react";

interface PlanCtaModalProps {
  open: boolean;
  onClose: () => void;
  plan: "starter" | "growth";
}

const paymentLinks = {
  starter: {
    monthly:
      "https://link.omnidigitalsolutions.ai/payment-link/68a3480dcd9d3481f436217d",
    annual:
      "https://link.omnidigitalsolutions.ai/payment-link/68a3482bcd9d3458fc362181",
    monthlyPrice: 599,
    annualPrice: 6470,
    annualOriginal: 7188,
  },
  growth: {
    monthly:
      "https://link.omnidigitalsolutions.ai/payment-link/68a34c1867ee3b876b68530f",
    annual:
      "https://link.omnidigitalsolutions.ai/payment-link/68a34c5b613b1b5dbdcd34b1",
    monthlyPrice: 1199,
    annualPrice: 12950,
    annualOriginal: 14388,
  },
};

export default function PlanCtaModal({
  open,
  onClose,
  plan,
}: PlanCtaModalProps) {
  const handleClick = (type: "monthly" | "annual") => {
    window.open(paymentLinks[plan][type], "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Choose your billing option
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 mt-6">
          {/* Monthly Option Card */}
          <button
            onClick={() => handleClick("monthly")}
            className="relative group w-full bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 hover:border-blue-600 shadow-lg rounded-2xl px-8 py-7 flex flex-col items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            style={{ outline: "none" }}
            autoFocus
            aria-label="Select monthly plan"
          >
            <Calendar
              className="w-7 h-7 text-blue-400 mb-2"
              aria-hidden="true"
            />
            <span className="text-3xl font-extrabold text-blue-800 mb-1">
              {plan === "starter" ? "£599/mo" : "£1,199/mo"}
            </span>
            <span className="text-xs font-medium text-gray-500 mb-1">
              Billed monthly
            </span>
            <span className="text-sm text-gray-500 mb-2">
              Flexible, cancel anytime
            </span>
            <span className="mt-2 inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-base shadow transition">
              {plan === "starter" ? "Secure Plan" : "Secure Growth"}
            </span>
            <CheckCircle
              className="absolute right-5 top-5 w-6 h-6 text-green-500 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150"
              aria-hidden="true"
            />
          </button>

          {/* Annual Option Card */}
          <button
            onClick={() => handleClick("annual")}
            className="relative group w-full bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 hover:border-indigo-600 shadow-lg rounded-2xl px-8 py-7 flex flex-col items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ outline: "none" }}
            aria-label="Select annual plan"
          >
            {/* Best Value Ribbon */}
            <span className="absolute -top-3 left-4 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              Best Value
            </span>
            <Star className="w-7 h-7 text-yellow-400 mb-2" aria-hidden="true" />
            <span className="inline-block text-sm bg-green-500 text-white rounded-full px-3 py-1 font-bold mb-2">
              Save 10%
            </span>
            <span className="text-xs font-medium text-gray-400 line-through mb-1">
              £{plan === "starter" ? "7,188" : "14,388"}
            </span>
            <span className="text-3xl font-extrabold text-indigo-800 mb-1">
              £{plan === "starter" ? "6,470" : "12,950"}
            </span>
            <span className="text-xs font-medium text-gray-500 mb-1">
              Billed annually
            </span>
            <span className="text-sm text-gray-500 mb-2">
              Best for growing teams
            </span>
            <span className="mt-2 inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-base shadow transition">
              {plan === "starter"
                ? "Secure Plan (Annual)"
                : "Secure Growth (Annual)"}
            </span>
            <CheckCircle
              className="absolute right-5 top-5 w-6 h-6 text-green-500 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150"
              aria-hidden="true"
            />
          </button>
        </div>
        <DialogClose asChild>
          <Button variant="ghost" className="w-full mt-4">
            Cancel
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
