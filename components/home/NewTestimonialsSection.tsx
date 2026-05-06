"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Quote,
  Star,
  TrendingUp,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function NewTestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animateIn, setAnimateIn] = useState(true);

  // Testimonial data - Consolidated unique testimonials and removed duplicated metrics
  const testimonials = [
    {
      name: "Mark Reynolds",
      role: "Operations Director",
      company: "City Express Logistics",
      quote:
        "We've cut our delivery cycle by 40% and slashed admin hours by 60%. OmniWTMS was quick to deploy with excellent UK-based support throughout.",
      metric: "60% less admin time",
      color: "blue",
    },
    {
      name: "James Crawford",
      role: "Warehouse Manager",
      company: "Northern Logistics",
      quote:
        "We eliminated 95% of our picking errors and doubled throughput within 6 weeks of implementation. The ROI was clear within the first month.",
      metric: "95% error reduction",
      color: "green",
    },
  ];

  // Auto-scroll testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateIn(false);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setAnimateIn(true);
      }, 300);
    }, 8000); // Change testimonial every 8 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Handle manual navigation
  const goToNextTestimonial = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setAnimateIn(true);
    }, 300);
  };

  const goToPrevTestimonial = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setCurrentTestimonial((prev) =>
        prev === 0 ? testimonials.length - 1 : prev - 1
      );
      setAnimateIn(true);
    }, 300);
  };

  // Get color classes based on testimonial
  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          gradient: "from-green-600 to-emerald-600",
          badge: "bg-green-50 text-green-700 border-green-100",
          accent: "text-green-500",
          decoration: "bg-green-50",
        };
      default: // blue
        return {
          gradient: "from-blue-600 to-indigo-600",
          badge: "bg-blue-50 text-blue-700 border-blue-100",
          accent: "text-blue-500",
          decoration: "bg-blue-50",
        };
    }
  };

  const currentColorClasses = getColorClasses(
    testimonials[currentTestimonial].color
  );

  return (
    <div id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 animate-pulse-subtle">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-blue-700">
              SUCCESS STORIES
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Real Results from Real Businesses
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
            OmniWTMS is transforming logistics operations across the UK with
            measurable improvements in efficiency and productivity.
          </p>
        </div>

        {/* Testimonials Display */}
        <div className="relative max-w-4xl mx-auto mb-20">
          <Card
            className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden
                        ${
                          animateIn
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95"
                        }`}
          >
            <div
              className={`h-2 w-full bg-gradient-to-r ${currentColorClasses.gradient}`}
            ></div>
            <CardContent className="p-8 md:p-12 relative">
              {/* Background decorations */}
              <div
                className={`absolute -right-20 -top-20 w-40 h-40 rounded-full ${currentColorClasses.decoration} opacity-20`}
              ></div>
              <div
                className={`absolute -left-20 -bottom-20 w-40 h-40 rounded-full ${currentColorClasses.decoration} opacity-20`}
              ></div>

              {/* Quote Icon */}
              <div className="relative mb-8">
                <Quote className={`w-12 h-12 ${currentColorClasses.accent}`} />
              </div>

              {/* Quote Text */}
              <p className="text-xl md:text-2xl font-medium text-gray-800 mb-10 leading-relaxed">
                "{testimonials[currentTestimonial].quote}"
              </p>

              {/* Author Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-100 pt-6">
                <div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-md text-gray-600">
                    {testimonials[currentTestimonial].role}
                  </div>
                  <div
                    className={`text-md font-semibold bg-gradient-to-r ${currentColorClasses.gradient} bg-clip-text text-transparent`}
                  >
                    {testimonials[currentTestimonial].company}
                  </div>
                </div>
                <div
                  className={`py-3 px-6 rounded-full text-md font-bold ${currentColorClasses.badge} flex items-center gap-2 shadow-sm self-start md:self-auto`}
                >
                  <TrendingUp className="w-5 h-5" />
                  {testimonials[currentTestimonial].metric}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carousel Navigation */}
          <button
            onClick={goToPrevTestimonial}
            className="absolute top-1/2 -left-5 -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-blue-600" />
          </button>

          <button
            onClick={goToNextTestimonial}
            className="absolute top-1/2 -right-5 -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 text-blue-600" />
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mb-16">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentTestimonial === idx
                  ? `w-8 bg-gradient-to-r ${
                      getColorClasses(testimonials[idx].color).gradient
                    }`
                  : "w-2 bg-gray-300 hover:bg-blue-300"
              }`}
              onClick={() => {
                setAnimateIn(false);
                setTimeout(() => {
                  setCurrentTestimonial(idx);
                  setAnimateIn(true);
                }, 300);
              }}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>

        {/* CTA - Replacing duplicate stats with a single clear CTA */}
        <div className="mt-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to see similar results in your business?
          </h3>
          <p className="text-gray-700 mb-6">
            Join hundreds of UK logistics operations that are seeing measurable
            improvements with OmniWTMS.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => (window.location.href = "#contact")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              Book Your Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
