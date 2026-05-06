import React, { useState, useEffect, useRef } from "react";
import { openBookingWidget } from "@/utils/bookingWidget";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Menu,
  X,
  Bell,
  Search,
  Settings,
  ChevronDown,
  MoreVertical,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function DashboardPreviewSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleBookDemo = () => {
    openBookingWidget();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="dashboard-preview" className="py-32 bg-gray-50 border-b border-gray-200" ref={sectionRef}>
      <div className="container mx-auto px-4 max-w-8xl">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            Platform Preview
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time warehouse, fleet, and customer operations in one platform
          </p>
        </div>

        {/* Browser chrome frame */}
        <div className={`max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white px-4 py-1.5 rounded-md border border-slate-300 flex items-center gap-2 w-96">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">app.yourbusiness.com/dashboard</span>
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="bg-slate-50 flex flex-col h-[600px]">
            {/* Top navigation bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text">OmniWTMS</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-slate-600 font-medium">Online</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-slate-600 font-medium">K</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                  <Search className="h-3 w-3 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                  <Bell className="h-3 w-3 text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                  <Settings className="h-3 w-3 text-slate-600" />
                </button>
                <div className="h-6 w-px bg-slate-200"></div>
                <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                  <MoreVertical className="h-3 w-3 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-48 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
                <div className="p-3 space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 text-blue-700 rounded-md">
                    <div className="w-3 h-3 rounded bg-blue-600 flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-[10px] font-semibold">Main</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Dashboard</span>
                    </div>
                    <span className="text-[8px] text-slate-400">Ctrl+D</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Live Tracking</span>
                    </div>
                    <span className="text-[8px] text-slate-400">Ctrl+L</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200 mx-3"></div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer">
                    <Package className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Warehouse</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer pl-7">
                    <span className="text-[10px] font-medium">Inventories</span>
                    <span className="text-[8px] text-slate-400">Ctrl+I</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer pl-7">
                    <span className="text-[10px] font-medium">Barcode Scanner</span>
                    <span className="text-[8px] text-slate-400">Ctrl+B</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer pl-7">
                    <span className="text-[10px] font-medium">Warehouses</span>
                    <span className="text-[8px] text-slate-400">Ctrl+W</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer pl-7">
                    <span className="text-[10px] font-medium">Warehouse Ops</span>
                    <span className="text-[8px] text-slate-400">Ctrl+O</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer pl-7">
                    <span className="text-[10px] font-medium">Visualisation</span>
                    <span className="text-[8px] text-slate-400"></span>
                  </div>
                </div>

                <div className="mt-auto p-3">
                  <div className="text-[8px] text-slate-400 text-center">v1.0.0</div>
                </div>
              </div>

              {/* Main panel */}
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                {/* Panel header */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Dashboard Overview</h3>
                    <p className="text-[9px] text-gray-400">Monitor your logistics operations in real-time</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-500">Tuesday, 10 March 2026</span>
                    <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                      <RefreshCw className="h-3 w-3 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* AI Insights banner */}
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-b border-indigo-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-indigo-700">AI-Powered Insights </span>
                    <span className="text-[9px] text-indigo-500">Your logistics network is operating at 87% efficiency. Warehouse #3 could be optimised to improve capacity.</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {/* KPI cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Package,    label: "Orders Today",    value: "1,847",    sub: "644 pending",  change: "+8%",  changeColor: "text-green-600",  topBar: "bg-purple-500", valueColor: "text-purple-600" },
                      { icon: Truck,      label: "Active Fleet",    value: "23 / 247", sub: "En route",    change: "Live",   changeColor: "text-blue-600",   topBar: "bg-blue-500",   valueColor: "text-blue-600" },
                      { icon: TrendingUp, label: "On-Time Rate",    value: "94.8%",    sub: "Today",       change: "+2.1%",  changeColor: "text-green-600",  topBar: "bg-green-500",  valueColor: "text-green-600" },
                      { icon: BarChart3,  label: "Warehouse Cap.",  value: "73%",      sub: "3 bays free", change: "73%",    changeColor: "text-indigo-600", topBar: "bg-indigo-500", valueColor: "text-indigo-600" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <div className={`h-0.5 ${kpi.topBar}`}></div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</span>
                            <kpi.icon className={`h-3 w-3 ${kpi.valueColor} opacity-60`} />
                          </div>
                          <div className={`text-lg font-bold ${kpi.valueColor} leading-none mb-0.5`}>{kpi.value}</div>
                          <div className="text-[8px] text-gray-400">{kpi.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Middle row */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Orders table */}
                    <div className="col-span-2 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-[10px] font-bold text-gray-800">Recent Orders</h3>
                          <p className="text-[8px] text-gray-400">Latest stock movements</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[8px] text-indigo-600 font-semibold">Live</span>
                        </div>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-3 py-1.5 text-[8px] text-gray-400 font-semibold">Order ID</th>
                            <th className="text-left px-3 py-1.5 text-[8px] text-gray-400 font-semibold">Customer</th>
                            <th className="text-left px-3 py-1.5 text-[8px] text-gray-400 font-semibold">Status</th>
                            <th className="text-left px-3 py-1.5 text-[8px] text-gray-400 font-semibold">ETA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { id: "#ORD-4821", customer: "M&S Distribution", status: "Delivered",  cls: "bg-green-100 text-green-700",   eta: "" },
                            { id: "#ORD-4820", customer: "Argos Leeds DC",   status: "In Transit", cls: "bg-indigo-100 text-indigo-700", eta: "14:45" },
                            { id: "#ORD-4819", customer: "Next PLC",         status: "Picking",    cls: "bg-purple-100 text-purple-700", eta: "15:20" },
                            { id: "#ORD-4818", customer: "ASOS Returns",     status: "Delivered",  cls: "bg-green-100 text-green-700",   eta: "" },
                            { id: "#ORD-4817", customer: "Tesco DC North",   status: "Dispatched", cls: "bg-blue-100 text-blue-700",     eta: "16:10" },
                          ].map((o, i) => (
                            <tr key={o.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                              <td className="px-3 py-1 text-[8px] font-mono font-bold text-indigo-700">{o.id}</td>
                              <td className="px-3 py-1 text-[8px] text-gray-600">{o.customer}</td>
                              <td className="px-3 py-1"><span className={`text-[7px] px-1.5 py-0.5 rounded-full font-semibold ${o.cls}`}>{o.status}</span></td>
                              <td className="px-3 py-1 text-[8px] font-mono text-gray-500">{o.eta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Fleet + Warehouse */}
                    <div className="flex flex-col gap-3">
                      {/* Fleet */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="text-[10px] font-bold text-gray-800">Fleet Status</h3>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[8px] text-green-600 font-semibold">Live</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          {[
                            { id: "V-101", route: "Birmingham",  status: "En Route", dot: "bg-green-500",  textCls: "text-green-600" },
                            { id: "V-247", route: "Leeds",       status: "En Route", dot: "bg-green-500",  textCls: "text-green-600" },
                            { id: "V-089", route: "Bay 4",       status: "Loading",  dot: "bg-yellow-500", textCls: "text-yellow-600" },
                            { id: "V-312", route: "M6 Delayed",  status: "Alert",    dot: "bg-red-500",    textCls: "text-red-600" },
                            { id: "V-198", route: "Sheffield",   status: "En Route", dot: "bg-green-500",  textCls: "text-green-600" },
                          ].map((v) => (
                            <div key={v.id} className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50">
                              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${v.dot}`}></div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-gray-700">{v.id}</span>
                                <span className="text-[8px] text-gray-400 ml-1">{v.route}</span>
                              </div>
                              <span className={`text-[8px] font-semibold flex-shrink-0 ${v.textCls}`}>{v.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Warehouse capacity */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                        <h3 className="text-[10px] font-bold text-gray-800 mb-2">Warehouse Capacity</h3>
                        {[
                          { bay: "Bay A", pct: 88, color: "bg-red-400",   text: "text-red-500" },
                          { bay: "Bay B", pct: 72, color: "bg-blue-500",  text: "text-blue-500" },
                          { bay: "Bay C", pct: 55, color: "bg-green-500", text: "text-green-500" },
                        ].map((b) => (
                          <div key={b.bay} className="mb-1.5">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[8px] text-gray-600 font-semibold">{b.bay}</span>
                              <span className={`text-[8px] font-bold ${b.text}`}>{b.pct}%</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Weekly deliveries bar chart */}
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-800">Deliveries This Week</h3>
                        <p className="text-[8px] text-gray-400">Week 10, 2026</p>
                      </div>
                      <span className="text-[8px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-100">1.8k peak</span>
                    </div>
                    <div className="flex items-end gap-2 h-10">
                      {[
                        { day: "Mon", val: "1.4k", h: 77 },
                        { day: "Tue", val: "1.7k", h: 90 },
                        { day: "Wed", val: "1.4k", h: 75 },
                        { day: "Thu", val: "1.7k", h: 93 },
                        { day: "Fri", val: "1.8k", h: 100, active: true },
                        { day: "Sat", val: "980",  h: 53 },
                        { day: "Sun", val: "620",  h: 34 },
                      ].map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-[7px] text-gray-400">{d.val}</span>
                          <div className={`w-full rounded-t-sm ${d.active ? "bg-indigo-500" : "bg-indigo-100"}`} style={{ height: `${d.h}%` }}></div>
                          <span className={`text-[8px] font-semibold ${d.active ? "text-indigo-600" : "text-gray-400"}`}>{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA below dashboard */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm mb-3">See it with your own data</p>
          <Button
            onClick={handleBookDemo}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-105 transition-all duration-300 border-0"
          >
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}
