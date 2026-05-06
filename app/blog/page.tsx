"use client";

import { Metadata } from 'next';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, TrendingUp, Package, Truck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const blogPosts = [
  {
    id: "warehouse-automation-2025",
    title: "The Future of Warehouse Automation in 2025",
    excerpt: "Discover how AI and robotics are transforming warehouse operations and what it means for UK logistics firms.",
    category: "Technology",
    date: "2024-12-10",
    readTime: "8 min read",
    image: "/blog/warehouse-automation.jpg",
    icon: Package,
  },
  {
    id: "reduce-delivery-costs",
    title: "10 Proven Ways to Reduce Last-Mile Delivery Costs",
    excerpt: "Learn practical strategies to cut delivery expenses while maintaining service quality and customer satisfaction.",
    category: "Operations",
    date: "2024-12-08",
    readTime: "6 min read",
    image: "/blog/delivery-costs.jpg",
    icon: Truck,
  },
  {
    id: "route-optimization-guide",
    title: "Complete Guide to AI-Powered Route Optimization",
    excerpt: "How machine learning algorithms can reduce fuel costs by 30% and improve delivery times across your fleet.",
    category: "Technology",
    date: "2024-12-05",
    readTime: "10 min read",
    image: "/blog/route-optimization.jpg",
    icon: TrendingUp,
  },
  {
    id: "inventory-management-best-practices",
    title: "Inventory Management Best Practices for 3PL Providers",
    excerpt: "Master inventory control with proven techniques used by leading UK logistics companies.",
    category: "Best Practices",
    date: "2024-12-03",
    readTime: "7 min read",
    image: "/blog/inventory-management.jpg",
    icon: BarChart3,
  },
  {
    id: "customer-experience-logistics",
    title: "Improving Customer Experience in Logistics: A Data-Driven Approach",
    excerpt: "Use analytics and real-time tracking to exceed customer expectations and build loyalty.",
    category: "Customer Success",
    date: "2024-12-01",
    readTime: "9 min read",
    image: "/blog/customer-experience.jpg",
    icon: TrendingUp,
  },
  {
    id: "sustainability-logistics",
    title: "Sustainable Logistics: Reducing Your Carbon Footprint",
    excerpt: "Practical steps to make your logistics operations more environmentally friendly while cutting costs.",
    category: "Sustainability",
    date: "2024-11-28",
    readTime: "8 min read",
    image: "/blog/sustainability.jpg",
    icon: Package,
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Logistics Insights & Resources
            </h1>
            <p className="text-xl text-gray-600">
              Expert advice, industry trends, and practical tips to optimize your warehouse and transport operations.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => {
              const IconComponent = post.icon;
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100"
                >
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                    <IconComponent className="h-20 w-20 text-blue-600 opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {post.category}
                      </span>
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      
                      <Link
                        href={`/blog/${post.id}`}
                        className="flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                      >
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            See how OmniWTMS can help you achieve the results discussed in these articles.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Book a Free Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
