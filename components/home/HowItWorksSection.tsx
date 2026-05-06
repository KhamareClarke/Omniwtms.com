import React from "react";
import { CheckCircle, Clock, Zap, Users } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      icon: Clock,
      title: "Sign Up",
      description: "Create your account in minutes. No credit card required.",
    },
    {
      icon: Zap,
      title: "Configure",
      description: "Our team sets up your warehouse and fleet settings in 48 hours.",
    },
    {
      icon: Users,
      title: "Go Live",
      description: "Start managing operations with real-time visibility and automation.",
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-8xl">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get started in 48 hours with our streamlined onboarding process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <step.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
