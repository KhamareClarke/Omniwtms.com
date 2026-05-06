import React from "react";
import Head from "next/head";

export default function FeaturesSection() {
  // return (
  //   <>

  // );

  return (
    <>
      <Head>
        <meta
          name="description"
          content="OmniWTMS features: warehouse, transport, analytics, and customer experience tools for UK logistics. Built for speed, accuracy, and control."
        />
      </Head>
      <section
        id="features"
        className="py-20 bg-gradient-to-b from-blue-50 to-white"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text animate-gradient-slow">
            Optimise Every Part of Your Supply Chain
          </h2>
          <p className="text-xl text-gray-700 text-center max-w-2xl mx-auto mb-12 font-medium">
            UK-built for logistics leaders. Every feature designed for speed,
            accuracy, and total control.
          </p>
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Warehouse Operations */}
              <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl border-l-8 border-blue-500 flex flex-col items-start p-8 hover:shadow-2xl transition group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-6">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5M3 9.5L12 4l9 5.5M3 9.5l9 5.5 9-5.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-blue-700 mb-4 tracking-tight">
                  Optimize Your Warehouse Operations
                </h3>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Maximize storage capacity and reduce costs
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Streamline inventory management and tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Improve order fulfillment and shipping accuracy
                  </li>
                </ul>
                <div className="text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-4 py-1 mt-auto">
                  For: Warehouse Managers, Logistics Coordinators
                </div>
              </div>
              {/* Transportation Operations */}
              <div className="relative bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-xl border-l-8 border-indigo-500 flex flex-col items-start p-8 hover:shadow-2xl transition group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-6">
                  <svg
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 13V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v6M5 19h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-indigo-700 mb-4 tracking-tight">
                  Transform Your Transportation Operations
                </h3>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Optimize routes and reduce fuel consumption
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Improve driver safety and reduce accidents
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Enhance customer experience with real-time tracking
                  </li>
                </ul>
                <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full px-4 py-1 mt-auto">
                  For: Transportation Managers, Fleet Operators
                </div>
              </div>
              {/* Data-Driven Insights */}
              <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl border-l-8 border-purple-500 flex flex-col items-start p-8 hover:shadow-2xl transition group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 mb-6">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 3v18h18M3 17l6-6 4 4 8-8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-purple-700 mb-4 tracking-tight">
                  Unlock Data-Driven Insights
                </h3>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Gain real-time visibility into your operations
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Make data-driven decisions with customizable dashboards
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>{" "}
                    Improve operational efficiency and reduce costs
                  </li>
                </ul>
              </div>
              {/* Customer Experience */}
              <div className="relative bg-white rounded-2xl shadow-xl border-l-8 border-green-500 flex flex-col md:flex-row items-center p-6 md:p-8 hover:shadow-2xl transition group">
                <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-xl bg-green-50 mr-0 md:mr-8 mb-4 md:mb-0">
                  <span className="text-4xl">📈</span>
                </div>
                <div className="flex-1 flex flex-col justify-between w-full">
                  <h3 className="text-xl md:text-2xl font-extrabold text-green-700 mb-2 tracking-tight">
                    Delight Your Customers
                  </h3>
                  <ul className="space-y-2 mb-3">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span> Provide
                      real-time order tracking and updates
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span> Offer
                      flexible delivery options and scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span> Improve
                      customer satisfaction and loyalty
                    </li>
                  </ul>
                  <div className="text-xs font-semibold text-gray-500 pt-2">
                    For:{" "}
                    <span className="text-green-700">
                      Customer Service Managers, Marketing Teams
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
