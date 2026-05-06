"use client";

import { useParams } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const blogContent: Record<string, any> = {
  "warehouse-automation-2025": {
    title: "The Future of Warehouse Automation in 2025",
    date: "2024-12-10",
    author: "Sarah Mitchell",
    readTime: "8 min read",
    category: "Technology",
    content: `
      <h2>Introduction to Warehouse Automation</h2>
      <p>The logistics industry is undergoing a massive transformation. Warehouse automation is no longer a luxury—it's becoming essential for staying competitive in the UK market.</p>
      
      <h2>Key Trends Shaping 2025</h2>
      <h3>1. AI-Powered Inventory Management</h3>
      <p>Artificial intelligence is revolutionizing how warehouses track and manage stock. Modern WMS platforms like OmniWTMS use machine learning to predict demand, optimize stock levels, and prevent stockouts before they happen.</p>
      
      <h3>2. Robotics and Automation</h3>
      <p>Automated guided vehicles (AGVs) and robotic picking systems are becoming more affordable and accessible to mid-sized logistics companies. These technologies can increase picking accuracy to 99.9% while reducing labor costs by up to 40%.</p>
      
      <h3>3. IoT and Real-Time Tracking</h3>
      <p>Internet of Things (IoT) sensors provide real-time visibility into inventory location, condition, and movement. This level of transparency helps prevent losses and improves customer satisfaction.</p>
      
      <h2>Benefits for UK Logistics Firms</h2>
      <ul>
        <li><strong>Increased Efficiency:</strong> Automation can boost warehouse productivity by 25-40%</li>
        <li><strong>Reduced Errors:</strong> Automated systems eliminate 99% of manual picking errors</li>
        <li><strong>Cost Savings:</strong> Lower labor costs and reduced waste lead to significant savings</li>
        <li><strong>Scalability:</strong> Easily handle peak seasons without hiring temporary staff</li>
      </ul>
      
      <h2>Implementation Strategies</h2>
      <p>Start with a comprehensive WMS like OmniWTMS that provides the foundation for automation. Begin with high-impact areas like order picking and inventory tracking, then gradually expand to more advanced automation.</p>
      
      <h2>Conclusion</h2>
      <p>Warehouse automation is the future of logistics. Companies that embrace these technologies now will have a significant competitive advantage in 2025 and beyond.</p>
    `,
  },
  "reduce-delivery-costs": {
    title: "10 Proven Ways to Reduce Last-Mile Delivery Costs",
    date: "2024-12-08",
    author: "James Thompson",
    readTime: "6 min read",
    category: "Operations",
    content: `
      <h2>Understanding Last-Mile Delivery Challenges</h2>
      <p>Last-mile delivery accounts for 53% of total shipping costs. For UK logistics companies, optimizing this final leg is crucial for profitability.</p>
      
      <h2>10 Proven Cost-Reduction Strategies</h2>
      
      <h3>1. Route Optimization</h3>
      <p>Use AI-powered route planning to reduce fuel costs by up to 30%. OmniWTMS's intelligent routing considers traffic, delivery windows, and vehicle capacity.</p>
      
      <h3>2. Dynamic Delivery Windows</h3>
      <p>Offer customers flexible delivery slots to consolidate routes and reduce the number of trips needed.</p>
      
      <h3>3. Zone-Based Delivery</h3>
      <p>Group deliveries by geographic zones to minimize travel distance and time.</p>
      
      <h3>4. Real-Time Tracking</h3>
      <p>Reduce failed deliveries by 40% with accurate ETAs and customer notifications.</p>
      
      <h3>5. Vehicle Utilization</h3>
      <p>Maximize load capacity through intelligent order batching and vehicle assignment.</p>
      
      <h3>6. Alternative Delivery Points</h3>
      <p>Partner with collection points to reduce residential delivery costs.</p>
      
      <h3>7. Driver Performance Analytics</h3>
      <p>Monitor and optimize driver efficiency with detailed performance metrics.</p>
      
      <h3>8. Fuel Management</h3>
      <p>Track fuel consumption and identify inefficiencies in real-time.</p>
      
      <h3>9. Automated Proof of Delivery</h3>
      <p>Eliminate paperwork and reduce administrative costs with digital POD.</p>
      
      <h3>10. Predictive Maintenance</h3>
      <p>Prevent costly vehicle breakdowns with proactive maintenance scheduling.</p>
      
      <h2>Measuring Success</h2>
      <p>Track key metrics like cost per delivery, on-time delivery rate, and customer satisfaction to measure the impact of these strategies.</p>
    `,
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = blogContent[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-blue-600 hover:underline">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                {post.category}
              </span>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {new Date(post.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Implement These Strategies?
            </h3>
            <p className="text-gray-700 mb-6">
              OmniWTMS provides all the tools you need to optimize your logistics operations and reduce costs.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg"
            >
              Book a Free Demo
            </Button>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
