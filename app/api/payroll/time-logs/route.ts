import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const employeeId = request.nextUrl.searchParams.get("employee_id")?.trim();
    const month = request.nextUrl.searchParams.get("month")?.trim(); // YYYY-MM
    const supabase = createAdminServiceClient();
    let q = supabase
      .from("time_logs")
      .select("*")
      .eq("tenant_id", t.tenantId)
      .order("start_time", { ascending: false });
    if (employeeId) q = q.eq("employee_id", employeeId);
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const from = `${month}-01T00:00:00.000Z`;
      const d = new Date(`${month}-01T00:00:00.000Z`);
      d.setUTCMonth(d.getUTCMonth() + 1);
      const to = d.toISOString();
      q = q.gte("start_time", from).lt("start_time", to);
    }
    const { data, error } = await q.limit(5000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ time_logs: data ?? [] });
  } catch (e) {
    console.error("payroll time-logs GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      employee_id?: string;
      start_time?: string;
      end_time?: string | null;
      break_duration_minutes?: number;
      task_type?: string;
      status?: string;
    };
    if (!body.employee_id?.trim() || !body.start_time) {
      return NextResponse.json({ error: "employee_id and start_time required" }, { status: 400 });
    }
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("time_logs")
      .insert({
        tenant_id: t.tenantId,
        employee_id: body.employee_id.trim(),
        start_time: body.start_time,
        end_time: body.end_time ?? null,
        break_duration_minutes: body.break_duration_minutes ?? 0,
        task_type: body.task_type ?? "general",
        status: body.status ?? (body.end_time ? "clocked_out" : "clocked_in"),
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("payroll time-logs POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      id?: string;
      end_time?: string | null;
      break_duration_minutes?: number;
      task_type?: string;
      status?: string;
    };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.end_time !== undefined) patch.end_time = body.end_time;
    if (body.break_duration_minutes !== undefined) patch.break_duration_minutes = body.break_duration_minutes;
    if (body.task_type !== undefined) patch.task_type = body.task_type;
    if (body.status !== undefined) patch.status = body.status;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("time_logs")
      .update(patch)
      .eq("id", body.id)
      .eq("tenant_id", t.tenantId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("payroll time-logs PATCH", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
