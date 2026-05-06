"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WarehouseSection {
  id?: string;
  row_index: number;
  column_index: number;
  section_name: string;
  section_type: string;
  capacity: number;
  current_usage: number;
  usage_percentage?: number;
  is_blocked: boolean;
  color?: string;
}

export interface WarehouseLayout {
  id: string;
  warehouse_id: string;
  image_url?: string;
  grid_rows: number;
  grid_columns: number;
}

interface WarehouseGridProps {
  warehouseId: string;
  onSectionClick?: (section: WarehouseSection, row: number, col: number) => void;
  className?: string;
}

const SECTION_TYPE_COLORS: Record<string, string> = {
  storage: "bg-blue-500/70",
  shipping: "bg-green-500/70",
  receiving: "bg-amber-500/70",
  picking: "bg-purple-500/70",
  blocked: "bg-red-500/70",
  other: "bg-gray-500/70",
};

export function WarehouseGrid({
  warehouseId,
  onSectionClick,
  className,
}: WarehouseGridProps) {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null);
  const [sections, setSections] = useState<WarehouseSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (warehouseId) {
      loadLayout();
    }
  }, [warehouseId]);

  const loadLayout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/warehouse/layout?warehouse_id=${warehouseId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load layout");
      }

      setLayout(data.layout);
      setSections(data.sections || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load layout");
      setLayout(null);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionAt = (row: number, col: number) =>
    sections.find(
      (s) => s.row_index === row && s.column_index === col
    );

  const getCellStyle = (section: WarehouseSection | undefined) => {
    if (!section) return { className: "bg-muted/50" };
    if (section.color?.startsWith("#")) {
      return { style: { backgroundColor: section.color }, className: "opacity-90" };
    }
    if (section.is_blocked) return { className: "bg-red-500/70" };
    return { className: SECTION_TYPE_COLORS[section.section_type] ?? "bg-gray-500/50" };
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading grid...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadLayout}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rows = layout?.grid_rows ?? 10;
  const cols = layout?.grid_columns ?? 10;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Warehouse Grid</CardTitle>
        {layout && (
          <p className="text-sm text-muted-foreground">
            {rows}×{cols} grid • {sections.length} sections configured
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!layout ? (
          <p className="text-muted-foreground text-center py-8">
            No layout found. Create a layout with a floor plan image first.
          </p>
        ) : (
          <div
            className="inline-grid gap-0.5 p-2 bg-muted/30 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(32px, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(32px, 1fr))`,
            }}
          >
            {Array.from({ length: rows * cols }, (_, i) => {
              const row = Math.floor(i / cols);
              const col = i % cols;
              const section = getSectionAt(row, col);
              const { className: colorClass, style } = getCellStyle(section);

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() =>
                    onSectionClick?.(
                      section ?? {
                        row_index: row,
                        column_index: col,
                        section_name: "",
                        section_type: "storage",
                        capacity: 0,
                        current_usage: 0,
                        is_blocked: false,
                      },
                      row,
                      col
                    )
                  }
                  style={style}
                  className={cn(
                    "min-w-[32px] min-h-[32px] rounded transition-colors hover:ring-2 hover:ring-primary/50 flex flex-col items-center justify-center text-xs font-medium",
                    colorClass,
                    section ? "text-white" : "text-muted-foreground"
                  )}
                  title={
                    section
                      ? `${section.section_name} (${section.section_type})`
                      : `Empty cell ${row}-${col}`
                  }
                >
                  {section?.section_name ? (
                    <>
                      <span className="truncate max-w-full px-0.5">
                        {section.section_name}
                      </span>
                      {section.capacity > 0 && (
                        <span className="text-[10px] opacity-90">
                          {section.current_usage}/{section.capacity}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="opacity-50">{row},{col}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
