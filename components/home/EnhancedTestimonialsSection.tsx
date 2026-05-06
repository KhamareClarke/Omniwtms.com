'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star, TrendingUp, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EnhancedTestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Testimonial data
  const testimonials = [
    {
      name: "Mark Reynolds",
      role: "Operations Director",
      company: "City Express Logistics",
      quote: "We've cut our delivery cycle by 40% and slashed admin hours by 60%. OmniWTMS was quick to deploy with excellent UK-based support throughout.",
      metric: "40% faster deliveries"
    },
    {
      name: "Sarah Patel",
      role: "Warehouse Manager",
      company: "Northern Distribution Ltd",
      quote: "Since implementing OmniWTMS, our warehouse productivity has jumped 60%. The system practically runs itself — my team wonders how we ever managed without it.",
      metric: "60% higher productivity"
    },
    {
      name: "David Thompson",
      role: "Managing Director",
      company: "Midlands Freight Solutions",
      quote: "Full ROI in just 8 weeks. We're saving £79,000 monthly on operational costs while actually scaling up volume. Best systems investment we've ever made.",
      metric: "8-week ROI payback"
    }
  ];
    
  // Auto-scroll testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000); // Change testimonial every 8 seconds
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  // Handle manual navigation
  const goToNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };
  
  const goToPrevTestimonial = () => {
    setCurrentTestimonial((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <div id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 animate-pulse-subtle">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-blue-700">UK WAREHOUSE SUCCESS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            What our clients are saying
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto animate-slide-up font-medium">
            From small warehouses to enterprise distribution centers, OmniWTMS is the backbone of UK logistics operations.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative mb-16">
          {/* Carousel Container */}
          <div className="overflow-hidden relative h-[450px] md:h-[380px]">
            <div className="flex h-full transition-transform duration-1000 ease-out">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  style={{ transform: `translateX(${(index - currentTestimonial) * 100}%)`, position: 'absolute', width: '100%' }}
                  className={`transition-all duration-1000 ease-out px-4 md:px-16 ${Math.abs(currentTestimonial - index) > 1 ? 'opacity-0' : 'opacity-100'}`}
                >
                  <Card className="h-full border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6 md:p-10 h-full flex flex-col justify-between">
                      {/* Top gradient bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                      
                      {/* Background decorations */}
                      <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-50 opacity-20"></div>
                      <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-indigo-50 opacity-20"></div>
                      
                      <div>
                        {/* Quote Icon with glow effect */}
                        <div className="relative mb-6">
                          <Quote className="w-10 h-10 text-blue-500 animate-float" />
                          <div className="absolute top-0 left-0 w-10 h-10 bg-blue-300 rounded-full filter blur-xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
                        </div>
                        
                        {/* Quote Text */}
                        <p className="text-xl md:text-2xl font-medium text-gray-800 mb-10 leading-relaxed">
                          "{testimonial.quote}"
                        </p>
                      </div>
                      
                      {/* Author Info */}
                      <div className="border-t border-gray-100 pt-6 flex items-start justify-between">
                        <div>
                          <div className="text-xl font-bold text-gray-900 mb-1">{testimonial.name}</div>
                          <div className="text-md text-gray-600">{testimonial.role}</div>
                          <div className="text-md font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{testimonial.company}</div>
                        </div>
                        <div className="py-2 px-4 rounded-full text-sm font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-100 flex items-center gap-1 shadow-sm">
                          <TrendingUp className="w-4 h-4" />
                          {testimonial.metric}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Carousel Navigation */}
            <button 
              onClick={goToPrevTestimonial}
              className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 text-blue-600" />
            </button>
            
            <button 
              onClick={goToNextTestimonial}
              className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </button>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${currentTestimonial === idx ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-blue-300'}`}
                onClick={() => setCurrentTestimonial(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Company Logos */}
        <div className="flex flex-wrap justify-center gap-8 items-center py-8 opacity-60">
          <div className="text-xl font-bold text-gray-400">Trusted by leading logistics companies</div>
        </div>
      </div>
    </div>
  );
}
