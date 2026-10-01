"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Save, X, Edit, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

const LOCALES_LIST = [
  "L41 HUECHURABA",
  "L45 MAIPU",
  "L95 LA REINA",
  "WALMART PAQUETERIA",
  "FALABELLA",
  "DHL",
];

const LOCALES_VALOR_MAP: Record<string, string> = {
  "L41 HUECHURABA": "75.000",
  "L45 MAIPU": "70.000",
  "L95 LA REINA": "70.000",
};

interface CoordinacionRow {
  id: string;
  patente: string;
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
  vueltas: string;
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

export default function CoordinacionPage() {
  const [data, setData] = useState<CoordinacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Choferes list
  const [choferes, setChoferes] = useState<Array<{name: string, patente: string}>>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CoordinacionRow | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Partial<CoordinacionRow>>({
    patente: "", fecha: "", horaInicio: "", horaTermino: "",
    local: "", folio: "", puntos: "", comuna: "", asignadoA: "",
    valorDia: "", adicional: "", vueltas: "",
    v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
    sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('servicios').select('*');
    if (!error && rows) {
      const parsed: CoordinacionRow[] = rows.map(r => {
        const dt = r.data || {};
        return {
          id: r.id,
          patente: dt.patente || "",
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
      // Sort by newer first
      parsed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setData(parsed);
    }
    setLoading(false);
  };

  const fetchChoferes = async () => {
    const { data: rows } = await supabase.from('tecnicos').select('*');
    if (rows) {
      setChoferes(rows.map(r => ({ name: r.data?.name || "", patente: r.data?.patente || "" })).filter(c => c.name));
    }
  };

  useEffect(() => {
    fetchData();
    fetchChoferes();
  }, []);

  const openAdd = () => {
    setForm({
      patente: "", fecha: new Date().toISOString().split('T')[0], 
      horaInicio: "", horaTermino: "", local: "", folio: "", puntos: "", comuna: "", asignadoA: "",
      valorDia: "", adicional: "", vueltas: "",
      v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
      sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
    });
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: CoordinacionRow) => {
    setForm({ ...row });
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const newId = editingRow ? editingRow.id : `coord-${Date.now()}`;
    const payload = {
      id: newId,
      data: {
        patente: form.patente,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaTermino: form.horaTermino,
        local: form.local,
        folio: form.folio,
        puntos: form.puntos,
        comuna: form.comuna,
        asignadoA: form.asignadoA,
        valorDia: form.valorDia,
        adicional: form.adicional,
        vueltas: form.vueltas,
        v1: form.v1,
        v2: form.v2,
        v3: form.v3,
        v4: form.v4,
        v5: form.v5,
        v6: form.v6,
        v7: form.v7,
        sg1: form.sg1,
        sg2: form.sg2,
        sg3: form.sg3,
        sg4: form.sg4,
        sg5: form.sg5,
        sg6: form.sg6,
        sg7: form.sg7,
        sg: form.sg1 || form.sg
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await supabase.from('servicios').delete().eq('id', id);
    fetchData();
  };

  const exportExcel = () => {
    const formattedData = data.map(d => ({
      "PPU": d.patente,
      "Fecha": d.fecha,
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
      "Bono": d.vueltas,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coordinacion");
    XLSX.writeFile(wb, `Coordinacion-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleSgChange = (sgKey: keyof CoordinacionRow, val: string) => {
    const updated = { ...form, [sgKey]: val };
    let total = 0;
    let hasAnySg = false;
    for (let i = 1; i <= 7; i++) {
      const k = `sg${i}` as keyof CoordinacionRow;
      const v = updated[k] || (i === 1 && !updated.sg1 ? updated.sg : "");
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        const num = parseFloat(String(v).trim());
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

  const filtered = data.filter(d => 
    JSON.stringify(d).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#0a0a0b" }}>
      {/* Header */}
      <div className="p-6 border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f8fafc" }}>Coordinación</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Gestión de vehículos, choferes y rutas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportExcel}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.05)", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Exportar Excel
            </button>
            <button 
              onClick={openAdd}
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
              style={{ background: "#72b01d", color: "white", border: "none" }}
            >
              <Plus size={16} /> Nueva Coordinación
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mt-6">
          <div className="flex items-center px-4 py-2.5 rounded-xl border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Search size={18} style={{ color: "#64748b" }} className="mr-3" />
            <input
              type="text"
              placeholder="Buscar PPU, chofer, local, etc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none w-full"
              style={{ color: "#f1f5f9" }}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto p-2 sm:p-6">
        <div className="rounded-xl border border-white/5 overflow-x-auto" style={{ background: "rgba(255,255,255,0.01)" }}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
              <tr>
                <th className="px-4 py-3 font-semibold">PPU</th>
                                <th className="px-4 py-3 font-semibold">Fecha / Hora</th>
                <th className="px-4 py-3 font-semibold">Local / Folio</th>
                <th className="px-4 py-3 font-semibold">Comuna</th>
                <th className="px-4 py-3 font-semibold">Puntos</th>
                <th className="px-4 py-3 font-semibold">Asignado a</th>
                <th className="px-4 py-3 font-semibold text-center">Extras</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5" style={{ color: "#e2e8f0" }}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center" style={{ color: "#64748b" }}>Cargando datos...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center" style={{ color: "#64748b" }}>No hay registros.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{row.patente || "—"}</td>
                                        <td className="px-4 py-3">
                      <div>{row.fecha || "—"}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>{row.horaInicio} - {row.horaTermino}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.local || "—"}</div>
                      <div className="text-xs truncate max-w-[150px]" style={{ color: "#64748b" }}>{row.folio || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{row.comuna || "—"}</td>
                    <td className="px-4 py-3 text-xs">{row.puntos || "—"}</td>
                    <td className="px-4 py-3 text-xs">{row.asignadoA || "—"}</td>
                    <td className="px-4 py-3 text-xs text-center">
                      {((row.valorDia !== "" && row.valorDia !== undefined) || 
                        (row.adicional !== "" && row.adicional !== undefined) || 
                        (row.vueltas !== "" && row.vueltas !== undefined) ||
                        row.v1 || row.v2 || row.v3 || row.v4 || row.v5 || row.v6 || row.v7 ||
                        row.sg1 || row.sg2 || row.sg3 || row.sg4 || row.sg5 || row.sg6 || row.sg7 || row.sg) ? (
                        <div className="flex flex-col gap-1 items-center">
                          {(row.valorDia !== "" && row.valorDia !== undefined) && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[11px]">Valor día: {row.valorDia}</span>}
                          {(row.adicional !== "" && row.adicional !== undefined) && <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[11px]">Adicional: {row.adicional}</span>}
                          {(row.vueltas !== "" && row.vueltas !== undefined) && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[11px]">Bono: {row.vueltas}</span>}
                          <div className="flex flex-wrap gap-1 justify-center mt-1 max-w-[280px]">
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                              const vVal = (row as any)[`v${num}`];
                              const sgVal = (row as any)[`sg${num}`] || (num === 1 ? row.sg : "");
                              if (!vVal && !sgVal) return null;
                              return (
                                <span key={num} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                                  <span>V{num}{vVal ? `: ${vVal}` : ""}</span>
                                  {sgVal && <span className="text-amber-300 font-semibold">(SG: {sgVal})</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" style={{ color: "#94a3b8" }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" style={{ color: "#ef4444" }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 flex flex-col max-h-[90vh]" style={{ background: "#1e293b", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold" style={{ color: "#f8fafc" }}>
                {editingRow ? "Editar Coordinación" : "Nueva Coordinación"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.asignadoA}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matched = choferes.find(c => c.name === selectedName);
                      setForm({
                        ...form, 
                        asignadoA: selectedName,
                        patente: matched && matched.patente && !form.patente ? matched.patente : (matched && matched.patente && form.patente !== matched.patente ? matched.patente : form.patente)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                  <datalist id="choferes-list">
                    {choferes.map((c, i) => <option key={i} value={c.name} />)}
                  </datalist>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>PPU</label>
                  <input
                    list="patentes-list"
                    type="text"
                    value={form.patente}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = choferes.find(c => c.patente && c.patente.toLowerCase() === val.toLowerCase());
                      setForm({
                        ...form,
                        patente: val,
                        asignadoA: matched && matched.name ? matched.name : form.asignadoA
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Ej: AB-CD-12"
                  />
                  <datalist id="patentes-list">
                    {choferes.filter(c => c.patente).map((c, i) => <option key={i} value={c.patente} />)}
                  </datalist>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({...form, fecha: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Hora Inicio</label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setForm({...form, horaInicio: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Hora Término</label>
                  <input
                    type="time"
                    value={form.horaTermino}
                    onChange={(e) => setForm({...form, horaTermino: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Local</label>
                  <select
                    value={form.local || ""}
                    onChange={(e) => {
                      const selectedLocal = e.target.value;
                      const autoPrice = LOCALES_VALOR_MAP[selectedLocal];
                      setForm({
                        ...form,
                        local: selectedLocal,
                        ...(autoPrice ? { valorDia: autoPrice } : {}),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">Seleccionar local...</option>
                    {LOCALES_LIST.map((loc) => (
                      <option key={loc} value={loc} className="bg-[#1e293b] text-white">
                        {loc}
                      </option>
                    ))}
                    {form.local && !LOCALES_LIST.includes(form.local) && (
                      <option value={form.local} className="bg-[#1e293b] text-white">
                        {form.local}
                      </option>
                    )}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Folio</label>
                  <input
                    type="text"
                    value={form.folio}
                    onChange={(e) => setForm({...form, folio: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold" style={{ color: "#94a3b8" }}>Puntos</label>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Auto (Suma SG)</span>
                  </div>
                  <input
                    type="text"
                    value={form.puntos}
                    onChange={(e) => {
                      const val = e.target.value;
                      const autoAdicional = calculateAdicionalFromPuntos(val);
                      setForm({
                        ...form,
                        puntos: val,
                        adicional: autoAdicional,
                      });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm font-bold text-amber-300 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Comuna</label>
                  <input
                    type="text"
                    value={form.comuna}
                    onChange={(e) => setForm({...form, comuna: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>
                
              </div>

              {/* Casillas V1..V7 y SG1..SG7 */}
              <div className="mt-6 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 border-b border-white/5 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Control de Vueltas (V1 - V7) y Paquetes (SG1 - SG7)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Coloca <span className="text-emerald-400 font-bold">OK</span> al terminar y los paquetes en <span className="text-amber-400 font-bold">SG</span> (se suman en Puntos)
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const vKey = `v${num}` as keyof CoordinacionRow;
                    const sgKey = `sg${num}` as keyof CoordinacionRow;
                    const currentV = (form[vKey] as string) || "";
                    const isOk = currentV === "OK" || currentV === "SI" || currentV === "SÍ";
                    const currentSG = (form[sgKey] as string) || (num === 1 && !form.sg1 ? (form.sg || "") : "");
                    return (
                      <div key={num} className="p-2.5 rounded-xl border border-white/10 bg-black/30 flex flex-col gap-2">
                        <div className="text-center font-extrabold text-xs text-white border-b border-white/5 pb-1">
                          Vuelta {num}
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1 text-center">V{num}</label>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, [vKey]: isOk ? "NO" : "OK" });
                            }}
                            className={`w-full py-2 px-1 rounded-lg border text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer select-none ${
                              isOk
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/40 ring-1 ring-emerald-400/50"
                                : "bg-red-950/70 hover:bg-red-900/80 text-red-300 border-red-500/50"
                            }`}
                          >
                            {isOk ? (
                              <>
                                <span>✓</span>
                                <span>OK</span>
                              </>
                            ) : (
                              <>
                                <span>✕</span>
                                <span>NO</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1 text-center">SG</label>
                          <input
                            type="text"
                            value={currentSG}
                            onChange={(e) => handleSgChange(sgKey, e.target.value)}
                            placeholder="Cant."
                            className="w-full px-2 py-1.5 text-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 outline-none focus:border-amber-400 placeholder:text-amber-500/40"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extras Row */}
              <div className="mt-6 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>Opciones Adicionales</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-purple-400">Valor día</label>
                    <input
                      type="text"
                      value={form.valorDia}
                      onChange={(e) => setForm({...form, valorDia: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-sm text-slate-200 outline-none focus:border-purple-500"
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-green-400">Adicional</label>
                      {parseFloat(form.puntos || "0") >= 21 && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                          Auto (+21 Pts)
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={form.adicional}
                      onChange={(e) => setForm({...form, adicional: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5 text-sm text-slate-200 outline-none focus:border-green-500"
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-blue-400">Bono</label>
                    <input
                      type="text"
                      value={form.vueltas}
                      onChange={(e) => setForm({...form, vueltas: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm text-slate-200 outline-none focus:border-blue-500"
                      placeholder="$0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3" style={{ background: "rgba(0,0,0,0.2)" }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", color: "#e2e8f0" }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: "#72b01d", color: "white" }}
              >
                <Save size={16} /> {saving ? "Guardando..." : "Guardar Registro"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
