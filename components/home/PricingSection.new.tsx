"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Plus, Clock } from "lucide-react";
import SignupModal from "./SignupModal";
import clsx from "clsx";

export default function PricingSection() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleOpenSignup = () => {
    setIsSignupModalOpen(true);
  };

  const plans = [
    {
      name: "Starter",
      price: "£899",
      period: "/month",
      altPrice: "£999 monthly",
      description: "For small depots or courier firms just getting started",
      icon: Zap,
      features: [
        "Up to 1,000 deliveries/month",
        "5 users included",
        "1 depot",
        "Job booking + route planning",
        "Driver app access",
        "Warehouse stock control",
        "Real-time tracking",
        "Basic reporting",
        "Standard integrations",
      ],
      addons: [
        "£0.60 per extra delivery",
        "£15 per additional user",
        "£29/van/month for tracking hardware (optional)",
        "£99/month for API access",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      price: "£1,499",
      period: "/month",
      altPrice: "£1,699 monthly",
      description: "For regional 3PLs, B2B couriers & eCom fulfillment firms",
      icon: Star,
      features: [
        "Up to 5,000 deliveries/month",
        "25 users",
        "Multi-depot support",
        "Everything in Starter",
        "Advanced dispatch & trip planning",
        "Label printing + customer notifications",
        "Inventory by bin/location",
        "API access",
        "Dedicated success manager",
        "Monthly strategy review",
      ],
      addons: [
        "£0.50 per extra delivery",
        "£12 per additional user",
        "£199/month for custom integrations",
        "£299/month for white-label branding",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "£2,499",
      period: "/month",
      altPrice: "Custom usage-based quote",
      description: "For large operations, national couriers, and 3PL giants",
      icon: Crown,
      features: [
        "50,000+ deliveries/month",
        "Unlimited users",
        "Multi-warehouse & depot network",
        "Everything in Growth",
        "Live fleet tracking",
        "3D warehouse visualisation",
        "Barcode + RFID integrations",
        "SLA-backed uptime",
        "24/7 UK support",
        "Dedicated logistics success team",
      ],
      addons: [],
      cta: "Book Demo",
      popular: false,
    },
  ];

  const customPlan = {
    name: "Custom",
    price: "£299",
    period: "/month",
    description: "Build your own plan that scales as you grow",
    features: [
      "Minimum 250 deliveries/month",
      "Choose users, depots, API, integrations",
      "Scales as you grow",
    ],
  };

  const globalAddons = [
    { feature: "Extra Deliveries", price: "from £0.50 each" },
    { feature: "Additional User", price: "£12–£15 / user" },
    { feature: "Vehicle Tracking Hardware", price: "£29 / van" },
    { feature: "API & Webhooks Access", price: "£99" },
    { feature: "White Label Branding", price: "£299" },
    { feature: "Advanced Analytics & Reports", price: "£199" },
  ];

  return (
    <section
      id="pricing"
      className="py-20 bg-gradient-to-b from-white to-blue-50"
    >
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm mb-4">
            <Clock className="w-4 h-4 mr-1" />
            <span>LIMITED TIME OFFER - Annual billing saves 10%</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            Choose the plan that's right for your business and scale as you grow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={clsx(
                "relative rounded-xl overflow-hidden border transition-all shadow-lg hover:shadow-xl",
                plan.popular
                  ? "border-blue-500 scale-105 md:scale-110"
                  : "border-gray-200",
                index === 0
                  ? "bg-gradient-to-br from-white to-blue-50"
                  : index === 1
                  ? "bg-gradient-to-br from-white to-indigo-50"
                  : "bg-gradient-to-br from-white to-purple-50"
              )}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700 mb-2 inline-block">
                      {index === 0
                        ? "⚡ Starter"
                        : index === 1
                        ? "⚙️ Growth"
                        : "🏢 Enterprise"}
                    </span>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  <span
                    className={`p-2 rounded-full ${
                      index === 0
                        ? "bg-blue-100"
                        : index === 1
                        ? "bg-indigo-100"
                        : "bg-purple-100"
                    }`}
                  >
                    {plan.icon && (
                      <plan.icon
                        className={`h-6 w-6 ${
                          index === 0
                            ? "text-blue-500"
                            : index === 1
                            ? "text-indigo-500"
                            : "text-purple-500"
                        }`}
                      />
                    )}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  {plan.altPrice && (
                    <div className="text-sm text-gray-500 mb-1">
                      ({plan.altPrice})
                    </div>
                  )}
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {index === 1 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4 text-sm">
                    <span className="font-semibold text-amber-700 block mb-1">
                      20% OFF
                    </span>
                    <span className="text-amber-800">
                      Only 2 slots at this price!
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start py-2">
                      <Check className="text-green-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.addons && plan.addons.length > 0 && (
                  <div className="mb-6 border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Add-ons:</h4>
                    {plan.addons.map((addon, idx) => (
                      <div key={idx} className="flex items-start py-1.5">
                        <Plus className="text-blue-400 w-4 h-4 mr-2 mt-0.5" />
                        <span className="text-gray-600 text-sm">{addon}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleOpenSignup}
                  className={clsx(
                    "w-full text-center rounded-md px-4 py-2 font-medium",
                    plan.popular
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-50 text-blue-600 border border-blue-500"
                  )}
                >
                  {plan.cta}
                </Button>

                {index === 0 && (
                  <div className="text-center mt-3 text-xs text-gray-500">
                    No credit card required
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Plan */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700 mb-2 inline-block">
                    🎯 Custom Plans
                  </span>
                  <h3 className="text-2xl font-bold">Don't fit the mold?</h3>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Build your own plan starting at{" "}
                <strong>
                  {customPlan.price}
                  {customPlan.period}
                </strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {customPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className="text-green-500 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleOpenSignup}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white w-full md:w-auto px-6 py-2 rounded-md hover:from-purple-600 hover:to-indigo-700"
              >
                Build My Custom Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Global Add-ons */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-center mb-8">
            Optional Add-Ons for Any Plan
          </h3>
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {globalAddons.map((addon, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {addon.feature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {addon.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg mb-4">
            Need help choosing?{" "}
            <a
              href="#contact"
              className="text-blue-500 font-medium hover:underline"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </section>
  );
}
