'use client';

import { ChevronRight, Building, TrendingUp, Clock, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function CaseStudy() {
  const caseStudy = {
    company: 'Northern Logistics',
    logo: '/companies/northern-logistics.svg',
    industry: 'Regional courier and delivery services',
    challenge: 'Struggling with 12% error rate in picking, 4-day delivery backlog, and customer satisfaction at just 68%',
    solution: 'Implemented OmniWTMS with route optimization, real-time tracking, and inventory management',
    results: [
      { metric: 'Picking accuracy', improvement: 'Increased to 99.5%' },
      { metric: 'Delivery times', improvement: 'Reduced by 40%' },
      { metric: 'Customer satisfaction', improvement: 'Increased to 94%' },
      { metric: 'Staff productivity', improvement: 'Improved by 28%' }
    ],
    quote: 'We doubled throughput and cut delivery times by 40% — ROI showed in the first month.',
    personName: 'James Crawford',
    personRole: 'Warehouse Manager',
    timeline: '6 weeks from implementation to full optimization',
    additionalQuote: 'In just 6 weeks, we eliminated 95% of operational errors and scaled faster than expected.',
    additionalPersonName: 'Sarah Patel',
    additionalPersonRole: 'Warehouse Manager'
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 py-3 px-6">
        <h3 className="text-white text-lg font-medium">📊 Real Results, Real Fast</h3>
      </div>
      
      <div className="p-6 md:p-8">
        {/* Header with company info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 h-16 w-16 flex items-center justify-center mr-4">
              {/* If you have actual logo images, use this instead */}
              {/* <Image src={caseStudy.logo} alt={caseStudy.company} width={60} height={60} /> */}
              <Building className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Case Study: {caseStudy.company}</h4>
              <p className="text-gray-600 text-sm">{caseStudy.industry}</p>
            </div>
          </div>
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-sm font-medium inline-flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {caseStudy.timeline}
          </div>
        </div>
        
        {/* Before and After */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h5 className="text-sm font-semibold text-red-600 uppercase mb-3">Before OmniWTMS</h5>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="inline-block text-red-500 mr-2">❌</span>
                <span className="text-gray-800">12% picking error rate</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block text-red-500 mr-2">❌</span>
                <span className="text-gray-800">4-day order backlog</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h5 className="text-sm font-semibold text-green-600 uppercase mb-3">After OmniWTMS</h5>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="inline-block text-green-500 mr-2">✅</span>
                <span className="text-gray-800">99.5% pick accuracy</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block text-green-500 mr-2">✅</span>
                <span className="text-gray-800">40% faster delivery turnaround</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block text-green-500 mr-2">✅</span>
                <span className="text-gray-800">94% customer satisfaction</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block text-green-500 mr-2">✅</span>
                <span className="text-gray-800">28% boost in staff productivity</span>
              </li>
            </ul>
          </div>
        </div>
        

        
        {/* Quotes */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
            <p className="text-gray-800 italic mb-3">"{caseStudy.quote}"</p>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-700 font-bold">{caseStudy.personName.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{caseStudy.personName}</p>
                <p className="text-sm text-gray-600">{caseStudy.personRole}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-5 border-l-4 border-indigo-500">
            <p className="text-gray-800 italic mb-3">"{caseStudy.additionalQuote}"</p>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-indigo-700 font-bold">{caseStudy.additionalPersonName.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{caseStudy.additionalPersonName}</p>
                <p className="text-sm text-gray-600">{caseStudy.additionalPersonRole}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div>
            <h5 className="font-semibold text-gray-900">🚀 Want similar results for your business?</h5>
            <p className="text-gray-600 text-sm">Book a 1-on-1 demo to see how OmniWTMS transforms operations in under 10 minutes</p>
          </div>
          <Button 
            onClick={() => {}} 
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 flex items-center"
          >
            👉 Book Your Demo <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
