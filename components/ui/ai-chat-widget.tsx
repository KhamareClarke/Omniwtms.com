// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Loader2,
  Sparkles,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "suggestion" | "insight" | "warning" | "tip";
  isThinking?: boolean;
}

interface Suggestion {
  text: string;
  icon: JSX.Element;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState("");

  const suggestions: Suggestion[] = [
    { text: "Optimize warehouse layout", icon: <Brain className="h-4 w-4" /> },
    {
      text: "Analyze inventory trends",
      icon: <Sparkles className="h-4 w-4" />,
    },
    { text: "Improve picking efficiency", icon: <Zap className="h-4 w-4" /> },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typeWriterEffect = async (text: string, messageIndex: number) => {
    setIsTypingEffect(true);
    let currentText = "";

    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      setCurrentTypingText(currentText);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    setIsTypingEffect(false);
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, content: text, isThinking: false }
          : msg
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const thinkingMessage: Message = {
      role: "assistant",
      content: "...",
      timestamp: new Date(),
      isThinking: true,
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          apiKey: "AIzaSyCmnI73OESJ_iAVnVl8DAv9_t13ykvC7l8",
        }),
      });

      const data = await response.json();

      // Start typewriter effect for the response
      typeWriterEffect(data.response, messages.length + 1);
    } catch (error) {
      console.error("Error calling AI API:", error);
      setMessages((prev) => prev.filter((msg) => !msg.isThinking));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  const handleReset = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed z-50 rounded-2xl shadow-2xl",
              isExpanded ? "inset-4 md:inset-8" : "bottom-20 right-4 w-[400px]"
            )}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    <Bot className="h-6 w-6 text-white relative z-10" />
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      AI Assistant
                      <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs font-normal">
                        Gemini Pro
                      </span>
                    </div>
                    <div className="text-xs text-white/70 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                      Online
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && showSuggestions && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3456FF] to-[#8763FF] mx-auto flex items-center justify-center mb-4">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                        AI-Powered Warehouse Assistant
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        How can I help optimize your operations today?
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            {suggestion.icon}
                          </div>
                          <span className="text-sm text-gray-700">
                            {suggestion.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={cn(
                      "flex gap-3 items-start",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        message.role === "user"
                          ? "bg-gradient-to-br from-[#3456FF] to-[#8763FF] text-white"
                          : "bg-gray-100"
                      )}
                    >
                      {message.role === "user" ? (
                        <div className="font-semibold text-sm">U</div>
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 max-w-[80%]",
                        message.role === "user"
                          ? "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
                          : "bg-gray-50"
                      )}
                    >
                      {message.isThinking ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {isTypingEffect &&
                            message === messages[messages.length - 1]
                              ? currentTypingText
                              : message.content}
                          </p>
                          <p className="text-[10px] opacity-50 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything about warehouse management..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-[#3456FF]/20 placeholder:text-gray-400"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      "bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white",
                      "hover:opacity-90 transition-opacity",
                      "shadow-lg shadow-blue-500/20"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                  <span>Powered by Google Gemini Pro</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI-Enhanced Responses
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-xl shadow-lg",
            "bg-gradient-to-r from-[#3456FF] to-[#8763FF]",
            "hover:opacity-90 transition-all",
            "group relative overflow-hidden"
          )}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    </>
  );
}
