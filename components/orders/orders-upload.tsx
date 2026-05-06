// @ts-nocheck
"use client";

import React, { useState } from "react";
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
import { Upload, FileUp, Trash2 } from "lucide-react";

export function OrdersUploadContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedOrders, setUploadedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setIsLoading(true);
    try {
      // Here you would normally send the file to your server
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate some parsed orders
      const mockOrders = [
        { id: "001", customer: "John Doe", items: 3, status: "Pending" },
        { id: "002", customer: "Jane Smith", items: 2, status: "Pending" },
      ];

      setUploadedOrders(mockOrders);
      alert("Orders uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Orders</h1>

      <div className="flex items-center gap-4 mb-8">
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="max-w-md"
        />
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {uploadedOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
