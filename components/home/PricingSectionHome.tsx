import React from "react";
import CountdownSlots from "./CountdownSlots";

import Head from "next/head";
import { useState } from "react";
import PlanCtaModal from "./PlanCtaModal";
import { openBookingWidget } from "@/utils/bookingWidget";

export default function PricingSectionHome() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | null>(
    null
  );
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Transparent UK SaaS pricing for OmniWTMS. No setup fees, cancel anytime, all features included. Compare plans and book your free demo today!"
        />
      </Head>
      <section
        id="pricing"
        className="py-32 bg-white border-b border-gray-200"
      >
        <div className="container mx-auto px-4 max-w-8xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
              Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              All plans include every feature, UK-based support, and rapid onboarding. No setup fees. Cancel anytime.
            </p>
          </div>
          <CountdownSlots />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Starter Plan */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition flex flex-col relative">
              <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                Starter
              </span>
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                £599<span className="text-base font-medium">/mo</span>
              </h3>
              <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1 text-sm">
                <li>Up to 1,000 deliveries/month</li>
                <li>5 users</li>
                <li>1 warehouse</li>
                <li>50GB data storage</li>
              </ul>
              <div className="text-gray-600 text-sm mb-4">
                Small UK warehouses & courier firms
              </div>
              <button
                onClick={() => { setSelectedPlan("starter"); setModalOpen(true); }}
                className="mt-auto inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 text-center cursor-pointer w-full"
              >
                Get Started
              </button>
            </div>
            {/* Growth Plan */}
            <div className="bg-white rounded-xl border-2 border-indigo-500 shadow-lg p-6 hover:shadow-xl transition flex flex-col relative scale-105 z-10">
              <span className="absolute top-4 right-4 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Growth
              </span>
              <h3 className="text-2xl font-bold text-indigo-700 mb-2">
                £1,199<span className="text-base font-medium">/mo</span>
              </h3>
              <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1 text-sm">
                <li>Up to 10,000 deliveries/month</li>
                <li>25 users</li>
                <li>Multi-warehouse</li>
                <li>Priority support</li>
                <li>500GB data storage</li>
              </ul>
              <div className="text-gray-600 text-sm mb-4">
                Scaling 3PLs & regional distribution firms
              </div>
              <button
                onClick={() => { setSelectedPlan("growth"); setModalOpen(true); }}
                className="mt-auto inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 text-center cursor-pointer w-full"
              >
                Get Started
              </button>
            </div>
            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition flex flex-col relative">
              <span className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                Enterprise
              </span>
              <h3 className="text-2xl font-bold text-purple-700 mb-2">
                Custom
              </h3>
              <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1 text-sm">
                <li>Unlimited deliveries</li>
                <li>Unlimited users</li>
                <li>Dedicated account manager</li>
                <li>Custom integrations</li>
                <li>Unlimited data storage</li>
              </ul>
              <div className="text-gray-600 text-sm mb-4">
                Flexible contracts. Dedicated onboarding.
              </div>
              <button
                onClick={openBookingWidget}
                className="mt-auto inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 text-center cursor-pointer w-full"
              >
                Talk to Sales
              </button>
            </div>
          </div>

          {/* All Plans Include */}
          <div className="w-full flex justify-center mt-12">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 max-w-4xl w-full">
              <p className="text-sm font-semibold text-gray-800 mb-3">All plans include:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">Unlimited UK support</span>
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">UK data residency</span>
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">Free onboarding</span>
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">All integrations</span>
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">Mobile & desktop</span>
                <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">Security & compliance</span>
              </div>
            </div>
          </div>

        </div>
        <PlanCtaModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          plan={selectedPlan as "starter" | "growth"}
        />
      </section>
    </>
  );
}
