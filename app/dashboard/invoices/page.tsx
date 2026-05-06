// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Receipt,
  Plus,
  Download,
  FileText,
  Check,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Calendar,
  MoreHorizontal,
  Printer,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";

// Get Supabase client with direct credentials
const getSupabaseClient = () => {
  const supabaseUrl = "https://qpkaklmbiwitlroykjim.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U";
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function InvoicesDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    number: "",
    customer: "",
    amount: "",
    status: "pending",
    weeks: "1",
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [useWeeklyFee, setUseWeeklyFee] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();

    // Set up polling for live updates
    const intervalId = setInterval(fetchInvoices, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  // Filter invoices whenever search query or status filter changes
  useEffect(() => {
    if (invoices.length > 0) {
      let filtered = [...invoices];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(
          (invoice) =>
            invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (invoice) => invoice.status === statusFilter
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });

      setFilteredInvoices(filtered);
    }
  }, [invoices, searchQuery, statusFilter, sortDirection]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("invoices").select("*");

      if (error) throw error;

      if (data) {
        setInvoices(data);
        setFilteredInvoices(data);

        // Calculate stats
        const total = data.length;
        const paid = data.filter((inv) => inv.status === "paid").length;
        const pending = data.filter((inv) => inv.status === "pending").length;
        const overdue = data.filter((inv) => inv.status === "overdue").length;
        const totalAmount = data.reduce(
          (sum, inv) => sum + (parseFloat(inv.amount) || 0),
          0
        );

        setStats({
          total,
          paid,
          pending,
          overdue,
          totalAmount,
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer);
    setNewInvoice((prev) => ({
      ...prev,
      customer: customer?.name || "",
    }));

    // If using weekly fee and customer has a fee, calculate amount
    if (useWeeklyFee && customer?.weekly_fee) {
      calculateAmountFromWeeklyFee(customer.weekly_fee, newInvoice.weeks);
    }
  };

  const calculateAmountFromWeeklyFee = (weeklyFee: number, weeks: string) => {
    if (weeklyFee && weeks) {
      const weeksNum = parseInt(weeks, 10);
      const totalAmount = (weeklyFee * weeksNum).toFixed(2);
      setNewInvoice((prev) => ({
        ...prev,
        amount: totalAmount,
      }));
    }
  };

  const handleToggleWeeklyFee = (value: boolean) => {
    setUseWeeklyFee(value);

    // If enabled and there's a selected customer with a fee, calculate amount
    if (value && selectedCustomer?.weekly_fee) {
      calculateAmountFromWeeklyFee(
        selectedCustomer.weekly_fee,
        newInvoice.weeks
      );
    }
  };

  const handleWeeksChange = (weeks: string) => {
    setNewInvoice((prev) => ({
      ...prev,
      weeks,
    }));

    // If using weekly fee and there's a selected customer, recalculate amount
    if (useWeeklyFee && selectedCustomer?.weekly_fee) {
      calculateAmountFromWeeklyFee(selectedCustomer.weekly_fee, weeks);
    }
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.number || !newInvoice.customer || !newInvoice.amount) {
      alert("Please fill out all fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("invoices")
        .insert([
          {
            number: newInvoice.number,
            customer: newInvoice.customer,
            amount: parseFloat(newInvoice.amount),
            currency: "GBP",
            status: newInvoice.status,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      // Refresh invoices
      fetchInvoices();

      // Reset form and close dialog
      setNewInvoice({
        number: "",
        customer: "",
        amount: "",
        status: "pending",
        weeks: "1",
      });
      setSelectedCustomer(null);
      setUseWeeklyFee(false);
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding invoice:", error);
      alert("Failed to create invoice. Please try again.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Refresh invoices
      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        const { error } = await supabase.from("invoices").delete().eq("id", id);

        if (error) throw error;

        // Refresh invoices
        fetchInvoices();
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 text-[#00C49F]";
      case "pending":
        return "bg-[#8763FF]/20 text-[#8763FF]";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Check className="h-3.5 w-3.5 mr-1" />;
      case "pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case "overdue":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      default:
        return <FileText className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const formatCurrency = (amount: number, currency = "GBP") => {
    const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#3456FF] to-[#8763FF] bg-clip-text text-transparent">
          Invoices Dashboard
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
                  Total Invoices
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#3456FF]/20 to-[#8763FF]/20 rounded-lg flex items-center justify-center text-[#3456FF]">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Amount
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(stats.totalAmount)}
                  </h3>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 rounded-lg flex items-center justify-center text-[#00C49F]">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Paid Invoices
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">{stats.paid}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0
                    ? Math.round((stats.paid / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#00C49F]/20 to-[#5C4EFF]/20 rounded-lg flex items-center justify-center text-[#00C49F]">
                <Check className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending/Overdue
                </p>
                <div className="flex items-center mt-1">
                  <h3 className="text-2xl font-bold">
                    {stats.pending + stats.overdue}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pending} pending, {stats.overdue} overdue
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-[#FFBB28]/20 to-[#FF8042]/20 rounded-lg flex items-center justify-center text-[#FFBB28]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Invoices</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="h-10 w-10 text-[#3456FF] animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-20">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No Invoices Found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first invoice to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE] border-0"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={toggleSortDirection}
                      >
                        Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`flex items-center ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(invoice.id, "paid")
                              }
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(invoice.id, "pending")
                              }
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as Pending
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(invoice.id, "overdue")
                              }
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Mark as Overdue
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice by filling out the information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="INV-0001"
                value={newInvoice.number}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerSelect">Select Customer</Label>
              <Select
                value={selectedCustomer?.id || ""}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger id="customerSelect">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}{" "}
                      {customer.weekly_fee
                        ? `(£${parseFloat(customer.weekly_fee).toFixed(
                            2
                          )}/week)`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="useWeeklyFee">Use Weekly Fee</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={useWeeklyFee ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleWeeklyFee(true)}
                    disabled={!selectedCustomer?.weekly_fee}
                    className={useWeeklyFee ? "bg-blue-600 text-white" : ""}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!useWeeklyFee ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleWeeklyFee(false)}
                    className={!useWeeklyFee ? "bg-gray-200" : ""}
                  >
                    No
                  </Button>
                </div>
              </div>
              {selectedCustomer?.weekly_fee && useWeeklyFee && (
                <div className="text-sm text-muted-foreground">
                  Customer weekly fee: £
                  {parseFloat(selectedCustomer.weekly_fee).toFixed(2)}
                </div>
              )}
              {!selectedCustomer?.weekly_fee && (
                <div className="text-sm text-muted-foreground">
                  This customer has no weekly fee set
                </div>
              )}
            </div>

            {useWeeklyFee && selectedCustomer?.weekly_fee && (
              <div className="space-y-2">
                <Label htmlFor="weeks">Number of Weeks</Label>
                <Input
                  id="weeks"
                  placeholder="1"
                  type="number"
                  min="1"
                  step="1"
                  value={newInvoice.weeks}
                  onChange={(e) => handleWeeksChange(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={newInvoice.amount}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, amount: e.target.value })
                }
                readOnly={useWeeklyFee && selectedCustomer?.weekly_fee}
                className={
                  useWeeklyFee && selectedCustomer?.weekly_fee
                    ? "bg-gray-100"
                    : ""
                }
              />
              {useWeeklyFee && selectedCustomer?.weekly_fee && (
                <div className="text-xs text-muted-foreground italic">
                  Amount auto-calculated from weekly fee
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) =>
                  setNewInvoice({ ...newInvoice, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:justify-between">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddInvoice}
              className="bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white hover:from-[#2345EE] hover:to-[#7652EE]"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
