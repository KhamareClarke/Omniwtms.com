"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PayrollClockPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [taskType, setTaskType] = useState("warehouse_manual");
  const [breakMins, setBreakMins] = useState("0");

  const call = async (action: "clock_in" | "clock_out") => {
    const res = await fetch("/api/payroll/clock", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        action,
        task_type: taskType,
        break_duration_minutes: Number(breakMins) || 0,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success(action === "clock_in" ? "Clocked in" : "Clocked out");
  };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Manual Staff Clock In/Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Employee ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Task type</Label>
            <Input value={taskType} onChange={(e) => setTaskType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Break minutes (for clock out)</Label>
            <Input value={breakMins} onChange={(e) => setBreakMins(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void call("clock_in")}>Clock In</Button>
            <Button variant="outline" onClick={() => void call("clock_out")}>Clock Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
