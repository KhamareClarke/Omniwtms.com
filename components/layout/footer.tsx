import { Shield, Globe, Check, Mail, Phone, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { openBookingWidget } from "@/utils/bookingWidget";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

function FooterComponent() {
  const platform = [
    { name: "Warehouse Management", link: "/warehouse-management" },
    { name: "Route Optimization", link: "/route-optimization" },
    { name: "Inventory Control", link: "/inventory-control" },
    { name: "Fleet Management", link: "/fleet-management" },
    { name: "Driver Mobile App", link: "/driver-mobile-app" },
    { name: "AI Forecasting", link: "/ai-forecasting" },
  ];
  const company = [
    { name: "About Us", link: "/about" },
    { name: "Case Studies", link: "/case-studies" },
    { name: "Contact Us", link: "/contact" },
    { name: "Book a Demo", link: "/book-a-demo" },
    { name: "Terms & Privacy", link: "/legal" },
  ];
  const contactInfo = [
    { icon: Phone, info: "+44 20 7946 0982", link: "tel:+442079460982" },
    { icon: Mail, info: "sales@omniwtms.com", link: "mailto:sales@omniwtms.com" },
    { icon: MapPin, info: "45 Liverpool St, London EC2M 7QN", link: "https://maps.google.com/?q=45+Liverpool+St+London" },
    { icon: Clock, info: "Mon-Fri: 9am - 5:30pm GMT", link: null },
  ];
  const trustBadges = [
    { icon: Shield, label: "UK-Based Support" },
    { icon: Globe, label: "ISO 27001 Certified" },
    { icon: Check, label: "GDPR Compliant" },
  ];

  return (
    <footer className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 text-gray-700 py-32 border-t border-gray-200">
      <div className="max-w-8xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-20">

          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Image src="/images/omniwtmslogo.png" alt="OmniWTMS Logo" width={32} height={32} className="object-contain rounded" />
              </div>
              <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text font-extrabold text-xl">OmniWTMS</span>
            </div>
            <p className="text-gray-600 text-base leading-relaxed mb-5 max-w-sm">
              Total logistics command from warehouse to wheels. Over 250 UK logistics operations run on OmniWTMS.
            </p>
            <div className="flex flex-wrap gap-2">
              {trustBadges.map((badge, i) => {
                const Icon = badge.icon;
                const colors = [
                  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: "text-blue-600" },
                  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: "text-purple-600" },
                  { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: "text-green-600" },
                ];
                const color = colors[i];
                return (
                  <span key={i} className={`flex items-center gap-1.5 ${color.bg} ${color.text} rounded-full px-3 py-1 text-xs font-semibold border ${color.border} shadow-sm`}>
                    <Icon className={`w-3.5 h-3.5 ${color.icon}`} />{badge.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Platform column */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text uppercase tracking-widest mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {platform.map((item, i) => (
                <li key={i}><Link href={item.link} className="text-gray-700 hover:text-indigo-600 text-sm transition-colors font-medium">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-2.5">
              {company.map((item, i) => (
                <li key={i}><Link href={item.link} className="text-gray-700 hover:text-purple-600 text-sm transition-colors font-medium">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-bold bg-gradient-to-r from-green-600 to-teal-600 text-transparent bg-clip-text uppercase tracking-widest mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {contactInfo.map((item, i) => {
                const Icon = item.icon;
                const iconColors = ["text-blue-600", "text-purple-600", "text-green-600", "text-indigo-600"];
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <Icon className={`w-4 h-4 ${iconColors[i]} flex-shrink-0 mt-0.5`} />
                    {item.link
                      ? <a href={item.link} className="text-gray-700 hover:text-indigo-600 text-sm transition-colors font-medium">{item.info}</a>
                      : <span className="text-gray-700 text-sm font-medium">{item.info}</span>
                    }
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-8 gap-4">
          <div className="flex gap-5">
            <a href="https://linkedin.com/company/omniwtms" className="text-indigo-500 hover:text-indigo-700 transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </a>
            <a href="https://twitter.com/omniwtms" className="text-blue-500 hover:text-blue-700 transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            </a>
          </div>
          <p className="text-gray-500 text-xs font-medium">&copy; {new Date().getFullYear()} OmniWTMS Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default FooterComponent;
export const Footer = FooterComponent;
