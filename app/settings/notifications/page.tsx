"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EmailPref = { enabled?: boolean; frequency?: string };

const FREQUENCIES = ["immediate", "daily", "weekly", "never"] as const;

export default function NotificationSettingsPage() {
  const [clientId, setClientId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, EmailPref>>({});
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] = useState("org-welcome");
  const [loading, setLoading] = useState(true);
  const [ghlLocationId, setGhlLocationId] = useState("");
  const [ghlApiKey, setGhlApiKey] = useState("");
  const [ghlKeySet, setGhlKeySet] = useState(false);
  const [ghlSaving, setGhlSaving] = useState(false);
  const [ghlTesting, setGhlTesting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.type === "client" && u?.id) setClientId(u.id);
        if (u?.email) setTestTo(u.email);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    fetch(`/api/notifications/preferences?client_id=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.tenant_id) setTenantId(d.tenant_id);
        const p = d.preferences;
        if (Array.isArray(d.template_ids)) {
          setTemplateIds(d.template_ids);
          const fromServer = (p?.email || {}) as Record<string, EmailPref>;
          const merged: Record<string, EmailPref> = { ...fromServer };
          for (const tid of d.template_ids as string[]) {
            if (!merged[tid]) merged[tid] = { enabled: true, frequency: "immediate" };
          }
          setEmailMap(merged);
        }
        setSmsEnabled(p?.smsEnabled !== false);
        setPushEnabled(Boolean(p?.pushEnabled));
      })
      .catch(() => toast.error("Could not load preferences"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/notifications/ghl-config?client_id=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((d) => {
        setGhlLocationId(typeof d.ghl_location_id === "string" ? d.ghl_location_id : "");
        setGhlKeySet(Boolean(d.ghl_api_key_set));
        setGhlApiKey("");
      })
      .catch(() => {
        /* ignore */
      });
  }, [clientId]);

  const setPref = (tid: string, patch: Partial<EmailPref>) => {
    setEmailMap((prev) => ({
      ...prev,
      [tid]: { ...prev[tid], ...patch },
    }));
  };

  const save = async () => {
    if (!clientId) {
      toast.error("Sign in as an organization user to save preferences.");
      return;
    }
    const res = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        email: emailMap,
        sms_enabled: smsEnabled,
        push_enabled: pushEnabled,
        sms_provider: "ghl",
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || "Save failed");
      return;
    }
    toast.success("Preferences saved");
  };

  const sendTest = async () => {
    if (!clientId || !testTo) {
      toast.error("Client session and test email address required.");
      return;
    }
    const res = await fetch("/api/notifications/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        to: testTo,
        template_id: testTemplate,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || "Send failed");
      return;
    }
    toast.success("Test email sent");
  };

  const saveGhl = async () => {
    if (!clientId) {
      toast.error("Sign in as an organization user.");
      return;
    }
    setGhlSaving(true);
    try {
      const payload: Record<string, string> = {
        client_id: clientId,
        ghl_location_id: ghlLocationId.trim(),
      };
      if (ghlApiKey.trim()) payload.ghl_api_key = ghlApiKey.trim();
      const res = await fetch("/api/notifications/ghl-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error || "Save failed");
        return;
      }
      setGhlKeySet(Boolean(ghlApiKey.trim()) || ghlKeySet);
      setGhlApiKey("");
      toast.success("Go High Level settings saved");
    } finally {
      setGhlSaving(false);
    }
  };

  const testGhlConnectivity = async () => {
    if (!clientId) {
      toast.error("Sign in as an organization user.");
      return;
    }
    const useForm =
      ghlApiKey.trim().length > 0 && ghlLocationId.trim().length > 0;
    if (!useForm && !ghlKeySet) {
      toast.error("Enter location id and API key (or save a key first), then test.");
      return;
    }
    setGhlTesting(true);
    try {
      const res = await fetch("/api/notifications/ghl-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          useForm
            ? {
                ghl_api_key: ghlApiKey.trim(),
                ghl_location_id: ghlLocationId.trim(),
              }
            : { client_id: clientId }
        ),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        toast.error(j.error || "Connectivity check failed");
        return;
      }
      toast.success(j.message || "Go High Level API reachable.");
    } finally {
      setGhlTesting(false);
    }
  };

  if (!clientId && !loading) {
    return (
      <div className="container max-w-2xl py-10 px-4">
        <p className="text-gray-600 mb-4">
          Sign in to the{" "}
          <Link href="/auth/login" className="text-blue-600 underline">
            client dashboard
          </Link>{" "}
          first, then open this page again.
        </p>
        <Link href="/dashboard/settings">
          <Button variant="outline">Back to dashboard settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tenant: <code className="text-xs bg-gray-100 px-1 rounded">{tenantId || "—"}</code> · SMS and optional
          email can use <strong>Go High Level</strong> credentials stored here or in server env (
          <code className="text-xs">USE_GHL_EMAIL</code>).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Go High Level</CardTitle>
          <CardDescription>
            Private Integration Token (PIT) and sub-account location id. Used for SMS and, when enabled on the
            server, transactional email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="ghl-loc">Location ID</Label>
            <Input
              id="ghl-loc"
              value={ghlLocationId}
              onChange={(e) => setGhlLocationId(e.target.value)}
              placeholder="Sub-account location id"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="ghl-key">API key (PIT)</Label>
            <Input
              id="ghl-key"
              type="password"
              value={ghlApiKey}
              onChange={(e) => setGhlApiKey(e.target.value)}
              placeholder={ghlKeySet ? "Leave blank to keep existing key" : "Paste integration token"}
              autoComplete="off"
            />
            {ghlKeySet && !ghlApiKey && (
              <p className="text-xs text-muted-foreground mt-1">A key is already stored for this tenant.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={saveGhl} disabled={ghlSaving}>
              {ghlSaving ? "Saving…" : "Save GHL settings"}
            </Button>
            <Button type="button" variant="outline" onClick={testGhlConnectivity} disabled={ghlTesting}>
              {ghlTesting ? "Testing…" : "Test GHL connectivity"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Enable optional channels for this organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">SMS (Go High Level)</Label>
            <Switch id="sms" checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push">Push (coming soon — logs only)</Label>
            <Switch id="push" checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email templates</CardTitle>
          <CardDescription>Toggle and set digest frequency. Immediate sends as events occur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
          {templateIds.map((tid) => (
            <div
              key={tid}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between border-b border-gray-100 pb-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Switch
                  checked={emailMap[tid]?.enabled !== false}
                  onCheckedChange={(v) => setPref(tid, { enabled: v })}
                />
                <span className="text-sm font-medium truncate">{tid}</span>
              </div>
              <Select
                value={emailMap[tid]?.frequency || "immediate"}
                onValueChange={(v) => setPref(tid, { frequency: v })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {!templateIds.length && <p className="text-sm text-gray-500">Loading templates…</p>}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save}>Save preferences</Button>
        <Link href="/dashboard/settings">
          <Button variant="outline" type="button">
            Dashboard settings
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test email</CardTitle>
          <CardDescription>
            Sends a sample template email using your tenant transport: Gmail SMTP or Go High Level when{" "}
            <code className="text-xs">USE_GHL_EMAIL=true</code> and keys are configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>To</Label>
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <Label>Template</Label>
            <Select value={testTemplate} onValueChange={setTestTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {templateIds.map((tid) => (
                  <SelectItem key={tid} value={tid}>
                    {tid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={sendTest}>
            Send test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
