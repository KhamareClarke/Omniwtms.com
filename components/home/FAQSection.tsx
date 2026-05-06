"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  // Define FAQ items with questions and answers
  const faqs = [
    {
      question: "Is OmniWTMS right for small businesses?",
      answer:
        "Absolutely! OmniWTMS is designed to scale with your business. Our Starter plan is specifically tailored for small businesses with 1-5 vehicles, while offering all the core features needed to streamline your operations. As your business grows, our platform grows with you.",
    },
    {
      question:
        "Do you support fleet tracking and real-time vehicle monitoring?",
      answer:
        "Yes, OmniWTMS offers comprehensive fleet tracking with real-time GPS monitoring, route optimization, and driver performance analytics. You'll always know where your vehicles are, how efficiently they're performing, and receive instant notifications for any delays or issues.",
    },
    {
      question: "How long does implementation take?",
      answer:
        "Most customers are fully operational within 24-48 hours. Our implementation team provides personalized onboarding and training to ensure your team can start benefiting from OmniWTMS immediately. For larger enterprises with custom needs, our implementation specialists create a tailored timeline.",
    },
    {
      question: "Can OmniWTMS integrate with my existing business software?",
      answer:
        "OmniWTMS is built with integration in mind. We offer seamless connections with popular accounting software, e-commerce platforms, CRM systems, and more. Our API is also available for custom integrations with your proprietary systems.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer 24/7 support via chat, email, and phone. Our UK-based support team consists of logistics experts who understand your business needs. FleetMaster and Titan plans include a dedicated account manager for personalized assistance.",
    },
    {
      question: "How does OmniWTMS handle delivery proof and documentation?",
      answer:
        "Our mobile app allows drivers to capture electronic signatures, photos, barcodes, and notes upon delivery. All documentation is instantly uploaded to the cloud and linked to the appropriate order, providing a complete audit trail and real-time delivery confirmation for you and your customers.",
    },
    {
      question: "Is there a contract or can I pay month-to-month?",
      answer:
        "We offer flexible payment options. You can choose monthly payments with no long-term commitment, or save with our annual plans. There are no hidden fees or cancellation penalties—we believe in earning your business every month.",
    },
    {
      question: "Is there a setup fee or long-term contract?",
      answer:
        "No setup fees, no long-term contracts. Cancel anytime. We believe in transparent pricing with no hidden costs or commitments.",
    },
    {
      question: "What support is included?",
      answer:
        "All plans include unlimited UK-based support by phone, email, and live chat. Our support team is available 24/7 to help you with any questions or issues.",
    },
    {
      question: "Can I migrate from another system?",
      answer:
        "Yes, we provide free onboarding and migration assistance from your current provider. Our team will help you transfer all your data seamlessly with zero downtime.",
    },
    {
      question: "Are all features really included?",
      answer:
        "Yes, every plan includes all core features. Add-ons are optional and only needed for specialized requirements like advanced analytics or custom integrations.",
    },
    {
      question: "Is OmniWTMS secure and GDPR compliant?",
      answer:
        "Yes, we are fully GDPR compliant and ISO 27001 certified. Your data is encrypted at rest and in transit, with regular security audits and backups.",
    },
    {
      question: "What happens to my data if I cancel?",
      answer:
        "You retain full ownership of your data. Upon cancellation, we provide a complete data export in standard formats (CSV, JSON) and maintain your data for 90 days for potential reactivation.",
    },
    {
      question: "Do you offer training for my team?",
      answer:
        "Yes! We provide comprehensive onboarding training for all team members, including video tutorials, live training sessions, and detailed documentation. Our support team is always available for additional training needs.",
    },
    {
      question: "Can I customize the system to match my workflows?",
      answer:
        "Absolutely. OmniWTMS offers extensive customization options including custom fields, workflows, reports, and user permissions. Our Professional and Enterprise plans include custom development support.",
    },
    {
      question: "What mobile devices are supported?",
      answer:
        "Our mobile apps are available for both iOS (iPhone/iPad) and Android devices. The apps work offline and sync automatically when connectivity is restored, ensuring your drivers can work anywhere.",
    },
    {
      question: "How does pricing work for multiple warehouses?",
      answer:
        "Our pricing scales with your business. Each plan includes support for multiple warehouses, with pricing based on the number of active vehicles/drivers. Contact us for custom enterprise pricing for large multi-site operations.",
    },
    {
      question: "Can customers track their deliveries in real-time?",
      answer:
        "Yes! OmniWTMS includes a customer portal and tracking page where your customers can see real-time delivery status, estimated arrival times, and driver location. Automated SMS and email notifications keep them informed every step of the way.",
    },
    {
      question: "What reports and analytics are available?",
      answer:
        "OmniWTMS provides comprehensive reporting including delivery performance, driver efficiency, inventory levels, revenue analytics, and custom reports. All reports can be scheduled for automatic delivery and exported in multiple formats.",
    },
    {
      question: "How does the AI route optimization work?",
      answer:
        "Our AI engine analyzes traffic patterns, delivery windows, vehicle capacity, and historical data to create the most efficient routes. It continuously learns from your operations and can reduce fuel costs by up to 30% while improving delivery times.",
    },
  ];

  return (
    <section id="faq" className="py-32 bg-gray-50 border-b border-gray-200">
      <div className="max-w-8xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about OmniWTMS
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.slice(0, 6).map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-base font-semibold text-gray-800 hover:text-blue-600 py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Still have questions?{" "}
            <a
              href="#contact"
              className="text-blue-600 font-medium hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
