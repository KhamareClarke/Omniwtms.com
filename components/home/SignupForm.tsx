"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface SignupFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  requirements: string;
}

export default function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    requirements: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        requirements: "",
      });
    } catch (err) {
      setError("Failed to submit form. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center p-8">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p>We've received your information and will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-black dark:text-black"
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="text-black">
        <label
          htmlFor="name"
          className="block text-black text-sm font-medium mb-1"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-1">
          Company <span className="text-red-500">*</span>
        </label>
        <Input
          id="company"
          name="company"
          type="text"
          required
          value={formData.company}
          onChange={handleChange}
          placeholder="Your company name"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label
          htmlFor="requirements"
          className="block text-sm font-medium mb-1"
        >
          How can we help you?
        </label>
        <Textarea
          id="requirements"
          name="requirements"
          rows={4}
          value={formData.requirements}
          onChange={handleChange}
          placeholder="Tell us about your requirements..."
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Submit"
        )}
      </Button>

      <p className="text-xs text-gray-500 mt-2">
        We'll get back to you as soon as possible.
      </p>
    </form>
  );
}
