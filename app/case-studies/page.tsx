"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TrendingUp, Package, Clock, Users, ArrowRight, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const caseStudies = [
  {
    id: "manchester-logistics",
    company: "Manchester Logistics Group",
    industry: "3PL & Distribution",
    size: "50 vehicles, 3 warehouses",
    challenge: "Manual processes causing 40% delivery delays and inventory errors",
    solution: "Implemented OmniWTMS with AI route optimization and real-time tracking",
    results: [
      { metric: "38%", label: "Faster Deliveries" },
      { metric: "99.8%", label: "Inventory Accuracy" },
      { metric: "£47K", label: "Monthly Cost Savings" },
      { metric: "94%", label: "Customer Satisfaction" },
    ],
    testimonial: "OmniWTMS transformed our entire operation. We went from chaos to complete control in just 48 hours. Our delivery times improved by 40% and customer complaints dropped to almost zero.",
    author: "Sarah Mitchell, Operations Director",
    image: "/case-studies/manchester-logistics.jpg",
    icon: Truck,
  },
  {
    id: "london-couriers",
    company: "London Express Couriers",
    industry: "Same-Day Delivery",
    size: "120 drivers, 5 hubs",
    challenge: "Unable to scale operations during peak periods, high fuel costs",
    solution: "Deployed OmniWTMS mobile apps with dynamic routing and driver analytics",
    results: [
      { metric: "156%", label: "Order Volume Increase" },
      { metric: "31%", label: "Fuel Cost Reduction" },
      { metric: "2.4hrs", label: "Saved Per Driver Daily" },
      { metric: "4.8/5", label: "Driver App Rating" },
    ],
    testimonial: "The AI routing alone saved us over £15,000 per month in fuel costs. The mobile app made our drivers' lives so much easier, and customer tracking reduced support calls by 60%.",
    author: "James Thompson, CEO",
    image: "/case-studies/london-couriers.jpg",
    icon: Package,
  },
  {
    id: "birmingham-warehouse",
    company: "Birmingham Warehouse Solutions",
    industry: "E-commerce Fulfillment",
    size: "200,000 sq ft, 40 staff",
    challenge: "Inventory discrepancies, slow picking times, order errors",
    solution: "Integrated OmniWTMS with barcode scanning and automated workflows",
    results: [
      { metric: "99.9%", label: "Pick Accuracy" },
      { metric: "54%", label: "Faster Order Processing" },
      { metric: "£89K", label: "Annual Labor Savings" },
      { metric: "Zero", label: "Stockouts in 6 Months" },
    ],
    testimonial: "We eliminated virtually all picking errors and cut our order processing time in half. The ROI was evident within the first month. Best investment we've ever made.",
    author: "Lisa Rodriguez, Warehouse Manager",
    image: "/case-studies/birmingham-warehouse.jpg",
    icon: TrendingUp,
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Real Results from Real UK Businesses
            </h1>
            <p className="text-xl text-gray-600">
              See how leading logistics companies transformed their operations with OmniWTMS
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-16">
            {caseStudies.map((study, index) => {
              const IconComponent = study.icon;
              return (
                <article
                  key={study.id}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-12 flex items-center justify-center relative">
                      <IconComponent className="h-32 w-32 text-blue-600 opacity-20 absolute" />
                      <div className="relative z-10 text-center">
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          {study.company}
                        </h3>
                        <p className="text-lg text-gray-700 mb-1">{study.industry}</p>
                        <p className="text-sm text-gray-600">{study.size}</p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">
                          The Challenge
                        </h4>
                        <p className="text-gray-700">{study.challenge}</p>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-2">
                          The Solution
                        </h4>
                        <p className="text-gray-700">{study.solution}</p>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wide mb-3">
                          The Results
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {study.results.map((result, idx) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-center border border-blue-200"
                            >
                              <div className="text-3xl font-bold text-blue-600 mb-1">
                                {result.metric}
                              </div>
                              <div className="text-sm text-gray-700">{result.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-600">
                        <p className="text-gray-800 italic mb-3">"{study.testimonial}"</p>
                        <p className="text-sm font-semibold text-gray-900">
                          — {study.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Proven Results Across the UK
            </h2>
            <p className="text-xl text-blue-100">
              Join 250+ logistics companies achieving exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "250+", label: "UK Companies" },
              { value: "38%", label: "Avg. Delivery Speed Increase" },
              { value: "99.8%", label: "Avg. Accuracy Rate" },
              { value: "48hrs", label: "Avg. Implementation Time" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            See how OmniWTMS can transform your logistics operations in just 48 hours.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Book Your Free Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
      
      {/* Structured Data for Case Studies */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": caseStudies.map((study, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Review",
                "itemReviewed": {
                  "@type": "SoftwareApplication",
                  "name": "OmniWTMS"
                },
                "author": {
                  "@type": "Person",
                  "name": study.author
                },
                "reviewBody": study.testimonial,
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5"
                }
              }
            }))
          })
        }}
      />
    </div>
  );
}
