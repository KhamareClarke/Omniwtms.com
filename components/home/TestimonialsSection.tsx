'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quote, Star, TrendingUp, BarChart2, Clock, CheckCircle } from 'lucide-react';

export default function TestimonialsSection() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [animateStats, setAnimateStats] = useState(false);
  const [countValues, setCountValues] = useState({
    delivery: 0,
    productivity: 0,
    roi: 0
  });
  
  // Intersection Observer to trigger stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setAnimateStats(true);
      }
    }, { threshold: 0.5 });
    
    const statsSection = document.getElementById('stats-section');
    if (statsSection) observer.observe(statsSection);
    
    return () => {
      if (statsSection) observer.unobserve(statsSection);
    };
  }, []);
  
  // Animate the statistics when in view
  useEffect(() => {
    if (animateStats) {
      const duration = 2000; // 2 seconds for the animation
      const frameRate = 30; // Update ~30 times per second
      const totalFrames = duration / (1000 / frameRate);
      const deliveryIncrement = 40 / totalFrames;
      const productivityIncrement = 60 / totalFrames;
      const roiIncrement = 8 / totalFrames;
      let frame = 0;
      
      const timer = setInterval(() => {
        if (frame < totalFrames) {
          setCountValues({
            delivery: Math.min(40, Math.ceil(frame * deliveryIncrement)),
            productivity: Math.min(60, Math.ceil(frame * productivityIncrement)),
            roi: Math.min(8, Math.ceil(frame * roiIncrement))
          });
          frame++;
        } else {
          clearInterval(timer);
        }
      }, 1000 / frameRate);
      
      return () => clearInterval(timer);
    }
  }, [animateStats]);

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Operations Director',
      company: 'Rapid Courier Services',
      quote: 'We tried 3 different WMS systems before OmniWTMS. Finally found a logistics platform that actually does what it promises. 40% faster operations in 3 weeks.',
      category: 'operations',
      metric: '40% faster operations'
    },
    {
      name: 'James Crawford',
      role: 'Warehouse Manager',
      company: 'Northern Logistics',
      quote: 'Adding barcode scanning with OmniWTMS eliminated 95% of our picking errors and doubled our throughput. The team actually enjoys using it.',
      category: 'warehouse',
      metric: '95% error reduction'
    },
    {
      name: 'Emma Thompson',
      role: 'CEO',
      company: 'Swift Distribution',
      quote: 'ROI was visible in weeks, not months. Having all our data in one command center lets us make decisions in minutes instead of days.',
      category: 'ceo',
      metric: '8-week ROI payback'
    }
  ];

  const companies = [
    'Bolt Freight', 'Northern Logistics', 'Swift Distribution',
    'UK Express', 'Metro Courier', 'Prime Fulfillment'
  ];

  const roleFilters = [
    { id: 'all', label: 'All Roles' },
    { id: 'ceo', label: 'CEO' },
    { id: 'operations', label: 'Operations' },
    { id: 'warehouse', label: 'Warehouse' }
  ];

  const filteredTestimonials = selectedRole === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.category === selectedRole);

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 animate-pulse-subtle">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-blue-700">Verified Client Results</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
            Trusted by Leading UK Logistics Companies
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-slide-up">
            Join the operators who've transformed chaos into command with OmniWTMS.
          </p>
        </div>

        {/* Company Logos */}
        <div className="mb-16">
          <p className="text-center text-gray-500 mb-8 animate-fade-in">
            Trusted by UK's top 3PLs & fulfillment centers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {companies.map((company, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in hover-lift" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gray-100 bg-opacity-70 backdrop-blur-sm rounded-lg p-4 h-16 flex items-center justify-center mb-2 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                  <span className="text-gray-600 font-medium text-sm">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex space-x-4 mt-8 mb-10 justify-center">
          {roleFilters.map(filter => (
            <Button
              key={filter.id}
              variant="outline"
              size="sm"
              className={`rounded-full ${selectedRole === filter.id ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50'}`}
              onClick={() => setSelectedRole(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredTestimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-50 opacity-50"></div>
                <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-green-50 opacity-30"></div>
                
                {/* Rating Stars - with animation */}
                <div className="flex items-center mb-5 relative">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5 text-yellow-400 fill-current animate-pulse-subtle" 
                      style={{ animationDelay: `${i * 0.2}s`, animationDuration: '3s' }}
                    />
                  ))}
                </div>
                
                {/* Quote Icon with glow effect */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-blue-500 mb-4 animate-float" />
                  <div className="absolute top-0 left-0 w-8 h-8 bg-blue-300 rounded-full filter blur-xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
                </div>
                
                {/* Quote Text */}
                <p className="text-gray-700 mb-6 italic relative">
                  "{testimonial.quote}"
                </p>
                
                {/* Author Info */}
                <div className="border-t pt-4 relative">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm font-medium text-blue-600">{testimonial.company}</div>
                  <div className="text-sm font-medium text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {testimonial.metric}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Summary */}
        <div id="stats-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-lg animate-fade-in">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-blue-100 hover-lift">
            <div className="flex justify-center mb-4">
              <TrendingUp className="w-10 h-10 text-blue-500 animate-pulse-subtle" />
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2 relative">
              <span className="inline-block min-w-[4rem]">{animateStats ? countValues.delivery : 0}%</span>
              <div className="absolute -right-2 top-0 w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
            </div>
            <div className="text-gray-600">Average delivery time reduction</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-green-100 hover-lift">
            <div className="flex justify-center mb-4">
              <BarChart2 className="w-10 h-10 text-green-500 animate-pulse-subtle" />
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2 relative">
              <span className="inline-block min-w-[4rem]">{animateStats ? countValues.productivity : 0}%</span>
              <div className="absolute -right-2 top-0 w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
            </div>
            <div className="text-gray-600">Warehouse productivity increase</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-orange-100 hover-lift">
            <div className="flex justify-center mb-4">
              <Clock className="w-10 h-10 text-orange-500 animate-pulse-subtle" />
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-2 relative">
              <span className="inline-block min-w-[4rem]">{animateStats ? countValues.roi : 0} Weeks</span>
              <div className="absolute -right-2 top-0 w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
            </div>
            <div className="text-gray-600">Average ROI payback period</div>
          </div>
        </div>
      </div>
    </div>
  );
}