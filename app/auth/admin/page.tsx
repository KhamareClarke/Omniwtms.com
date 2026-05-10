"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Lock, Mail, KeyRound } from "lucide-react";

type Step = "email" | "password" | "otp-info" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not continue.");
        return;
      }
      setStep("password");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not verify password.");
        return;
      }
      if (typeof data.challengeId === "string") {
        setChallengeId(data.challengeId);
      }
      setStep("otp-info");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const continueToOtp = () => {
    setOtp("");
    setStep("otp");
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          challengeId,
          code: otp.replace(/\s/g, ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Invalid code.");
        return;
      }
      if (data.admin) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: data.admin.id,
            email: data.admin.email,
            company: data.admin.name || "Admin",
            type: "admin",
          })
        );
      }
      router.push("/admin");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center mb-2">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-center text-xl">Admin sign in</CardTitle>
            <CardDescription className="text-center">
              {step === "email" && "Step 1 of 4 — Enter your admin email"}
              {step === "password" && "Step 2 of 4 — Enter your password"}
              {step === "otp-info" && "Step 3 of 4 — Verification code sent"}
              {step === "otp" && "Step 4 of 4 — Enter the email code"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {step === "email" && (
              <form onSubmit={submitEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="admin-email"
                      type="email"
                      autoComplete="username"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                >
                  {isLoading ? "Please wait…" : "Continue"}
                </Button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={submitPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  After a correct password, a one-time code is emailed to the designated administrator
                  inboxes. The account locks after five failed password attempts.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("email")}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                  >
                    {isLoading ? "Sending code…" : "Sign in"}
                  </Button>
                </div>
              </form>
            )}

            {step === "otp-info" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <strong className="block mb-1">Check administrator email</strong>
                  A 6-digit code was sent to the configured administrator addresses. It expires in 10
                  minutes. Anyone with access to those inboxes can read the code.
                </div>
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800"
                  onClick={continueToOtp}
                >
                  Enter code
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("password")}>
                  Back
                </Button>
              </div>
            )}

            {step === "otp" && (
              <form onSubmit={submitOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">Verification code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="admin-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={8}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                      required
                      className="pl-10 text-lg tracking-widest"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("otp-info")}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                  >
                    {isLoading ? "Verifying…" : "Verify & continue"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-4 pt-4 border-t text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
