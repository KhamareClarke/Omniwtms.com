// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, Truck, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Initialize Supabase client
const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

const supabase = createClient(supabaseUrl, supabaseKey);

const clientFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
});

const courierFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  vehicle_type: z.string().min(2, "Please specify vehicle type"),
  vehicle_registration: z.string().min(2, "Please enter vehicle registration"),
  assigned_region: z.string().min(2, "Please specify your preferred region"),
});

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(
    searchParams.get("type") || "client"
  );

  const clientForm = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      email: "",
      password: "",
      company: "",
    },
  });

  const courierForm = useForm<z.infer<typeof courierFormSchema>>({
    resolver: zodResolver(courierFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      vehicle_type: "",
      vehicle_registration: "",
      assigned_region: "",
    },
  });

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "client" || type === "courier") {
      setUserType(type);
    }
  }, [searchParams]);

  async function onClientSubmit(values: z.infer<typeof clientFormSchema>) {
    try {
      setIsLoading(true);

      // Check if client already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select()
        .eq("email", values.email)
        .single();

      if (existingClient) {
        throw new Error("An account with this email already exists");
      }

      // Insert new client
      const { error } = await supabase.from("clients").insert([
        {
          email: values.email,
          password: values.password,
          company: values.company,
          status: "active",
        },
      ]);

      if (error) throw error;

      toast.success("Account created successfully");
      router.push("/auth/login?type=client");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  async function onCourierSubmit(values: z.infer<typeof courierFormSchema>) {
    try {
      setIsLoading(true);

      // Check if courier already exists
      const { data: existingCourier } = await supabase
        .from("couriers")
        .select()
        .eq("email", values.email)
        .single();

      if (existingCourier) {
        throw new Error("An account with this email already exists");
      }

      // Insert new courier application
      const { error } = await supabase.from("courier_applications").insert([
        {
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone,
          vehicle_type: values.vehicle_type,
          vehicle_registration: values.vehicle_registration,
          assigned_region: values.assigned_region,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Application submitted successfully");
      router.push("/auth/login?type=courier");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen mt-32 flex items-center justify-center bg-gradient-to-b from-background to-secondary p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {userType === "client"
                ? "Create Client Account"
                : "Apply as Courier"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {userType === "client"
                ? "Enter your details to create a client account"
                : "Fill in your details to apply as a courier"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userType === "client" ? (
              <Form {...clientForm}>
                <form
                  onSubmit={clientForm.handleSubmit(onClientSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Password
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Company Name
                        </FormLabel>
                        <div className="relative">
                          <Truck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="Your Company"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:from-[#3456FF]/90 hover:to-[#8763FF]/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...courierForm}>
                <form
                  onSubmit={courierForm.handleSubmit(onCourierSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={courierForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Full Name
                        </FormLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Password
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Phone Number
                        </FormLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="+1234567890"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Vehicle Type
                        </FormLabel>
                        <div className="relative">
                          <Truck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="e.g. Car, Bike, Van"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="vehicle_registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Vehicle Registration
                        </FormLabel>
                        <div className="relative">
                          <Truck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="e.g. ABC-123"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courierForm.control}
                    name="assigned_region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-400">
                          Preferred Region
                        </FormLabel>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="e.g. North, South, Central"
                              className="pl-10 bg-white/5 border-white/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:from-[#3456FF]/90 hover:to-[#8763FF]/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Submitting application..."
                      : "Submit Application"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              <span className="text-gray-400">Already have an account? </span>
              <Link
                href={`/auth/login?type=${userType}`}
                className="text-[#3456FF] hover:text-[#8763FF] font-medium transition-colors hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </>
  );
}
