// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Palette, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [brandColors, setBrandColors] = useState({
    primary: "#3456FF",
    secondary: "#8763FF",
    accent: "#6E56CF",
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error("Logo file size must be less than 2MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        // Save to localStorage for persistence
        localStorage.setItem("customLogo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load saved logo on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem("customLogo");
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);

  const handleColorChange = (
    color: string,
    type: "primary" | "secondary" | "accent"
  ) => {
    setBrandColors((prev) => ({
      ...prev,
      [type]: color,
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
          Settings
        </h1>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="whitelabel">White Label</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Khamare Clarke" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    defaultValue="khamare@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Administrator" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joined">Joined</Label>
                  <Input id="joined" defaultValue="April 19, 2023" disabled />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifs" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch id="email-notifs" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifs" className="font-medium">
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive text messages for urgent updates
                    </p>
                  </div>
                  <Switch id="sms-notifs" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifs" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch id="push-notifs" defaultChecked />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how OmniDeploy looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="font-medium">
                      Dark Mode
                    </Label>
                    <p className="text-sm text-gray-500">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch id="dark-mode" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations" className="font-medium">
                      UI Animations
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable or disable interface animations
                    </p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compact-view" className="font-medium">
                      Compact View
                    </Label>
                    <p className="text-sm text-gray-500">
                      Reduce spacing for a more compact interface
                    </p>
                  </div>
                  <Switch id="compact-view" />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90">
                Apply Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelabel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#3456FF]" />
                Logo Customization
              </CardTitle>
              <CardDescription>
                Upload and customize your company logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#3456FF] transition-colors">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to upload logo
                        <br />
                        <span className="text-xs">PNG, JPG up to 2MB</span>
                      </span>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90"
                    onClick={() => {
                      if (logoFile) {
                        // Logo is already saved to localStorage during upload
                        toast.success("Logo updated successfully");
                      } else {
                        toast.error("Please select a logo file first");
                      }
                    }}
                  >
                    Update Logo
                  </Button>
                </div>
                <div className="flex items-center justify-center border rounded-lg p-4 bg-gray-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-w-full max-h-32 object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Logo preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#3456FF]" />
                Brand Colors
              </CardTitle>
              <CardDescription>Customize your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={brandColors.primary}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "primary")
                      }
                      className="w-12 h-12 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandColors.primary}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "primary")
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={brandColors.secondary}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "secondary")
                      }
                      className="w-12 h-12 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandColors.secondary}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "secondary")
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={brandColors.accent}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "accent")
                      }
                      className="w-12 h-12 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandColors.accent}
                      onChange={(e) =>
                        handleColorChange(e.target.value, "accent")
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#3456FF]/10 to-[#8763FF]/10">
                  <h3 className="font-medium mb-2">Preview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className="h-16 rounded-lg shadow-sm"
                      style={{ background: brandColors.primary }}
                    />
                    <div
                      className="h-16 rounded-lg shadow-sm"
                      style={{ background: brandColors.secondary }}
                    />
                    <div
                      className="h-16 rounded-lg shadow-sm"
                      style={{ background: brandColors.accent }}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90"
                  onClick={() => {
                    // Here you would typically save the brand colors to your server
                    toast.success("Brand colors updated successfully");
                  }}
                >
                  Save Brand Colors
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>White Label Settings</CardTitle>
              <CardDescription>
                Configure additional white label options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="custom-domain" className="font-medium">
                      Custom Domain
                    </Label>
                    <p className="text-sm text-gray-500">
                      Use your own domain for the platform
                    </p>
                  </div>
                  <Switch id="custom-domain" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="remove-branding" className="font-medium">
                      Remove OmniDeploy Branding
                    </Label>
                    <p className="text-sm text-gray-500">
                      Hide all OmniDeploy branding elements
                    </p>
                  </div>
                  <Switch id="remove-branding" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="custom-email" className="font-medium">
                      Custom Email Templates
                    </Label>
                    <p className="text-sm text-gray-500">
                      Use your own email templates
                    </p>
                  </div>
                  <Switch id="custom-email" />
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90"
                onClick={() => toast.success("White label settings saved")}
              >
                Save White Label Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
