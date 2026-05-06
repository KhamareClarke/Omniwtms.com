// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Lock, Mail } from "lucide-react";

const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data: admin, error: err } = await supabase
        .from("admins")
        .select("id, email, name, status")
        .eq("email", email.trim().toLowerCase())
        .eq("password", password)
        .single();

      if (err || !admin) {
        setError("Incorrect email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      if (admin.status !== "active") {
        setError("Account is not active. Please contact support.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: admin.id,
          email: admin.email,
          company: admin.name || "Admin",
          type: "admin",
        })
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("Admin sign in error:", err);
      setError("An error occurred. Please try again.");
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
              Admin-only credentials. Separate from Organization login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
              >
                {isLoading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
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
