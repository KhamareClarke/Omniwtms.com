"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FileText, Video, BookOpen, Download, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const resources = [
  {
    id: "wms-buyers-guide",
    title: "The Complete WMS Buyer's Guide 2025",
    type: "Guide",
    description: "Everything you need to know about selecting the right warehouse management system for your business.",
    format: "PDF",
    pages: "32 pages",
    icon: BookOpen,
    downloadUrl: "#",
  },
  {
    id: "roi-calculator",
    title: "Logistics ROI Calculator",
    type: "Tool",
    description: "Calculate your potential savings and ROI from implementing OmniWTMS in your operations.",
    format: "Excel",
    pages: "Interactive",
    icon: FileText,
    downloadUrl: "#",
  },
  {
    id: "route-optimization-whitepaper",
    title: "AI Route Optimization Whitepaper",
    type: "Whitepaper",
    description: "Deep dive into how AI-powered routing can reduce fuel costs by 30% and improve delivery times.",
    format: "PDF",
    pages: "24 pages",
    icon: FileText,
    downloadUrl: "#",
  },
  {
    id: "implementation-checklist",
    title: "WMS Implementation Checklist",
    type: "Checklist",
    description: "Step-by-step checklist to ensure smooth implementation of your new warehouse management system.",
    format: "PDF",
    pages: "8 pages",
    icon: CheckCircle,
    downloadUrl: "#",
  },
  {
    id: "video-demo",
    title: "OmniWTMS Platform Demo",
    type: "Video",
    description: "Watch a comprehensive walkthrough of OmniWTMS features and capabilities.",
    format: "Video",
    pages: "15 minutes",
    icon: Video,
    downloadUrl: "#",
  },
  {
    id: "inventory-best-practices",
    title: "Inventory Management Best Practices",
    type: "Guide",
    description: "Proven strategies for optimizing inventory levels and reducing carrying costs.",
    format: "PDF",
    pages: "18 pages",
    icon: BookOpen,
    downloadUrl: "#",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free Logistics Resources
            </h1>
            <p className="text-xl text-gray-600">
              Guides, whitepapers, and tools to help you optimize your warehouse and transport operations.
            </p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => {
              const IconComponent = resource.icon;
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                >
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 flex items-center justify-center">
                    <IconComponent className="h-16 w-16 text-blue-600" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {resource.type}
                      </span>
                      <span className="text-sm text-gray-500">{resource.format}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{resource.pages}</span>
                      <Button
                        variant="outline"
                        className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Want Personalized Guidance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book a free consultation with our logistics experts to discuss your specific needs.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Schedule Consultation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
