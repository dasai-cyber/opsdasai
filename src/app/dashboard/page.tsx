"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import {
  Users, Calendar, Package, Send, ShoppingBag,
  TrendingUp, TrendingDown, Activity, ChevronRight,
  Layers, MapPin, Hash, Sparkles
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface NormalizedRow {
  id: string;
  category: "coordinacion" | "paqueteria" | "dhl" | "falabella" | "programacion" | "otro";
  categoryLabel: string;
  patente: string;
  fecha: string;
  local: string;
  folio: string;
  puntos: number;
  asignadoA: string;
  valorDia: string;
  adicional: string;
  bono: string;
  totalMonto: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseMoney = (val: any): number => {
  if (!val) return 0;
  const num = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? 0 : num;
};

const parsePuntos = (val: any): number => {
  if (!val) return 0;
  const num = parseFloat(String(val).trim());
  return isNaN(num) ? 0 : num;
};

const normalizeRow = (r: any): NormalizedRow => {
  const dt = r.data || {};
  const id = String(r.id || "");
  const type = String(dt.type || dt.categoria || r.type || "").toLowerCase();
  
  let category: NormalizedRow["category"] = "coordinacion";
  let categoryLabel = "Coordinación";

  if (id.startsWith("paq-") || type === "paqueteria") {
    category = "paqueteria";
    categoryLabel = "Paquetería";
  } else if (id.startsWith("dhl-") || type === "dhl") {
    category = "dhl";
    categoryLabel = "DHL";
  } else if (id.startsWith("fala-") || type === "falabella") {
    category = "falabella";
    categoryLabel = "Falabella";
  } else if (id.startsWith("prog-") || type === "programacion") {
    category = "programacion";
    categoryLabel = "Programación";
  } else {
    category = "coordinacion";
    categoryLabel = "Coordinación";
  }

  const valorDiaNum = parseMoney(dt.valorDia || dt.descuento || r.valorDia);
  const adicionalNum = parseMoney(dt.adicional || dt.bono || r.adicional);
  const bonoNum = parseMoney(dt.vueltas || dt.bonoExtra || r.vueltas);
  const totalMonto = valorDiaNum + adicionalNum + bonoNum;

  return {
    id,
    category,
    categoryLabel,
    patente: dt.patente || r.patente || "",
    fecha: dt.fecha || r.fecha || "",
    local: dt.local || r.local || dt.banco_empresa || r.banco_empresa || "General",
    folio: dt.folio || dt.guias || r.folio || "",
    puntos: parsePuntos(dt.puntos || r.puntos),
    asignadoA: dt.asignadoA || r.asignadoA || r.asignado_a || "Sin Asignar",
    valorDia: dt.valorDia || r.valorDia || "",
    adicional: dt.adicional || r.adicional || "",
    bono: dt.vueltas || r.vueltas || "",
    totalMonto
  };
};

const CATEGORY_META = {
  coordinacion: { label: "Coordinación", color: "#3b82f6", href: "/dashboard/coordinacion", icon: Calendar, bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  paqueteria:   { label: "Paquetería",   color: "#72b01d", href: "/dashboard/paqueteria",   icon: Package,  bg: "rgba(114,176,29,0.12)", border: "rgba(114,176,29,0.3)" },
  dhl:          { label: "DHL",          color: "#f59e0b", href: "/dashboard/dhl",          icon: Send,     bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  falabella:    { label: "Falabella",    color: "#10b981", href: "/dashboard/falabella",    icon: ShoppingBag, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  programacion: { label: "Programación", color: "#8b5cf6", href: "/dashboard/programacion", icon: Calendar, bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
  otro:         { label: "Otros",        color: "#64748b", href: "/dashboard/coordinacion", icon: Layers,   bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" }
};

// ─── Componentes Widget ──────────────────────────────────────────────────────
function StatWidget({ title, value, sub, icon: Icon, color, glow, href }: {
  title: string; value: number | string; sub: string;
  icon: React.ElementType; color: string; glow?: string; href?: string;
}) {
  const content = (
    <div className="stat-card h-full transition-transform hover:-translate-y-0.5" style={{ boxShadow: glow }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {href && (
          <div className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
            <ChevronRight size={15} />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1 tracking-tight" style={{ color: "#f1f5f9" }}>{value}</div>
      <div className="text-sm font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{title}</div>
      <div className="text-xs truncate" style={{ color: "#64748b" }}>{sub}</div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [data, setData] = useState<NormalizedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: servicios } = await supabase.from("servicios").select("*");
      if (servicios) {
        const parsed = servicios.map(normalizeRow);
        // Order by date descending
        parsed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setData(parsed);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // ─── Conteo por Categorías ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const res = {
      total: data.length,
      coordinacion: 0,
      paqueteria: 0,
      dhl: 0,
      falabella: 0,
      totalPuntos: 0,
      totalMonto: 0,
    };
    data.forEach(r => {
      if (r.category === "coordinacion") res.coordinacion++;
      else if (r.category === "paqueteria") res.paqueteria++;
      else if (r.category === "dhl") res.dhl++;
      else if (r.category === "falabella") res.falabella++;
      res.totalPuntos += r.puntos;
      res.totalMonto += r.totalMonto;
    });
    return res;
  }, [data]);

  // ─── Distribución por Categoría (Gráfico) ──────────────────────────────────
  const categoryChartData = useMemo(() => {
    return [
      { name: "Coordinación", value: counts.coordinacion, color: "#3b82f6" },
      { name: "Paquetería",   value: counts.paqueteria,   color: "#72b01d" },
      { name: "DHL",          value: counts.dhl,          color: "#f59e0b" },
      { name: "Falabella",    value: counts.falabella,    color: "#10b981" },
    ];
  }, [counts]);

  // ─── Distribución por Local ─────────────────────────────────────────────────
  const localCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      let l = r.local.trim();
      if (!l || l === "undefined") l = "Sin Especificar";
      map[l] = (map[l] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // ─── Conteo por Mes y Año (Línea de Tiempo) ─────────────────────────────────
  const timelineCounts = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const map: Record<string, { label: string; value: number }> = {};

    data.forEach(r => {
      if (!r.fecha) return;
      let y = "";
      let m = 0;
      if (/^\d{4}-\d{2}/.test(r.fecha)) {
        const p = r.fecha.split("-");
        y = p[0];
        m = parseInt(p[1], 10);
      } else if (/^\d{2}-\d{2}-\d{4}/.test(r.fecha)) {
        const p = r.fecha.split("-");
        y = p[2];
        m = parseInt(p[1], 10);
      }
      if (y && m >= 1 && m <= 12) {
        const key = `${y}-${String(m).padStart(2, "0")}`;
        const label = `${monthNames[m - 1]} ${y}`;
        if (!map[key]) map[key] = { label, value: 0 };
        map[key].value++;
      }
    });

    return Object.keys(map)
      .sort()
      .map(k => ({ name: map[k].label, value: map[k].value }));
  }, [data]);

  // ─── Ranking de Choferes Activos ───────────────────────────────────────────
  const choferCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      if (r.asignadoA && r.asignadoA !== "Sin Asignar") {
        map[r.asignadoA] = (map[r.asignadoA] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  const recentRows = data.slice(0, 8);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title text-2xl font-bold" style={{ color: "#f8fafc" }}>Dashboard General</h2>
          <p className="section-subtitle text-sm" style={{ color: "#94a3b8" }}>
            Monitoreo en tiempo real de Coordinación, Paquetería, DHL y Falabella
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(114,176,29,0.1)", border: "1px solid rgba(114,176,29,0.3)", color: "#72b01d" }}>
          <Activity size={14} className="animate-pulse" />
          Operaciones Sincronizadas
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Cargando métricas consolidadas...</div>
      ) : (
        <>
          {/* Top KPIs Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatWidget 
              title="Total Operaciones" 
              value={counts.total} 
              sub="Todas las categorías" 
              icon={Layers} 
              color="#6366f1" 
              glow="0 0 20px rgba(99,102,241,0.12)" 
            />
            <StatWidget 
              title="Coordinación" 
              value={counts.coordinacion} 
              sub="Rutas generales" 
              icon={Calendar} 
              color="#3b82f6" 
              glow="0 0 20px rgba(59,130,246,0.12)" 
              href="/dashboard/coordinacion"
            />
            <StatWidget 
              title="Paquetería" 
              value={counts.paqueteria} 
              sub="Entregas de paquetes" 
              icon={Package} 
              color="#72b01d" 
              glow="0 0 20px rgba(114,176,29,0.12)" 
              href="/dashboard/paqueteria"
            />
            <StatWidget 
              title="DHL" 
              value={counts.dhl} 
              sub="Servicios DHL" 
              icon={Send} 
              color="#f59e0b" 
              glow="0 0 20px rgba(245,158,11,0.12)" 
              href="/dashboard/dhl"
            />
            <StatWidget 
              title="Falabella" 
              value={counts.falabella} 
              sub="Rutas Falabella" 
              icon={ShoppingBag} 
              color="#10b981" 
              glow="0 0 20px rgba(16,185,129,0.12)" 
              href="/dashboard/falabella"
            />
          </div>

          {/* Gráficos de Distribución */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Gráfico por Categoría */}
            <div className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm text-slate-100">Volumen por Categoría</div>
                  <div className="text-xs text-slate-400">Distribución de registros por módulo operacional</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryChartData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f8fafc", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                    itemStyle={{ color: "#38bdf8", fontWeight: "bold" }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="value" name="Registros" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose por Local */}
            <div className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm text-slate-100">Top Locales / Destinos</div>
                  <div className="text-xs text-slate-400">Concentración de operaciones</div>
                </div>
              </div>
              <div className="flex-1 flex justify-center items-center mb-3">
                <PieChart width={200} height={180}>
                  <Pie 
                    data={localCounts.slice(0, 5)} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={52} 
                    outerRadius={78} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {localCounts.slice(0, 5).map((entry, index) => {
                      const colors = ["#72b01d", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#64748b"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f8fafc", fontSize: 12 }}
                  />
                </PieChart>
              </div>
              <div className="space-y-2 mt-auto">
                {localCounts.slice(0, 5).map((l, i) => {
                  const colors = ["#72b01d", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#64748b"];
                  return (
                    <div key={l.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }}></div>
                        <span className="text-slate-300 font-medium truncate max-w-[130px]">{l.name}</span>
                      </div>
                      <span className="font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">{l.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Línea de tiempo & Choferes & Accesos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Gráfico Historial por Mes */}
            <div className="glass-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm text-slate-100">Historial Temporal de Servicios</div>
                  <div className="text-xs text-slate-400">Volumen operacional por mes</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={timelineCounts.length > 0 ? timelineCounts : [{ name: "Actual", value: counts.total }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#72b01d" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#72b01d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f8fafc", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="value" name="Servicios" stroke="#72b01d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTime)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Accesos Rápidos */}
            <div className="glass-card p-5">
              <div className="font-bold text-sm text-slate-100 mb-4">Accesos Directos</div>
              <div className="space-y-2">
                <Link href="/dashboard/coordinacion" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/15 text-blue-400">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Coordinación</div>
                      <div className="text-[10px] text-slate-500">Rutas y vehículos</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>

                <Link href="/dashboard/paqueteria" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-500/15 text-brand-500">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Paquetería</div>
                      <div className="text-[10px] text-slate-500">Entregas y paquetes</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>

                <Link href="/dashboard/dhl" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-400">
                      <Send size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">DHL</div>
                      <div className="text-[10px] text-slate-500">Servicios DHL</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>

                <Link href="/dashboard/falabella" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Falabella</div>
                      <div className="text-[10px] text-slate-500">Entregas Falabella</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>

                <Link href="/dashboard/technicians" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-400">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Choferes</div>
                      <div className="text-[10px] text-slate-500">Gestión de conductores</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </Link>
              </div>
            </div>

          </div>

          {/* Tabla de Actividad Reciente (Consolidada) */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-500" /> Últimos Registros en el Sistema
                </div>
                <div className="text-xs text-slate-400">Visualización consolidada de todas las categorías en tiempo real</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">PPU</th>
                    <th className="px-4 py-3 font-semibold">Chofer</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Local</th>
                    <th className="px-4 py-3 font-semibold">Puntos</th>
                    <th className="px-4 py-3 font-semibold text-right">Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {recentRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">No hay registros aún en el sistema.</td>
                    </tr>
                  ) : (
                    recentRows.map((r) => {
                      const meta = CATEGORY_META[r.category] || CATEGORY_META.otro;
                      const CatIcon = meta.icon;
                      return (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                            >
                              <CatIcon size={12} />
                              {r.categoryLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-300">{r.patente || "—"}</td>
                          <td className="px-4 py-3 text-xs">{r.asignadoA}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{r.fecha || "—"}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-300">{r.local}</td>
                          <td className="px-4 py-3 text-xs font-bold text-amber-400">{r.puntos > 0 ? r.puntos : "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <Link 
                              href={meta.href}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-white/10"
                              style={{ color: meta.color }}
                            >
                              Ver en {r.categoryLabel} <ChevronRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
