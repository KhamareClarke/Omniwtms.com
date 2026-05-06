"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Zap, MapPin, Smartphone, Star, Users, CheckCircle, TrendingUp, Shield, BarChart3, Package, Truck, Bell, Search, LayoutDashboard, Warehouse } from "lucide-react";
import { openBookingWidget } from "@/utils/bookingWidget";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const stickyHeader = document.getElementById('sticky-header');
      if (stickyHeader) {
        if (window.scrollY > 600) {
          stickyHeader.style.transform = 'translateY(0)';
        } else {
          stickyHeader.style.transform = 'translateY(-100%)';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookDemo = () => {
    openBookingWidget();
  };

  const handleSeePricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="relative py-28 md:py-40 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1000 1000">
            <path d="M100,200 Q300,100 500,200 T900,300" stroke="#2563eb" strokeWidth="2" fill="none" strokeDasharray="10,5" />
            <path d="M50,400 Q250,300 450,400 T850,500" stroke="#7c3aed" strokeWidth="2" fill="none" strokeDasharray="15,10" />
            <path d="M150,600 Q350,500 550,600 T950,700" stroke="#059669" strokeWidth="2" fill="none" strokeDasharray="8,8" />
          </svg>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-8xl relative z-10">
          {/* Platform Badge */}
          <div className={`text-center mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 shadow-sm">
              <span className="text-sm font-semibold text-blue-700">
                AI-Powered UK Warehouse & Transport Management System
              </span>
            </div>
          </div>

          {/* Social Proof Banner */}
          <div className={`text-center mb-12 transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="hidden md:inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-700">250+ UK Logistics Firms</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                ))}
                <span className="ml-1 font-medium text-sm text-gray-700">4.9/5</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm text-green-700">38% Faster Deliveries</span>
              </div>
            </div>
            <div className="md:hidden flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 shadow-sm text-xs border border-gray-100">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-700">250+ firms</span>
                <div className="flex gap-0.5 mx-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-gray-600">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className={`text-center mb-8 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight px-2">
              <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">Warehouse & Transport Management</span>
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-6 leading-snug px-2">
              Complete control from <span className="text-blue-600 font-bold">warehouse</span> to <span className="text-purple-600 font-bold">delivery</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              Real-time visibility, automation, and fleet management in one platform for UK logistics operations.
            </p>
          </div>

          {/* CTA */}
          <div className={`flex flex-col items-center gap-6 transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <Button
              size="lg"
              onClick={handleBookDemo}
              className="px-10 py-4 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-105 transition-all duration-300 border-0"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Get Started Free
              </span>
            </Button>
            <p className="text-sm text-gray-500">Trusted by 250+ UK logistics firms • No setup fees</p>
          </div>

        </div>
      </section>

      {/* Enhanced Sticky CTAs */}
      
      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 p-4 shadow-lg">
        <Button
          onClick={handleBookDemo}
          className="w-full py-3 text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 border-0"
        >
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Get Started Free
          </span>
        </Button>
      </div>

      {/* Desktop Floating Action Button */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <div className="relative group">
          <Button
            onClick={handleBookDemo}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-all duration-300 border-0"
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-14 right-0 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Book Free Demo
          </div>
        </div>
      </div>

      {/* Sticky Top Bar (appears on scroll) */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm transform -translate-y-full transition-transform duration-300" id="sticky-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bold text-base text-slate-900">OmniWTMS</div>
              <div className="text-xs text-slate-500">UK Warehouse &amp; Transport Management</div>
            </div>
            <Button
              onClick={handleBookDemo}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 border-0"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

    </>
  );
}
