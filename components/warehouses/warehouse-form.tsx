// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WarehouseFormData {
  name: string;
  location: string;
  capacity: number;
  manager: string;
}

interface WarehouseFormProps {
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  initialData?: WarehouseFormData | null;
  isLoading?: boolean;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({
  onSubmit,
  initialData,
  isLoading,
}) => {
  const [formData, setFormData] = useState<WarehouseFormData>(
    initialData || { name: "", location: "", capacity: 0, manager: "" }
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !formData.name.trim() ||
      !formData.location.trim() ||
      !formData.manager.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.capacity <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err: any) {
      toast.error(err.message || "Failed to save warehouse");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Warehouse Name
        </label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Main Warehouse"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Full Address
        </label>
        <Input
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g. 123 Main St, City, Country"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Capacity
        </label>
        <Input
          name="capacity"
          type="number"
          min={1}
          value={formData.capacity}
          onChange={handleChange}
          placeholder="e.g. 1000"
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Manager
        </label>
        <Input
          name="manager"
          value={formData.manager}
          onChange={handleChange}
          placeholder="e.g. John Doe"
          required
          className="mt-1"
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] text-white"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Warehouse"}
      </Button>
    </form>
  );
};
