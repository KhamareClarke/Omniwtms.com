'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, Info, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    // Check if we're on the client side
    setIsMounted(true);
    
    // Check if consent was already given
    try {
      const consentGiven = localStorage.getItem('cookie-consent');
      console.log('Cookie consent check - stored value:', consentGiven);
      
      if (!consentGiven) {
        // Only show banner if consent hasn't been given
        console.log('No consent found, showing banner');
        setIsVisible(true);
      } else {
        // Ensure banner is hidden if consent was given
        console.log('Consent found, hiding banner');
        setIsVisible(false);
      }
    } catch (error) {
      // If localStorage is not available, show the banner
      console.warn('localStorage not available:', error);
      setIsVisible(true);
    }
    
    // Track viewport width for device-specific styles
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    // Set initial width
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const acceptAll = () => {
    console.log('Accept All clicked');
    try {
      localStorage.setItem('cookie-consent', 'all');
      console.log('localStorage set to "all"');
    } catch (error) {
      console.warn('Failed to save cookie consent to localStorage:', error);
    }
    setIsVisible(false);
    console.log('isVisible set to false');
  };
  
  const acceptEssential = () => {
    console.log('Accept Essential clicked');
    try {
      localStorage.setItem('cookie-consent', 'essential');
      console.log('localStorage set to "essential"');
    } catch (error) {
      console.warn('Failed to save cookie consent to localStorage:', error);
    }
    setIsVisible(false);
    console.log('isVisible set to false');
  };

  const closeBanner = () => {
    console.log('Close banner clicked');
    try {
      localStorage.setItem('cookie-consent', 'dismissed');
      console.log('localStorage set to "dismissed"');
    } catch (error) {
      console.warn('Failed to save cookie consent to localStorage:', error);
    }
    setIsVisible(false);
    console.log('isVisible set to false');
  };

  if (!isMounted) return null;
  
  // Google Pixel 8 has a viewport width of around 412px
  const isPixel8Width = viewportWidth >= 380 && viewportWidth <= 420;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-blue-100 shadow-lg w-full"
        >
          <div className={`w-full max-w-7xl mx-auto px-3 py-4 ${isPixel8Width ? 'px-2 py-3' : 'sm:p-4 md:p-6'} relative`}>
            {/* Close button */}
            <button 
              onClick={closeBanner}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer pointer-events-auto z-10"
              style={{ pointerEvents: 'auto' }}
              aria-label="Close cookie banner"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full hidden sm:block">
                <Cookie className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              
              <div className="flex-grow min-w-0 flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 flex items-center gap-2 text-gray-900">
                  <Cookie className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900">We Value Your Privacy</span>
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed mb-3">
                  OmniWTMS uses cookies to deliver essential site functionality, analyze usage, and personalize your experience. You can choose which cookies to allow, and change your preferences anytime.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">GDPR/UK/EU Compliant</span>
                  <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-row gap-2 sm:gap-3 w-full md:w-auto mt-3 md:mt-0 justify-center relative z-10">
                <Button 
                  onClick={acceptEssential}
                  variant="outline"
                  className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm py-1 px-2 sm:px-4 h-auto cursor-pointer pointer-events-auto relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  Essential Only
                </Button>
                
                <Button 
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-1 px-3 sm:px-4 h-auto cursor-pointer pointer-events-auto relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  Accept All
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center md:justify-end mt-2">
              <button 
                onClick={acceptEssential} 
                className="text-gray-500 hover:text-gray-700 text-xs underline"
              >
                Customize Settings
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
