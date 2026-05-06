"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Video,
  Send,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const steps = [
  {
    key: "name",
    prompt:
      "Hi, I’m Areo—your dedicated logistics AI employee. Whether you’re looking to streamline operations, boost accuracy, or accelerate growth, I’m here to help you achieve your goals.\nWhat can I assist you with today?",
    required: true,
  },
  {
    key: "email",
    prompt:
      "Great to meet you, {name}! What's your best email? (We'll never spam you)",
    required: true,
  },
  {
    key: "company",
    prompt: "Thanks! Which company are you with? (Optional, you can skip)",
    required: false,
  },
  {
    key: "phone",
    prompt:
      "And your phone number? (Optional, we'll only use it for your request)",
    required: false,
  },
];

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(0);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; content: string }[]
  >([
    {
      type: "bot",
      content: steps[0].prompt,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [offerNext, setOfferNext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const projectId = "majestic-effect-456221-t3";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Chatbot starts closed on all devices
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false); // Keep closed on all devices
        setIsAnimating(false);
      }, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadSubmitted) return;
    const currentStep = steps[step];
    const value = inputValue.trim();
    if (currentStep.required && !value) return;
    setLeadForm((prev) => ({ ...prev, [currentStep.key]: value }));
    setMessages((prev) => [
      ...prev,
      { type: "user", content: value || "[Skipped]" },
    ]);
    setInputValue("");
    if (step < steps.length - 1) {
      let prompt = steps[step + 1].prompt;
      if (steps[step + 1].key === "email" && leadForm.name) {
        prompt = prompt.replace("{name}", leadForm.name);
      } else if (prompt.includes("{name}")) {
        prompt = prompt.replace("{name}", "");
      }
      setTimeout(() => {
        setMessages((prev) => [...prev, { type: "bot", content: prompt }]);
        setStep((prev) => prev + 1);
      }, 400);
    } else {
      setTimeout(() => {
        setLeadSubmitted(true);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "Thank you! Our team will be in touch soon. Would you like to book a demo now? (yes/no)",
          },
        ]);
        setOfferNext(true);
      }, 400);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerNext) return;
    const v = inputValue.trim().toLowerCase();
    setMessages((prev) => [...prev, { type: "user", content: v }]);
    setInputValue("");
    setOfferNext(false);
    setTimeout(() => {
      if (v === "yes" || v === "y") {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "Awesome! We'll send you a demo booking link shortly.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "No problem! If you change your mind, just let us know.",
          },
        ]);
      }
    }, 400);
  };

  return (
    <div
      className="fixed bottom-2 left-2 right-2 sm:bottom-6 sm:left-auto sm:right-6 z-50 flex flex-col items-end font-sans max-w-full w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md"
      style={{ width: "100%", maxWidth: "100vw" }}
    >
      {isOpen && (
        <div className="mb-4 bg-gradient-to-br from-[#0a1642] via-[#1a237e] to-[#2e1667] rounded-3xl shadow-2xl border-2 border-white/80 w-full max-w-[95vw] sm:max-w-sm overflow-hidden transition-all duration-500 animate-fade-in">
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white border border-blue-100 shadow-md flex items-center justify-center">
                  <Image
                    src="/images/chatbot-logo.png"
                    alt="Chatbot Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    priority
                    unoptimized={false}
                  />
                </div>
                <span className="font-sora text-base sm:text-lg font-medium tracking-tight bg-gradient-to-r from-blue-400 via-purple-300 to-indigo-400 text-transparent bg-clip-text drop-shadow-sm antialiased">
                  AI Customer Support
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 p-0 flex items-center justify-center aspect-square rounded-full bg-white/80 hover:bg-gray-200 focus:outline-none border border-blue-100"
              aria-label="Close chat"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          {/* Chat messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-4 bg-white/90 border-t border-blue-100">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md text-base font-sora antialiased ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold border-0"
                      : "bg-white text-gray-900 border border-blue-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input for chat (step-by-step or demo offer) */}
          {!leadSubmitted && !offerNext && (
            <form
              onSubmit={handleSubmit}
              className="border-t p-3 bg-white/90 flex gap-2"
            >
              <input
                type={
                  steps[step].key === "email"
                    ? "email"
                    : steps[step].key === "phone"
                    ? "tel"
                    : "text"
                }
                className="flex-1 px-4 py-2 rounded-2xl shadow-md bg-white/95 border-2 border-blue-200 text-base font-sora antialiased focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={
                  steps[step].key === "phone"
                    ? "Phone (optional)"
                    : steps[step].key === "company"
                    ? "Company (optional)"
                    : ""
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required={steps[step].required}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl border-4 border-white/80 font-sora antialiased hover:scale-110 transition-transform duration-200"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          )}
          {/* Offer next step (demo booking) */}
          {offerNext && (
            <form
              onSubmit={handleNextStep}
              className="border-t p-3 bg-white/90 flex gap-2"
            >
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-2xl shadow-md bg-white/95 border-2 border-blue-200 text-base font-sora antialiased focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type yes or no..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl border-4 border-white/80 font-sora antialiased hover:scale-110 transition-transform duration-200"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          )}
        </div>
      )}
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
    h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-2xl flex items-center justify-center
    bg-gradient-to-br from-[#0a1642] via-[#1a237e] to-[#2e1667] border-4 border-white/80 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300/50
    font-sora text-xl font-bold uppercase antialiased
  `}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
        ) : (
          <div className="flex items-center justify-center">
            <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
          </div>
        )}
      </button>
    </div>
  );
};

export default LiveChatWidget;
