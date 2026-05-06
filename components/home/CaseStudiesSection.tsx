import React from 'react';
import { openBookingWidget } from '@/utils/bookingWidget';

export default function CaseStudiesSection() {
  return (
    <section id="case-studies" className="py-32 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-8xl">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            Customer Results
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real improvements from live customer deployments
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { tag: "3PL",         stat: "60% Less Admin Time",    quote: "Onboarding new clients in hours, not weeks. Admin workload dropped by half.",      author: "Operations Director, City Express Logistics", tagBg: "bg-blue-100",   tagText: "text-blue-700",   border: "border-blue-100",   statGrad: "from-blue-600 via-blue-700 to-indigo-600"   },
            { tag: "E-Commerce",  stat: "99.8% Accuracy",          quote: "No more stockouts or mis-picks. Total trust in the numbers.",                     author: "Head of Fulfillment, ShopRocket",              tagBg: "bg-purple-100", tagText: "text-purple-700", border: "border-purple-100", statGrad: "from-purple-600 via-purple-700 to-indigo-600" },
            { tag: "Transport",   stat: "Fleet Billing Cut by 40%", quote: "We see every delivery in real time and bill clients in minutes, not days.",       author: "Fleet Manager, UK National Couriers",          tagBg: "bg-green-100",  tagText: "text-green-700",  border: "border-green-100",  statGrad: "from-green-600 via-green-700 to-teal-600"    },
          ].map((c) => (
            <div key={c.tag} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow`}>
              <span className={`inline-block px-3 py-1 ${c.tagBg} ${c.tagText} font-semibold rounded-full text-xs mb-4 self-start`}>{c.tag}</span>
              <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${c.statGrad} text-transparent bg-clip-text`}>{c.stat}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">&ldquo;{c.quote}&rdquo;</p>
              <div className="mt-auto pt-4 border-t border-gray-100 text-sm text-slate-500 font-medium">{c.author}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
