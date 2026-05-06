// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@supabase/supabase-js";
import {
  Truck,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";

// Supabase setup
const getSupabaseClient = () => {
  const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U";
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// Interfaces
interface Equipment {
  id: string;
  type: string;
  name: string;
  model: string;
  serial_number: string;
  license_plate: string;
  status: string;
  assigned_to: string;
  fuel_level: number;
  battery_level: number;
  last_maintenance: string;
  next_maintenance: string;
  purchase_date: string;
  hours_used: number;
  maintenance_cost: number;
  location: string;
  notes: string;
}

export default function FleetManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Equipment stats
  const [stats, setStats] = useState({
    total: 0,
    operational: 0,
    maintenance: 0,
    retired: 0,
    totalCost: 0,
  });

  // Get equipment data
  useEffect(() => {
    fetchEquipment();

    // Set up polling for live updates
    const intervalId = setInterval(fetchEquipment, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  // Fetch equipment data
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("equipment").select("*");

      if (error) throw error;

      if (data) {
        setEquipment(data);

        // Calculate stats
        const total = data.length;
        const operational = data.filter(
          (eq) => eq.status === "operational"
        ).length;
        const inMaintenance = data.filter(
          (eq) => eq.status === "maintenance"
        ).length;
        const retired = data.filter((eq) => eq.status === "retired").length;
        const totalCost = data.reduce(
          (sum, eq) => sum + (parseFloat(eq.maintenance_cost.toString()) || 0),
          0
        );

        setStats({
          total,
          operational,
          maintenance: inMaintenance,
          retired,
          totalCost,
        });
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment by search query
  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Equipment status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Operational
          </Badge>
        );
      case "maintenance":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
            <Wrench className="h-3 w-3 mr-1" /> In Maintenance
          </Badge>
        );
      case "retired":
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> Retired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
          Fleet Management
        </h1>
        <div className="flex items-center">
          <Badge
            variant="outline"
            className="bg-[#3456FF]/10 text-[#3456FF] mr-2"
          >
            Live Data
          </Badge>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Equipment
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#3456FF]/20 to-[#8763FF]/20 rounded-lg flex items-center justify-center text-[#3456FF]">
                <Truck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Operational</p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.operational}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0
                    ? Math.round((stats.operational / stats.total) * 100)
                    : 0}
                  % of fleet
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 rounded-lg flex items-center justify-center text-[#00C49F]">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  In Maintenance
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.maintenance}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0
                    ? Math.round((stats.maintenance / stats.total) * 100)
                    : 0}
                  % of fleet
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#FFBB28]/20 to-[#FF8042]/20 rounded-lg flex items-center justify-center text-[#FFBB28]">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Maintenance Cost
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(stats.totalCost)}
                  </h3>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#FF8042]/20 to-[#FFBB28]/20 rounded-lg flex items-center justify-center text-[#FF8042]">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Equipment</CardTitle>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search equipment..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]">
                <Plus className="mr-2 h-4 w-4" /> Add Equipment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="h-10 w-10 text-[#3456FF] animate-spin" />
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-20">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No Equipment Found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first equipment to get started"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Maintenance</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.serial_number}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{formatDate(item.last_maintenance)}</TableCell>
                      <TableCell>{formatDate(item.next_maintenance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
