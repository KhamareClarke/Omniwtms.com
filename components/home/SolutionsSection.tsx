import React, { useState, useEffect } from "react";
import { Warehouse, Truck, BarChart3, Heart, CheckCircle, ArrowRight, Users, Clock, TrendingUp, Shield } from "lucide-react";
import { openBookingWidget } from "@/utils/bookingWidget";

export default function SolutionsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('solutions');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="py-32 bg-white border-b border-gray-200"
      id="solutions"
    >
      <div className="container mx-auto px-4 max-w-8xl">
        {/* Header */}
        <div className={`text-center mb-20 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            Core Operations
          </h2>
          <p className="text-xl text-slate-600 text-center max-w-2xl mx-auto">
            Complete visibility and control across warehouse, transport, and customer operations
          </p>
        </div>
        {/* Core Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          {/* Warehouse Operations */}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '100ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-lg p-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Warehouse Operations</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Real-time inventory tracking with barcode and RFID</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Automated pick optimization and order fulfillment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">3D warehouse visualization for capacity planning</span>
              </li>
            </ul>
          </div>

          {/* Transportation Operations */}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '200ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Transportation</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">AI-powered route optimization and dispatch</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Live GPS tracking for all vehicles and drivers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Digital proof of delivery via mobile app</span>
              </li>
            </ul>
          </div>

          {/* Data & Analytics */}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '300ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Data & Analytics</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Live KPI dashboards for operational visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">AI-powered demand forecasting and analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Custom reports with automated alerts</span>
              </li>
            </ul>
          </div>

          {/* Customer Experience */}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '400ms'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-lg p-2">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Customer Experience</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Real-time order tracking and notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Branded customer portal for self-service</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Flexible delivery options and time slots</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
