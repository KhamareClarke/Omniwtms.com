"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Truck,
  Scan,
  Building2,
  ShoppingCart,
  DollarSign,
  Brain,
  Bell,
} from "lucide-react";

export default function PlatformFeatures() {
  const [selectedFeature, setSelectedFeature] = useState(0);

  const features = [
    {
      id: "warehouse",
      title: "Warehouse Management",
      description:
        "3D warehouse visualization and bin & location-based inventory tracking",
      benefit: "Cut inventory errors by 75% with real-time visibility",
      metric: "Real-time",
      change: "Stock Levels",
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: "delivery",
      title: "Transportation & Delivery",
      description:
        "Live GPS tracking and smart route optimization for all vehicles",
      benefit: "Reduce delivery times by 40% with intelligent routing",
      metric: "Job Assignment",
      change: "In Seconds",
      icon: Truck,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      id: "routing",
      title: "Order & Fulfillment",
      description:
        "Bulk order upload, automated dispatch, and label generation",
      benefit: "Process 3x more orders with 60% less admin time",
      metric: "Automated",
      change: "Workflows",
      icon: ShoppingCart,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      id: "customers",
      title: "Customer Management",
      description:
        "Branded self-service portal with real-time tracking for end customers",
      benefit: "Boost customer satisfaction with transparent delivery insights",
      metric: "Satisfaction",
      change: "Insights",
      icon: Bell,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      id: "ai",
      title: "AI Automation",
      description:
        "Auto-scheduling, demand forecasting, and delay detection & rerouting",
      benefit: "Let AI handle routine tasks and make smart predictions",
      metric: "Task",
      change: "Automation",
      icon: Brain,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
    },
    {
      id: "reporting",
      title: "Reporting & Insights",
      description:
        "Live KPIs dashboard, operational analytics, and performance benchmarking",
      benefit: "Make data-driven decisions with comprehensive reporting",
      metric: "Performance",
      change: "Metrics",
      icon: BarChart3,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
  ];

  const warehouseFeatures = [
    "3D warehouse visualization",
    "Bin & location-based inventory tracking",
    "Barcode + RFID support",
    "Pallet mixer for efficient space use",
    "Real-time stock levels and alerts",
  ];

  const transportFeatures = [
    "Live GPS tracking for all vehicles",
    "Smart route optimization",
    "Job and driver assignment in seconds",
    "Digital proof of delivery",
    "Real-time status updates",
  ];

  const orderFeatures = [
    "Bulk order upload + tracking",
    "Automated dispatch",
    "Label generation",
    "POD and return workflows",
  ];

  const customerFeatures = [
    "Branded self-service portal",
    "Real-time tracking for end customers",
    "Customer activity logs and satisfaction insights",
  ];

  const aiFeatures = [
    "Auto-scheduling based on delivery windows",
    "Demand forecasting",
    "Delay detection & rerouting",
    "Admin task automation",
  ];

  const reportingFeatures = [
    "Live KPIs dashboard",
    "Operational analytics",
    "E-commerce performance reports",
    "Driver and depot performance benchmarking",
  ];

  const integrations = [
    "shopify.jpeg",
    "amazon.jpeg",
    "ebay.jpeg",
    "etsy.jpeg",
    "books.jpeg",
    "xero.jpeg",
    // "Vinted",
    // "Depop",
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            One Platform. Every Operation.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We combine full-featured warehouse management and delivery software
            into one intelligent system.
          </p>
        </div>

        {/* Interactive Feature Showcase */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Built for real logistics teams who demand speed, accuracy, and
            visibility
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedFeature === index
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : ""
                  }`}
                  onClick={() => setSelectedFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${feature.bgColor} rounded-lg`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div className="flex-1 max-w-[80vw] sm:max-w-none  flex-wrap w-fit">
                        <h4 className="text-lg  font-semibold flex-wrap w-fit text-gray-900 mb-2">
                          {feature.title}
                        </h4>
                        <div className="bg-gradient-to-r from-gray-50 to-white p-3 border-l-4 border-green-500 rounded mb-3">
                          <p className="text-green-700 font-medium">
                            {feature.benefit}
                          </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="md:text-2xl text-base font-bold text-gray-900">
                            {feature.metric}
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            {feature.change}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Warehouse Features List */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Warehouse Management Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Features List */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Order & Fulfillment Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transport Features List */}
        <div className="bg-green-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Transportation & Logistics Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transportFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Features List */}
        <div className="bg-purple-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Customer Management Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reporting Features List */}
        <div className="bg-yellow-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Reporting & Analytics Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportingFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Automation Features List */}
        <div className="bg-cyan-50 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            AI Automation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white rounded-lg p-4"
              >
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-indigo-50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Integrations
          </h3>
          <p className="text-center text-gray-700 mb-6">
            Connect instantly with:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={`/images/${integration}`}
                  alt="image"
                  className="text-gray-700 h-auto w-auto max-h-20 max-w-20 object-contain"
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-6 text-gray-600">
            ...and many more e-commerce platforms!
          </div>
        </div>
      </div>
    </div>
  );
}
