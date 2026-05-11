import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      month?: string;
      gross_pay?: number;
      deductions?: number;
      net_pay?: number;
    };
    const month = body.month?.trim();
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    }
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("payroll_runs")
      .upsert(
        {
          tenant_id: t.tenantId,
          month_key: month,
          gross_pay: body.gross_pay ?? 0,
          deductions: body.deductions ?? 0,
          net_pay: body.net_pay ?? 0,
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,month_key" }
      )
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const start = `${month}-01T00:00:00.000Z`;
    const endDate = new Date(`${month}-01T00:00:00.000Z`);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    const end = endDate.toISOString();

    await supabase
      .from("time_logs")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("tenant_id", t.tenantId)
      .gte("start_time", start)
      .lt("start_time", end);

    return NextResponse.json(data);
  } catch (e) {
    console.error("payroll mark-paid", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
