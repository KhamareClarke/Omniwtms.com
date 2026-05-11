"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SupplierPortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("/api/suppliers/portal/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("supplierPortal", JSON.stringify({ supplier_id: data.supplier_id, email }));
    router.push(`/suppliers/${data.supplier_id}`);
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Supplier portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in with the email and password your tenant issued. You must use the same tenant hostname or context as
            your buyer (OmniWTMS passes <code className="text-xs">x-tenant-id</code> / org session) so the API can
            resolve your organization.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={() => void login()} className="w-full">
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
