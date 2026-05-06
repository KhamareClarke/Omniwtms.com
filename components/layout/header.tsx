"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { openBookingWidget } from "@/utils/bookingWidget";
import { Container } from "@/components/ui/container";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Solutions", href: "/#solutions" },
    { name: "Case Studies", href: "/#case-studies" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Contact", href: "/#contact" },
  ];
  const router = useRouter();

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-lg backdrop-blur-lg py-1.5 border-b border-blue-100"
            : "bg-gradient-to-r from-blue-50 via-white to-indigo-50 py-2 border-b border-blue-100"
        }`}
      >
        <Container size="main" className="!max-w-7xl">
          <div className="flex items-center justify-between h-[52px]">
            {/* Logo with Link */}
            <Link
              href="/"
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="relative w-10 h-10 flex-shrink-0 group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-100 to-purple-100 p-1.5 rounded-lg shadow-md group-hover:shadow-lg">
                <Image
                  src="/images/omniwtmslogo.png"
                  alt="OmniWTMS Logo"
                  width={64}
                  height={64}
                  className="object-contain rounded-md"
                  priority={true}
                  loading="eager"
                  unoptimized={false}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text animate-gradient-slow">
                  OmniWTMS
                </span>
                <div className="text-[9px] font-medium text-blue-600 -mt-1">
                  Command Your Chain
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-800 hover:text-blue-600 font-semibold transition-all duration-200 text-base hover:scale-105"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/auth/login")}
                className="px-6 py-2.5 text-blue-700 hover:text-white font-bold transition-all duration-300 border-2 border-blue-500 rounded-xl hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 text-base shadow-md hover:shadow-2xl hover:scale-105 hover:border-transparent backdrop-blur-sm bg-white/80"
              >
                Sign In
              </Button>
              <Button
                variant="default"
                size="sm"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 text-base hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 relative overflow-hidden group"
                onClick={openBookingWidget}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="pt-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/auth/login")}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={openBookingWidget}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </header>

    </>
  );
}
export { Header };
