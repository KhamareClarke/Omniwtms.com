// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth/SupabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { AIParticleEffect } from "@/components/ui/ai-particle-effect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Users,
  Smartphone,
  Mail,
  Lock,
  Plus,
  UserPlus,
  Search,
} from "lucide-react";

export default function CustomersPage() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    password: "",
    email: "",
    weekly_fee: "",
  });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get current client id from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("Current user:", user);
        setCurrentClientId(user.id);
        fetchCustomers(user.id);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        toast.error("Error loading user data. Please login again.");
      }
    } else {
      console.log("No user found in localStorage");
      setIsLoading(false);
    }
  }, []);

  // Fetch customers for this client
  const fetchCustomers = async (clientId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      } else {
        console.log("Customers loaded:", data);
        setCustomers(data || []);
      }
    } catch (error) {
      console.error("Exception fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setLoading(true);

    try {
      if (!form.name || !form.contact || !form.password) {
        const msg = "Name, Contact, and Password are required";
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      if (form.weekly_fee && isNaN(Number(form.weekly_fee))) {
        const msg = "Weekly fee must be a valid number";
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      if (!currentClientId) {
        const msg = "No client ID found. Please login again.";
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      // Check if customer with this contact number already exists (use maybeSingle to avoid error when no row)
      const { data: existingCustomer, error: existingError } = await supabase
        .from("customers")
        .select("name")
        .eq("client_id", currentClientId)
        .eq("contact_number", form.contact)
        .maybeSingle();

      if (existingError) {
        console.error("Error checking existing customer:", existingError);
        const msg = "Could not verify customer. Please try again.";
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      if (existingCustomer) {
        const msg = `A customer with contact number ${form.contact} already exists`;
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            name: form.name,
            contact_number: form.contact,
            password: form.password,
            email: form.email?.trim() || null,
            weekly_fee: form.weekly_fee ? parseFloat(form.weekly_fee) : null,
            client_id: currentClientId,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding customer:", error);
        let msg = error.message;
        if (error.code === "23505") {
          if (error.message.includes("customers_client_contact_unique") || error.message.includes("contact_number")) {
            msg = `A customer with contact number ${form.contact} already exists`;
          } else if (error.message.includes("customers_email_key") || error.message.includes("email")) {
            msg = "A customer with this email already exists";
          }
        }
        setFormMessage({ type: "error", text: msg });
        toast.error(msg);
        return;
      }

      setFormMessage({ type: "success", text: "Customer added successfully! They will appear in the list below." });
      toast.success("Customer added successfully!");
      setForm({
        name: "",
        contact: "",
        password: "",
        email: "",
        weekly_fee: "",
      });
      await fetchCustomers(currentClientId);
    } catch (error) {
      console.error("Exception adding customer:", error);
      const msg = error instanceof Error ? error.message : "An unexpected error occurred";
      setFormMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search query
  const filteredCustomers = searchQuery
    ? customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.contact_number?.includes(searchQuery)
      )
    : customers;

  return (
    <AnimatedGradientBackground className="min-h-screen">
      <AIParticleEffect particleColor="#3456FF" density="low" />

      <div className="container mx-auto p-4 space-y-8 relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-[#3456FF]/5 to-[#8763FF]/5 rounded-bl-full -z-10 opacity-70"></div>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-gray-500 mt-1 font-sans">
            Add and manage your customers
          </p>
        </div>

        {/* Customer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card border border-gray-200 shadow-sm rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-sans">
                  Total Customers
                </p>
                <p className="text-2xl font-semibold font-heading">
                  {customers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#3456FF]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#3456FF]" />
              </div>
            </div>
          </div>

          <div className="glass-card border border-gray-200 shadow-sm rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-sans">
                  Recent Customers
                </p>
                <p className="text-2xl font-semibold font-heading">
                  {customers.slice(0, 5).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#3456FF]/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#3456FF]" />
              </div>
            </div>
          </div>

          <div className="glass-card border border-gray-200 shadow-sm rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <div className="flex items-center gap-3">
              <div className="w-full">
                <p className="text-sm text-gray-500 font-sans mb-1">
                  Search Customers
                </p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-8 border-gray-300 focus:border-[#3456FF] focus:ring focus:ring-[#3456FF]/10 font-sans transition-all"
                    placeholder="Search by name, email or phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Customer Form */}
          <Card className="glass-card border-gray-200 shadow-sm col-span-1 relative">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <CardHeader>
              <CardTitle className="text-xl font-heading font-semibold flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Add New Customer
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter customer name"
                      value={form.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium">
                    Contact Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="contact"
                      name="contact"
                      placeholder="Enter contact number"
                      value={form.contact}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email address (optional)"
                      value={form.email}
                      onChange={handleChange}
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly_fee" className="text-sm font-medium">
                    Weekly Fee (£)
                  </Label>
                  <div className="relative">
                    <Input
                      id="weekly_fee"
                      name="weekly_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter weekly charge in pounds"
                      value={form.weekly_fee}
                      onChange={handleChange}
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400 font-semibold">
                      £
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {formMessage && (
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      formMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Saving..." : "Add Customer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card className="glass-card border-gray-200 shadow-md lg:col-span-2 relative">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#3456FF]/5 via-transparent to-[#8763FF]/5 rounded-lg opacity-50"></div>
            <CardHeader>
              <CardTitle className="text-xl font-heading font-semibold flex items-center">
                <span className="w-1.5 h-5 bg-gradient-to-b from-[#3456FF] to-[#8763FF] rounded-full mr-2"></span>
                <span className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
                  Customer List
                </span>
                <Badge className="ml-2 bg-[#3456FF]/10 text-[#3456FF] border-[#3456FF]/20">
                  {filteredCustomers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Name
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Contact Number
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Weekly Fee
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Password
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 font-heading">
                        Created At
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center animate-pulse-slow">
                              <Users className="h-8 w-8 text-[#3456FF]" />
                            </div>
                            <p className="font-sans text-gray-500">
                              Loading customers...
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#3456FF]/10 to-[#8763FF]/10 flex items-center justify-center">
                              <Users className="h-10 w-10 text-[#3456FF]" />
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3456FF]/0 via-[#3456FF]/30 to-[#3456FF]/0 rounded-full opacity-50 animate-scan"></div>
                            </div>
                            <p className="font-sans text-lg text-gray-600">
                              {searchQuery
                                ? "No matching customers found"
                                : "No customers found"}
                            </p>
                            <p className="font-sans text-sm text-gray-500 max-w-md text-center">
                              {searchQuery
                                ? "Try a different search term"
                                : "Add your first customer using the form"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((c) => (
                        <TableRow
                          key={c.id}
                          className="hover:bg-gray-50/70 backdrop-blur-sm transition-colors"
                        >
                          <TableCell className="font-medium font-sans">
                            {c.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {c.contact_number}
                          </TableCell>
                          <TableCell className="font-sans text-sm">
                            {c.email || "-"}
                          </TableCell>
                          <TableCell className="font-sans text-sm">
                            {c.weekly_fee
                              ? `£${parseFloat(c.weekly_fee).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.password ? "••••••••" : "-"}
                          </TableCell>
                          <TableCell className="font-sans text-sm text-gray-600">
                            {c.created_at
                              ? new Date(c.created_at).toLocaleString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedGradientBackground>
  );
}
