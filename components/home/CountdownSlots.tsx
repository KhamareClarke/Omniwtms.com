import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function CountdownSlots() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold mt-4 mb-8">
      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
        <CheckCircle className="h-4 w-4" />
        <span>No setup fees</span>
      </div>
      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
        <CheckCircle className="h-4 w-4" />
        <span>Cancel anytime</span>
      </div>
      <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full border border-purple-200">
        <CheckCircle className="h-4 w-4" />
        <span>Free onboarding included</span>
      </div>
      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full border border-indigo-200">
        <CheckCircle className="h-4 w-4" />
        <span>UK data residency</span>
      </div>
    </div>
  );
}
