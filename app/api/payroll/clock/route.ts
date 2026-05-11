import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/** Courier + warehouse clock endpoint. */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      employee_id?: string;
      action?: "clock_in" | "clock_out";
      task_type?: string;
      break_duration_minutes?: number;
    };
    const employeeId = body.employee_id?.trim();
    if (!employeeId) return NextResponse.json({ error: "employee_id required" }, { status: 400 });
    const action = body.action ?? "clock_in";
    const supabase = createAdminServiceClient();
    if (action === "clock_in") {
      const { data, error } = await supabase
        .from("time_logs")
        .insert({
          tenant_id: t.tenantId,
          employee_id: employeeId,
          start_time: new Date().toISOString(),
          task_type: body.task_type ?? "general",
          status: "clocked_in",
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const { data: openLog, error: qErr } = await supabase
      .from("time_logs")
      .select("*")
      .eq("tenant_id", t.tenantId)
      .eq("employee_id", employeeId)
      .eq("status", "clocked_in")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (qErr || !openLog) return NextResponse.json({ error: "No active clock-in" }, { status: 400 });
    const { data, error } = await supabase
      .from("time_logs")
      .update({
        end_time: new Date().toISOString(),
        break_duration_minutes: body.break_duration_minutes ?? 0,
        status: "clocked_out",
        updated_at: new Date().toISOString(),
      })
      .eq("id", (openLog as any).id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("payroll clock", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
