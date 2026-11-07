"use client";

import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  Search, Plus, Save, X, Edit, Trash2, Calendar, 
  Database, ShoppingCart, Package, Send, Download, 
  Layers, ChevronDown, CheckCircle2, TrendingUp, 
  DollarSign, User, Truck, FileSpreadsheet, Eye
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { CHILE_REGIONS } from "@/data/chileData";

const COMUNAS_RM = (CHILE_REGIONS.find(r => r.region === "Metropolitana")?.comunas || []).slice().sort((a, b) => a.localeCompare(b, "es"));

const COMUNAS_OTRAS_REGIONES = CHILE_REGIONS
  .filter(r => r.region !== "Metropolitana")
  .flatMap(r => r.comunas)
  .filter((c, index, arr) => arr.indexOf(c) === index)
  .sort((a, b) => a.localeCompare(b, "es"));

const LOCALES_LIST = [
  "L41 HUECHURABA",
  "L45 MAIPU",
  "L95 LA REINA",
  "L32 GRAN AVENIDA",
  "L48 CORDILLERA",
  "L76 DEPARTAMENTAL",
  "L83 LA FLORIDA",
  "L73 PUENTE ALTO",
  "L682 HI SAN JOAQUIN",
  "L693 LA PINTANA",
  "L87 SANTA ROSA",
  "L54 VICUÑA MACKENNA",
  "L80 LOS MORROS",
  "L798 SAN BERNARDO",
  "WALMART PAQUETERIA",
  "DHL",
];

const LOCALES_VALOR_MAP: Record<string, string> = {
  "L41 HUECHURABA": "75.000",
  "L45 MAIPU": "70.000",
  "L95 LA REINA": "70.000",
};

export type CategoriaTipo = 'coordinacion' | 'paqueteria' | 'dhl';

export interface MaestroRow {
  id: string;
  categoria: CategoriaTipo;
  patente: string;
  vehiculo?: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  local: string;
  folio: string;
  puntos: string;
  comuna: string;
  asignadoA: string;
  valorDia: string;
  adicional: string;
  vueltas: string; // Bono
  v1: string;
  v2: string;
  v3: string;
  v4: string;
  v5: string;
  v6: string;
  v7: string;
  sg1: string;
  sg2: string;
  sg3: string;
  sg4: string;
  sg5: string;
  sg6: string;
  sg7: string;
  sg: string;
}

const parseMoneyValue = (val: string | number | undefined): number => {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

const calculateAdicionalFromPuntos = (puntosVal: string | number | undefined): string => {
  if (puntosVal === undefined || puntosVal === null) return "";
  const num = typeof puntosVal === "number" ? puntosVal : parseFloat(String(puntosVal).trim());
  if (isNaN(num) || num <= 20) {
    return "";
  }
  const totalExtra = (num - 20) * 2000;
  return totalExtra.toLocaleString("es-CL");
};

export default function MaestroPage() {
  const [data, setData] = useState<MaestroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MaestroRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [choferes, setChoferes] = useState<Array<{ name: string; patente: string; vehiculo: string }>>([]);

  const [form, setForm] = useState<Partial<MaestroRow>>({
    categoria: "coordinacion",
    patente: "", vehiculo: "", fecha: new Date().toISOString().split('T')[0], 
    horaInicio: "", horaTermino: "", local: "", folio: "", puntos: "", comuna: "", asignadoA: "",
    valorDia: "", adicional: "", vueltas: "",
    v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
    sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
  });

  const [comunaRM, setComunaRM] = useState("");
  const [comunaRegiones, setComunaRegiones] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('servicios').select('*');
    const { data: techRows } = await supabase.from('tecnicos').select('*');
    const techPpuMap: Record<string, string> = {};
    if (techRows) {
      techRows.forEach(t => {
        const p = (t.data?.patente || "").toUpperCase().trim();
        const v = t.data?.tipoVehiculo || "";
        if (p && v) techPpuMap[p] = v;
      });
    }

    if (!error && rows) {
      const parsed: MaestroRow[] = rows.map(r => {
        const dt = r.data || {};
        let cat: CategoriaTipo = 'coordinacion';
        if (r.id?.startsWith('dhl-') || dt.type === 'dhl' || dt.categoria === 'dhl') {
          cat = 'dhl';
        } else if (r.id?.startsWith('paq-') || dt.type === 'paqueteria' || dt.categoria === 'paqueteria') {
          cat = 'paqueteria';
        } else {
          cat = 'coordinacion';
        }

        return {
          id: r.id,
          categoria: cat,
          patente: dt.patente || "",
          vehiculo: dt.vehiculo || techPpuMap[(dt.patente || "").toUpperCase().trim()] || "",
          fecha: dt.fecha || "",
          horaInicio: dt.horaInicio || "",
          horaTermino: dt.horaTermino || "",
          local: dt.local || "",
          folio: dt.folio || dt.guias || "",
          puntos: dt.puntos || "",
          comuna: dt.comuna || "",
          asignadoA: dt.asignadoA || "",
          valorDia: dt.valorDia || dt.descuento || "",
          adicional: dt.adicional || dt.bono || "",
          vueltas: dt.vueltas || "",
          v1: dt.v1 || "",
          v2: dt.v2 || "",
          v3: dt.v3 || "",
          v4: dt.v4 || "",
          v5: dt.v5 || "",
          v6: dt.v6 || "",
          v7: dt.v7 || "",
          sg1: dt.sg1 || dt.sg || "",
          sg2: dt.sg2 || "",
          sg3: dt.sg3 || "",
          sg4: dt.sg4 || "",
          sg5: dt.sg5 || "",
          sg6: dt.sg6 || "",
          sg7: dt.sg7 || "",
          sg: dt.sg || dt.sg1 || ""
        };
      });

      // Ordenar descendente por fecha
      parsed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setData(parsed);
    }
    setLoading(false);
  };

  const fetchChoferes = async () => {
    const { data: rows } = await supabase.from('tecnicos').select('*');
    if (rows) {
      setChoferes(rows.map(r => ({
        name: r.data?.name || "",
        patente: (r.data?.patente || "").toUpperCase().trim(),
        vehiculo: r.data?.tipoVehiculo || ""
      })).filter(c => c.name));
    }
  };

  useEffect(() => {
    fetchData();
    fetchChoferes();
  }, []);

  const openAdd = () => {
    setForm({
      categoria: "coordinacion",
      patente: "", vehiculo: "", fecha: new Date().toISOString().split('T')[0], 
      horaInicio: "", horaTermino: "", local: "", folio: "", puntos: "", comuna: "", asignadoA: "",
      valorDia: "", adicional: "", vueltas: "",
      v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
      sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
    });
    setComunaRM("");
    setComunaRegiones("");
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: MaestroRow) => {
    setForm({ ...row });
    if (COMUNAS_RM.includes(row.comuna || "")) {
      setComunaRM(row.comuna || "");
      setComunaRegiones("");
    } else if (COMUNAS_OTRAS_REGIONES.includes(row.comuna || "")) {
      setComunaRegiones(row.comuna || "");
      setComunaRM("");
    } else {
      setComunaRM(row.comuna || "");
      setComunaRegiones("");
    }
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const cat = form.categoria || 'coordinacion';
    const catPrefix = cat === 'dhl' ? 'dhl' : cat === 'paqueteria' ? 'paq' : 'coord';
    const newId = editingRow ? editingRow.id : `${catPrefix}-${Date.now()}`;
    
    const payload = {
      id: newId,
      data: {
        type: cat,
        categoria: cat,
        patente: form.patente || "",
        vehiculo: form.vehiculo || "",
        fecha: form.fecha || "",
        horaInicio: form.horaInicio || "",
        horaTermino: form.horaTermino || "",
        local: form.local || "",
        folio: form.folio || "",
        puntos: form.puntos || "",
        comuna: form.comuna || "",
        asignadoA: form.asignadoA || "",
        valorDia: form.valorDia || "",
        adicional: form.adicional || "",
        vueltas: form.vueltas || "",
        v1: form.v1 || "",
        v2: form.v2 || "",
        v3: form.v3 || "",
        v4: form.v4 || "",
        v5: form.v5 || "",
        v6: form.v6 || "",
        v7: form.v7 || "",
        sg1: form.sg1 || "",
        sg2: form.sg2 || "",
        sg3: form.sg3 || "",
        sg4: form.sg4 || "",
        sg5: form.sg5 || "",
        sg6: form.sg6 || "",
        sg7: form.sg7 || "",
        sg: form.sg1 || form.sg || ""
      }
    };

    if (editingRow) {
      await supabase.from('servicios').update(payload).eq('id', newId);
    } else {
      await supabase.from('servicios').insert(payload);
    }
    
    await fetchData();
    setSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, catLabel: string) => {
    if (!confirm(`¿Eliminar este registro del Maestro? También se eliminará de ${catLabel}.`)) return;
    await supabase.from('servicios').delete().eq('id', id);
    fetchData();
  };

  const normalizeDate = (dStr: string) => {
    if (!dStr) return "";
    const clean = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
      const parts = clean.split("-");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const parts = clean.split("/");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return clean;
  };

  // Filtrado reactivo
  const filtered = data.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = (
      r.patente.toLowerCase().includes(s) ||
      r.asignadoA.toLowerCase().includes(s) ||
      r.local.toLowerCase().includes(s) ||
      r.folio.toLowerCase().includes(s) ||
      r.comuna.toLowerCase().includes(s) ||
      (r.vehiculo && r.vehiculo.toLowerCase().includes(s))
    );

    const matchCategoria = categoriaFilter === "all" || r.categoria === categoriaFilter;

    let matchFecha = true;
    const rowDate = normalizeDate(r.fecha);
    if (fechaDesde && rowDate) {
      matchFecha = matchFecha && rowDate >= fechaDesde;
    }
    if (fechaHasta && rowDate) {
      matchFecha = matchFecha && rowDate <= fechaHasta;
    }

    return matchSearch && matchCategoria && matchFecha;
  });

  // Métricas agregadas
  const totalCount = filtered.length;
  const countSuper = filtered.filter(r => r.categoria === 'coordinacion').length;
  const countPaq = filtered.filter(r => r.categoria === 'paqueteria').length;
  const countDhl = filtered.filter(r => r.categoria === 'dhl').length;
  
  const totalPuntos = filtered.reduce((acc, r) => {
    const p = parseFloat(String(r.puntos || "0").replace(/[^0-9.]/g, ""));
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  const totalMonto = filtered.reduce((acc, r) => {
    return acc + parseMoneyValue(r.valorDia) + parseMoneyValue(r.adicional) + parseMoneyValue(r.vueltas);
  }, 0);

  const exportExcel = () => {
    const formattedData = filtered.map(d => ({
      "Origen / Categoría": d.categoria === 'coordinacion' ? 'Supermercado' : d.categoria === 'paqueteria' ? 'Paquetería' : 'DHL',
      "PPU": d.patente,
      "Vehículo": d.vehiculo || "",
      "Fecha": formatDate(d.fecha),
      "Hora Inicio": d.horaInicio,
      "Hora Término": d.horaTermino,
      "Local": d.local,
      "Folio / Guías": d.folio,
      "Comuna": d.comuna,
      "Puntos": d.puntos,
      "Asignado a": d.asignadoA,
      "V1": d.v1,
      "SG1": d.sg1 || d.sg,
      "V2": d.v2,
      "SG2": d.sg2,
      "V3": d.v3,
      "SG3": d.sg3,
      "V4": d.v4,
      "SG4": d.sg4,
      "V5": d.v5,
      "SG5": d.sg5,
      "V6": d.v6,
      "SG6": d.sg6,
      "V7": d.v7,
      "SG7": d.sg7,
      "Valor Día": d.valorDia,
      "Adicional": d.adicional,
      "Bono / Vueltas": d.vueltas,
      "Total": (parseMoneyValue(d.valorDia) + parseMoneyValue(d.adicional) + parseMoneyValue(d.vueltas)) > 0
        ? (parseMoneyValue(d.valorDia) + parseMoneyValue(d.adicional) + parseMoneyValue(d.vueltas)).toLocaleString("es-CL")
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maestro");
    XLSX.writeFile(wb, `Maestro-Servicios-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getCategoryBadge = (cat: CategoriaTipo) => {
    switch (cat) {
      case 'coordinacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShoppingCart size={11} /> Supermercado
          </span>
        );
      case 'paqueteria':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Package size={11} /> Paquetería
          </span>
        );
      case 'dhl':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Send size={11} /> DHL
          </span>
        );
      default:
        return null;
    }
  };

  const handleSgChange = (sgKey: keyof MaestroRow, val: string) => {
    const updated = { ...form, [sgKey]: val };
    let total = 0;
    let hasAnySg = false;
    for (let i = 1; i <= 7; i++) {
      const k = `sg${i}` as keyof MaestroRow;
      const v = updated[k];
      if (v && v.trim() !== "") {
        const num = parseFloat(v.trim());
        if (!isNaN(num)) {
          total += num;
          hasAnySg = true;
        }
      }
    }
    updated.puntos = hasAnySg ? String(total) : "";
    if (hasAnySg) {
      updated.adicional = calculateAdicionalFromPuntos(total);
    } else {
      updated.adicional = "";
    }
    setForm(updated);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#0a0a0b" }}>
      {/* Header */}
      <div className="p-6 border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ff5aac] to-[#5600d4] text-white shadow-lg shadow-purple-950/30">
                <Database size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#f8fafc" }}>Maestro</h1>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  Control centralizado que reúne en tiempo real Supermercado, Paquetería y DHL
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={exportExcel}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Download size={15} /> Exportar Excel
            </button>
            <button 
              onClick={openAdd}
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
              style={{ background: "linear-gradient(135deg, #ff5aac 0%, #5600d4 100%)", color: "white", border: "none", boxShadow: "0 4px 15px rgba(255,90,172,0.3)" }}
            >
              <Plus size={16} /> Nuevo Registro Maestro
            </button>
          </div>
        </div>

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Servicios</div>
            <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">En el Maestro</div>
          </div>
          <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04]">
            <div className="text-[11px] text-blue-400 font-medium uppercase tracking-wider flex items-center gap-1">
              <ShoppingCart size={11} /> Supermercado
            </div>
            <div className="text-xl font-bold text-blue-300 mt-1">{countSuper}</div>
            <div className="text-[10px] text-blue-400/60 mt-0.5">{totalCount > 0 ? `${Math.round((countSuper/totalCount)*100)}% del total` : "0%"}</div>
          </div>
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
            <div className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider flex items-center gap-1">
              <Package size={11} /> Paquetería
            </div>
            <div className="text-xl font-bold text-emerald-300 mt-1">{countPaq}</div>
            <div className="text-[10px] text-emerald-400/60 mt-0.5">{totalCount > 0 ? `${Math.round((countPaq/totalCount)*100)}% del total` : "0%"}</div>
          </div>
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
            <div className="text-[11px] text-amber-400 font-medium uppercase tracking-wider flex items-center gap-1">
              <Send size={11} /> DHL
            </div>
            <div className="text-xl font-bold text-amber-300 mt-1">{countDhl}</div>
            <div className="text-[10px] text-amber-400/60 mt-0.5">{totalCount > 0 ? `${Math.round((countDhl/totalCount)*100)}% del total` : "0%"}</div>
          </div>
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.04]">
            <div className="text-[11px] text-purple-400 font-medium uppercase tracking-wider">Total Puntos</div>
            <div className="text-xl font-bold text-purple-300 mt-1">{totalPuntos.toLocaleString("es-CL")}</div>
            <div className="text-[10px] text-purple-400/60 mt-0.5">Puntos acumulados</div>
          </div>
          <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/[0.04]">
            <div className="text-[11px] text-pink-400 font-medium uppercase tracking-wider">Facturación Est.</div>
            <div className="text-xl font-bold text-pink-300 mt-1">${totalMonto.toLocaleString("es-CL")}</div>
            <div className="text-[10px] text-pink-400/60 mt-0.5">Día + Adic. + Bono</div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="mt-5 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Búsqueda */}
          <div className="flex-1 flex items-center px-4 py-2.5 rounded-xl border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Search size={18} style={{ color: "#64748b" }} className="mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por PPU, chofer, local, folio, comuna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none w-full"
              style={{ color: "#f1f5f9" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 ml-2">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtro por Categoría */}
          <div className="shrink-0">
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="ops-select text-xs font-semibold px-3 py-2.5 rounded-xl border"
              style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.1)", color: "#f1f5f9" }}
            >
              <option value="all">Todas las Categorías</option>
              <option value="coordinacion">🛒 Supermercado</option>
              <option value="paqueteria">📦 Paquetería</option>
              <option value="dhl">✈️ DHL</option>
            </select>
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border shrink-0" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Calendar size={14} className="text-[#ff5aac] shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border shrink-0" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Calendar size={14} className="text-[#ff5aac] shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {(fechaDesde || fechaHasta || search || categoriaFilter !== "all") && (
            <button
              onClick={() => { setFechaDesde(""); setFechaHasta(""); setSearch(""); setCategoriaFilter("all"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10 shrink-0"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla Maestro */}
      <div className="flex-1 overflow-auto p-2 sm:p-6">
        <div className="rounded-xl border border-white/5 overflow-x-auto" style={{ background: "rgba(255,255,255,0.01)" }}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Origen</th>
                <th className="px-4 py-3 font-semibold">PPU / Vehículo</th>
                <th className="px-4 py-3 font-semibold">Fecha / Horario</th>
                <th className="px-4 py-3 font-semibold">Local / Folio</th>
                <th className="px-4 py-3 font-semibold">Comuna</th>
                <th className="px-4 py-3 font-semibold">Puntos</th>
                <th className="px-4 py-3 font-semibold">Chofer</th>
                <th className="px-4 py-3 font-semibold text-right">Valor Día</th>
                <th className="px-4 py-3 font-semibold text-right">Adicional</th>
                <th className="px-4 py-3 font-semibold text-right">Bono</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5" style={{ color: "#e2e8f0" }}>
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center" style={{ color: "#64748b" }}>Cargando registros del Maestro...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center" style={{ color: "#64748b" }}>No se encontraron registros en el Maestro.</td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const catLabel = row.categoria === 'coordinacion' ? 'Supermercado' : row.categoria === 'paqueteria' ? 'Paquetería' : 'DHL';
                  const rowTotal = parseMoneyValue(row.valorDia) + parseMoneyValue(row.adicional) + parseMoneyValue(row.vueltas);

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        {getCategoryBadge(row.categoria)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-slate-200">{row.patente || "—"}</div>
                        {row.vehiculo && (
                          <div className="mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              row.vehiculo.toLowerCase().includes('camión') || row.vehiculo.toLowerCase().includes('camion')
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}>
                              {row.vehiculo}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatDate(row.fecha) || "—"}</div>
                        <div className="text-xs text-slate-500">{row.horaInicio || "—"} - {row.horaTermino || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-300">{row.local || "—"}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{row.folio || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{row.comuna || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-amber-400">{row.puntos || "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-300">{row.asignadoA || "—"}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-400">
                        {row.valorDia ? `$${row.valorDia}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right text-purple-400">
                        {row.adicional ? `$${row.adicional}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right text-emerald-400">
                        {row.vueltas ? `$${row.vueltas}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-pink-400">
                        {rowTotal > 0 ? `$${rowTotal.toLocaleString("es-CL")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Editar en Maestro"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, catLabel)}
                            className="p-1.5 rounded-lg text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Eliminar de Maestro y de su categoría"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#18181b] z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff5aac] to-[#5600d4] flex items-center justify-center text-white">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingRow ? "Editar Registro en Maestro" : "Nuevo Registro Maestro"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Se sincroniza automáticamente con Supermercado, Paquetería o DHL
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Selector de Categoría Origen */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Categoría de Destino
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoria: 'coordinacion' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      form.categoria === 'coordinacion'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-950/40'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <ShoppingCart size={15} /> Supermercado
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoria: 'paqueteria' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      form.categoria === 'paqueteria'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Package size={15} /> Paquetería
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoria: 'dhl' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      form.categoria === 'dhl'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-950/40'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Send size={15} /> DHL
                  </button>
                </div>
              </div>

              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Patente (PPU)</label>
                  <input
                    type="text"
                    value={form.patente || ""}
                    onChange={(e) => setForm(f => ({ ...f, patente: e.target.value.toUpperCase() }))}
                    placeholder="Ej: AB123CD"
                    className="ops-input w-full uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Chofer (Asignado a)</label>
                  <select
                    value={form.asignadoA || ""}
                    onChange={(e) => {
                      const sel = choferes.find(c => c.name === e.target.value);
                      setForm(f => ({
                        ...f,
                        asignadoA: e.target.value,
                        patente: (!f.patente && sel?.patente) ? sel.patente : f.patente,
                        vehiculo: (!f.vehiculo && sel?.vehiculo) ? sel.vehiculo : f.vehiculo
                      }));
                    }}
                    className="ops-select w-full"
                  >
                    <option value="">Seleccionar Chofer...</option>
                    {choferes.map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Tipo Vehículo</label>
                  <input
                    type="text"
                    value={form.vehiculo || ""}
                    onChange={(e) => setForm(f => ({ ...f, vehiculo: e.target.value }))}
                    placeholder="Ej: FURGON, SEDAN..."
                    className="ops-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha || ""}
                    onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="ops-input w-full [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Hora Inicio</label>
                  <input
                    type="time"
                    value={form.horaInicio || ""}
                    onChange={(e) => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                    className="ops-input w-full [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Hora Término</label>
                  <input
                    type="time"
                    value={form.horaTermino || ""}
                    onChange={(e) => setForm(f => ({ ...f, horaTermino: e.target.value }))}
                    className="ops-input w-full [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Local / Base</label>
                  <select
                    value={form.local || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(f => ({
                        ...f,
                        local: val,
                        valorDia: LOCALES_VALOR_MAP[val] || f.valorDia || ""
                      }));
                    }}
                    className="ops-select w-full"
                  >
                    <option value="">Seleccionar Local...</option>
                    {LOCALES_LIST.map((loc, idx) => (
                      <option key={idx} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Folio / Guías</label>
                  <input
                    type="text"
                    value={form.folio || ""}
                    onChange={(e) => setForm(f => ({ ...f, folio: e.target.value }))}
                    placeholder="N° Folio o Guía"
                    className="ops-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Puntos</label>
                  <input
                    type="text"
                    value={form.puntos || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(f => ({
                        ...f,
                        puntos: val,
                        adicional: calculateAdicionalFromPuntos(val)
                      }));
                    }}
                    placeholder="Puntos entregados"
                    className="ops-input w-full"
                  />
                </div>
              </div>

              {/* Comunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Comuna (Región Metropolitana)</label>
                  <select
                    value={comunaRM}
                    onChange={(e) => {
                      const val = e.target.value;
                      setComunaRM(val);
                      setComunaRegiones("");
                      setForm(f => ({ ...f, comuna: val }));
                    }}
                    className="ops-select w-full"
                  >
                    <option value="">Seleccionar Comuna RM...</option>
                    {COMUNAS_RM.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Comuna (Otras Regiones)</label>
                  <select
                    value={comunaRegiones}
                    onChange={(e) => {
                      const val = e.target.value;
                      setComunaRegiones(val);
                      setComunaRM("");
                      setForm(f => ({ ...f, comuna: val }));
                    }}
                    className="ops-select w-full"
                  >
                    <option value="">Seleccionar Comuna Regiones...</option>
                    {COMUNAS_OTRAS_REGIONES.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valores Económicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Valor Día ($)</label>
                  <input
                    type="text"
                    value={form.valorDia || ""}
                    onChange={(e) => setForm(f => ({ ...f, valorDia: e.target.value }))}
                    placeholder="Ej: 70.000"
                    className="ops-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Adicional ($)</label>
                  <input
                    type="text"
                    value={form.adicional || ""}
                    onChange={(e) => setForm(f => ({ ...f, adicional: e.target.value }))}
                    placeholder="Ej: 14.000"
                    className="ops-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Bono / Vueltas ($)</label>
                  <input
                    type="text"
                    value={form.vueltas || ""}
                    onChange={(e) => setForm(f => ({ ...f, vueltas: e.target.value }))}
                    placeholder="Ej: 15.000"
                    className="ops-input w-full"
                  />
                </div>
              </div>

              {/* Vueltas y Segundas Vueltas */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Detalle de Vueltas (V1 - V7) y Segundas Vueltas (SG1 - SG7)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const vKey = `v${num}` as keyof MaestroRow;
                    const sgKey = `sg${num}` as keyof MaestroRow;
                    return (
                      <div key={num} className="p-2 rounded-lg bg-black/30 border border-white/5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 text-center">Vuelta {num}</div>
                        <input
                          type="text"
                          value={form[vKey] || ""}
                          onChange={(e) => setForm(f => ({ ...f, [vKey]: e.target.value }))}
                          placeholder={`V${num}`}
                          className="ops-input w-full text-center text-xs mb-1.5"
                        />
                        <div className="text-[10px] font-semibold text-purple-400 mb-1 text-center">Segunda</div>
                        <input
                          type="text"
                          value={form[sgKey] || ""}
                          onChange={(e) => handleSgChange(sgKey, e.target.value)}
                          placeholder={`SG${num}`}
                          className="ops-input w-full text-center text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-[#18181b]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ff5aac 0%, #5600d4 100%)", boxShadow: "0 4px 15px rgba(255,90,172,0.3)" }}
              >
                <Save size={16} /> {saving ? "Guardando..." : "Guardar en Maestro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
