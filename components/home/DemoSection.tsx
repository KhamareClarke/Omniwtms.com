"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, MessageCircle, Clock, CheckCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DemoSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    needs: "",
  });

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          requirements: formData.needs,
          phone: formData.phone || "Not provided",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Redirect to thank you page or show success message
      router.push("/thank-you");
    } catch (error) {
      console.error("Form submission error:", error);
      // Handle error (show error message to user)
    }
  };

  const handleDemoClick = () => {
    const form = document.getElementById("demo-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <section id="contact" className="py-32 bg-white border-b border-gray-200">
        <div id="demo-form" className="max-w-8xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
              Start Your Free Trial
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get started in 48 hours with zero setup fees. We&apos;ll configure everything for your operation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Benefits */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Clock,         label: "Live in 48h",   desc: "Fully configured",   iconBg: "bg-blue-50",   iconColor: "text-blue-600",   labelColor: "text-blue-700",   border: "border-blue-100"   },
                  { icon: Zap,           label: "No Training",   desc: "Intuitive by design", iconBg: "bg-purple-50", iconColor: "text-purple-600", labelColor: "text-purple-700", border: "border-purple-100" },
                  { icon: CheckCircle,   label: "UK Support",    desc: "Real humans, fast",   iconBg: "bg-green-50",  iconColor: "text-green-600",  labelColor: "text-green-700",  border: "border-green-100"  },
                  { icon: MessageCircle, label: "24h Response",  desc: "Guaranteed SLA",      iconBg: "bg-indigo-50", iconColor: "text-indigo-600", labelColor: "text-indigo-700", border: "border-indigo-100" },
                ].map((b) => (
                  <div key={b.label} className={`bg-white rounded-lg p-5 border ${b.border} shadow-sm flex flex-col items-center text-center`}>
                    <div className={`${b.iconBg} rounded-lg p-3 mb-2`}>
                      <b.icon className={`h-5 w-5 ${b.iconColor}`} />
                    </div>
                    <div className={`font-bold text-sm ${b.labelColor}`}>{b.label}</div>
                    <div className="text-xs text-slate-500">{b.desc}</div>
                  </div>
                ))}
              </div>

              {/* Phone contact */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 flex items-center gap-4">
                <div className="bg-gray-100 rounded-lg p-3 flex-shrink-0">
                  <Phone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-semibold">Prefer to call?</div>
                  <a href="tel:+442079460982" className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors">
                    +44 20 7946 0982
                  </a>
                  <div className="text-xs text-gray-500">Mon-Fri, 9am-5:30pm GMT</div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Get Started</h3>
                <p className="text-sm text-slate-600 mb-6">Join 250+ UK logistics firms</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-1 block">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Smith"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-1 block">Business Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-sm font-semibold text-slate-700 mb-1 block">Company Name *</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Your company name"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="needs" className="text-sm font-semibold text-slate-700 mb-1 block">What are you looking to improve?</Label>
                    <Textarea
                      id="needs"
                      name="needs"
                      placeholder="e.g. reduce delivery delays, automate dispatch, improve inventory accuracy..."
                      value={formData.needs}
                      onChange={handleChange}
                      rows={3}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 text-base"
                    size="lg"
                  >
                    Start Free Trial
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    No obligation. We&apos;ll respond within 24 hours.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
