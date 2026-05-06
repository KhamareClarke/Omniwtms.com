"use client";

import { useState } from "react";
import { Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function VideoShowcase() {
  const [videoPlaying, setVideoPlaying] = useState(false);

  const startVideo = () => {
    setVideoPlaying(true);
  };

  // List of integrations to show underneath the video
  const integrations = [
    { name: "Shopify", logo: "/images/shopify.jpeg" },
    { name: "Amazon", logo: "/images/amazon.jpeg" },
    { name: "eBay", logo: "/images/ebay.jpeg" },
    { name: "Etsy", logo: "/images/etsy.jpeg" },
    { name: "QuickBooks", logo: "/images/books.jpeg" },
    { name: "Xero", logo: "/images/xero.jpeg" },
  ];
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
            <Play className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              See it in action
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Watch how OmniWTMS transforms your operations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our 2-minute demo shows how you can track every delivery, manage
            inventory in real-time, and eliminate paperwork from day one.
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-4xl mx-auto relative bg-black/5 rounded-xl overflow-hidden shadow-2xl mb-10">
          {!videoPlaying ? (
            // Video Thumbnail with Play Button
            <div
              className="aspect-video relative group cursor-pointer"
              onClick={startVideo}
            >
              {/* Replace with your actual video thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 group-hover:opacity-75 transition-opacity z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-blue-600 ml-1" />
                </div>
              </div>
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                {/* Replace with actual thumbnail image */}
                <span className="text-white/50 text-lg">
                  OmniWTMS Product Demo
                </span>
                {/* Uncomment if you have an actual thumbnail image
                <Image 
                  src="/images/video-thumbnail.jpg" 
                  alt="OmniWTMS Demo Video Thumbnail" 
                  layout="fill" 
                  objectFit="cover" 
                  priority 
                />
                */}
              </div>
            </div>
          ) : (
            // Embedded Video - Replace with your actual video embed code
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" // Replace with actual video URL
                title="OmniWTMS Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Video Features */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white hidden md:block">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Real warehouse tour</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Live tracking demo</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">
                  Inventory management
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">
                  Customer portal preview
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Logos */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-medium text-gray-900 mb-6">
            Integrates with all your favorite platforms
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
            {integrations.map((integration, i) => (
              <div
                key={i}
                className="bg-white px-4 py-2 h-[100px] flex justify-center items-center w-28  rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* If you have actual logo images, use this: */}
                <img
                  src={integration.logo}
                  alt={integration.name}
                  // width={100}
                  // height={40}
                  className="text-gray-700 h-auto w-auto max-h-20 max-w-20 object-contain"
                />

                {/* Placeholder until you add real logos */}
                {/* <div className="w-20 h-10 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {integration.name}
                  </span>
                </div> */}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">
            ...and many more popular e-commerce platforms and accounting
            services
          </div>
        </div>
      </div>
    </div>
  );
}
