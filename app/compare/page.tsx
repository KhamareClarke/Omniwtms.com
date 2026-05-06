"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Check, X, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const comparisonData = {
  features: [
    { category: "Core Features", items: [
      { name: "Real-time GPS Tracking", omniwtms: true, competitor1: true, competitor2: true },
      { name: "AI Route Optimization", omniwtms: true, competitor1: false, competitor2: true },
      { name: "Mobile Driver App (iOS & Android)", omniwtms: true, competitor1: true, competitor2: false },
      { name: "Electronic Proof of Delivery", omniwtms: true, competitor1: true, competitor2: true },
      { name: "Barcode Scanning", omniwtms: true, competitor1: true, competitor2: false },
      { name: "Multi-Warehouse Management", omniwtms: true, competitor1: false, competitor2: true },
    ]},
    { category: "Advanced Features", items: [
      { name: "Predictive Analytics", omniwtms: true, competitor1: false, competitor2: false },
      { name: "Automated Inventory Reordering", omniwtms: true, competitor1: false, competitor2: true },
      { name: "Customer Portal & Tracking", omniwtms: true, competitor1: true, competitor2: false },
      { name: "API & Integrations", omniwtms: true, competitor1: true, competitor2: true },
      { name: "Custom Reporting", omniwtms: true, competitor1: false, competitor2: true },
      { name: "Offline Mode", omniwtms: true, competitor1: false, competitor2: false },
    ]},
    { category: "Support & Implementation", items: [
      { name: "24/7 UK-Based Support", omniwtms: true, competitor1: false, competitor2: true },
      { name: "48-Hour Implementation", omniwtms: true, competitor1: false, competitor2: false },
      { name: "Free Data Migration", omniwtms: true, competitor1: false, competitor2: true },
      { name: "Dedicated Account Manager", omniwtms: true, competitor1: false, competitor2: false },
      { name: "Video Training Library", omniwtms: true, competitor1: true, competitor2: true },
      { name: "No Setup Fees", omniwtms: true, competitor1: false, competitor2: false },
    ]},
  ],
  pricing: {
    omniwtms: { start: "£599", contract: "No contract", setup: "£0" },
    competitor1: { start: "£899", contract: "12 months", setup: "£2,500" },
    competitor2: { start: "£749", contract: "24 months", setup: "£1,500" },
  }
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Compare OmniWTMS to Other Solutions
            </h1>
            <p className="text-xl text-gray-600">
              See why 250+ UK logistics companies chose OmniWTMS over the competition.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Pricing Comparison */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Pricing Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  BEST VALUE
                </div>
                <h3 className="text-2xl font-bold mb-4">OmniWTMS</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">{comparisonData.pricing.omniwtms.start}<span className="text-lg">/mo</span></div>
                  <div className="text-blue-100">Starting price</div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    <span>{comparisonData.pricing.omniwtms.contract}</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Setup: {comparisonData.pricing.omniwtms.setup}</span>
                  </div>
                </div>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold">
                  Get Started
                </Button>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Competitor A</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2 text-gray-900">{comparisonData.pricing.competitor1.start}<span className="text-lg">/mo</span></div>
                  <div className="text-gray-600">Starting price</div>
                </div>
                <div className="space-y-2 mb-6 text-gray-700">
                  <div className="flex items-center">
                    <X className="h-5 w-5 mr-2 text-red-500" />
                    <span>{comparisonData.pricing.competitor1.contract} minimum</span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-5 w-5 mr-2 text-red-500" />
                    <span>Setup: {comparisonData.pricing.competitor1.setup}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Competitor B</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2 text-gray-900">{comparisonData.pricing.competitor2.start}<span className="text-lg">/mo</span></div>
                  <div className="text-gray-600">Starting price</div>
                </div>
                <div className="space-y-2 mb-6 text-gray-700">
                  <div className="flex items-center">
                    <X className="h-5 w-5 mr-2 text-red-500" />
                    <span>{comparisonData.pricing.competitor2.contract} minimum</span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-5 w-5 mr-2 text-red-500" />
                    <span>Setup: {comparisonData.pricing.competitor2.setup}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-blue-600">OmniWTMS</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-600">Competitor A</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-600">Competitor B</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.features.map((section, sectionIdx) => (
                    <>
                      <tr key={`section-${sectionIdx}`} className="bg-gray-100">
                        <td colSpan={4} className="px-6 py-3 text-sm font-bold text-gray-900">
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map((feature, featureIdx) => (
                        <tr key={`feature-${sectionIdx}-${featureIdx}`} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-700">{feature.name}</td>
                          <td className="px-6 py-4 text-center">
                            {feature.omniwtms ? (
                              <Check className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.competitor1 ? (
                              <Check className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.competitor2 ? (
                              <Check className="h-6 w-6 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose OmniWTMS */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Why UK Companies Choose OmniWTMS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "No Hidden Costs", description: "Transparent pricing with no setup fees or long-term contracts. Cancel anytime." },
              { title: "Fastest Implementation", description: "Go live in 48 hours with full support and free data migration." },
              { title: "UK-Based Support", description: "24/7 support from logistics experts who understand your business." },
            ].map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <Star className="h-6 w-6 text-yellow-400 fill-current mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">{benefit.title}</h3>
                </div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            See the Difference for Yourself
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book a free demo and discover why OmniWTMS is the #1 choice for UK logistics.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Book Free Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
