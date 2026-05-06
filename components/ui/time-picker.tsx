"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TimePicker({ label, className, ...props }: TimePickerProps) {
  return (
    <div className="grid gap-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          type="time"
          className={className}
          {...props}
        />
        <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )
} 