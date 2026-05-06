"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Truck,
  Building2,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import SignupModal with no SSR to avoid hydration issues
const SignupModal = dynamic(() => import("./SignupModal"), {
  ssr: false,
});

type Question = {
  id: number;
  text: string;
  options: {
    id: string;
    text: string;
    planScore: {
      commander: number;
      fleetmaster: number;
      titan: number;
    };
  }[];
};

export default function UserSegmentationQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [scores, setScores] = useState({
    commander: 0,
    fleetmaster: 0,
    titan: 0,
  });
  const [recommendedPlan, setRecommendedPlan] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only render client-side components after mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const questions: Question[] = [
    {
      id: 1,
      text: "What's the size of your operation?",
      options: [
        {
          id: "small",
          text: "Small (1-5 vehicles, 1 warehouse)",
          planScore: { commander: 3, fleetmaster: 0, titan: 0 },
        },
        {
          id: "medium",
          text: "Medium (6-50 vehicles, multiple warehouses)",
          planScore: { commander: 1, fleetmaster: 3, titan: 0 },
        },
        {
          id: "large",
          text: "Large (50+ vehicles, multiple locations)",
          planScore: { commander: 0, fleetmaster: 1, titan: 3 },
        },
      ],
    },
    {
      id: 2,
      text: "What challenges are you trying to solve?",
      options: [
        {
          id: "basics",
          text: "Basic organization and routing",
          planScore: { commander: 2, fleetmaster: 0, titan: 0 },
        },
        {
          id: "growth",
          text: "Scaling operations efficiently",
          planScore: { commander: 0, fleetmaster: 2, titan: 0 },
        },
        {
          id: "complex",
          text: "Complex logistics & integration needs",
          planScore: { commander: 0, fleetmaster: 1, titan: 2 },
        },
      ],
    },
    {
      id: 3,
      text: "What type of support do you need?",
      options: [
        {
          id: "self",
          text: "Self-service is fine",
          planScore: { commander: 2, fleetmaster: 0, titan: 0 },
        },
        {
          id: "dedicated",
          text: "Dedicated account manager",
          planScore: { commander: 0, fleetmaster: 2, titan: 1 },
        },
        {
          id: "premium",
          text: "Premium enterprise support",
          planScore: { commander: 0, fleetmaster: 0, titan: 2 },
        },
      ],
    },
  ];

  const handleOptionSelect = (option: any) => {
    // Update scores
    const newScores = {
      commander: scores.commander + option.planScore.commander,
      fleetmaster: scores.fleetmaster + option.planScore.fleetmaster,
      titan: scores.titan + option.planScore.titan,
    };

    setScores(newScores);

    // Move to next question or show result
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Determine recommended plan
      let recommendedPlan = "commander";
      let highestScore = newScores.commander;

      if (newScores.fleetmaster > highestScore) {
        recommendedPlan = "fleetmaster";
        highestScore = newScores.fleetmaster;
      }

      if (newScores.titan > highestScore) {
        recommendedPlan = "titan";
      }

      setRecommendedPlan(recommendedPlan);
      setIsComplete(true);
    }
  };

  const handleOpenSignup = () => {
    setIsSignupModalOpen(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({
      commander: 0,
      fleetmaster: 0,
      titan: 0,
    });
    setIsComplete(false);
    setRecommendedPlan("");
  };

  const getPlanDetails = () => {
    switch (recommendedPlan) {
      case "commander":
        return {
          name: "Commander",
          description: "Perfect for small operations with basic needs",
          icon: Truck,
          cta: "Let's set up your small team",
          features: [
            "Real-Time Warehouse Dashboard",
            "Smart Route Optimization",
            "Driver Compliance Tracking",
            "Live Training & Support",
          ],
        };
      case "fleetmaster":
        return {
          name: "FleetMaster",
          description: "Growing businesses with multiple locations",
          icon: Building2,
          cta: "Perfect for my growing business",
          features: [
            "Everything in Commander plan",
            "Dedicated Account Manager",
            "Multi-Warehouse Management",
            "Custom Reporting Tools",
          ],
        };
      case "titan":
        return {
          name: "Titan",
          description: "Enterprise operations with complex needs",
          icon: Building2,
          cta: "Let's talk enterprise solutions",
          features: [
            "Everything in FleetMaster plan",
            "3D Floor Mapping",
            "API Access & ERP Integration",
            "Custom Reports & Analytics",
          ],
        };
      default:
        return {
          name: "FleetMaster",
          description: "Growing businesses with multiple locations",
          icon: Building2,
          cta: "Perfect for my growing business",
          features: [
            "Everything in Commander plan",
            "Dedicated Account Manager",
            "Multi-Warehouse Management",
            "Custom Reporting Tools",
          ],
        };
    }
  };

  const planDetails = getPlanDetails();
  const Icon = planDetails.icon;

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 sm:px-0">
      {!quizActive ? (
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl text-center">
              Not sure which plan is right for you?
            </CardTitle>
            <CardDescription className="text-center text-base">
              Answer a few quick questions and we'll recommend the perfect fit
              for your business
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center py-6 bg-white">
            <Button
              onClick={() => setQuizActive(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <span>Find my ideal plan</span> <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-blue-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-600">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-medium">
                      {Math.round(
                        ((currentQuestion + 1) / questions.length) * 100
                      )}
                      % complete
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          ((currentQuestion + 1) / questions.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <CardTitle className="text-xl mt-4">
                    {questions[currentQuestion].text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option)}
                        className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 flex justify-between items-center"
                      >
                        <span>{option.text}</span>
                        <ArrowRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-blue-500 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center">
                  <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1">
                    We recommend: {planDetails.name}
                  </h3>
                  <p className="opacity-90">{planDetails.description}</p>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {planDetails.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center py-6 bg-gray-50">
                  <Button
                    onClick={handleOpenSignup}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <span>{planDetails.cta}</span>
                  </Button>
                  <Button
                    onClick={resetQuiz}
                    variant="outline"
                    className="px-6 py-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg w-full sm:w-auto justify-center"
                  >
                    Start over
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Signup Modal */}
      {isMounted && (
        <SignupModal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
        />
      )}
    </div>
  );
}
