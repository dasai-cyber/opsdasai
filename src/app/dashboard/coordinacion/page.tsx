"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Save, X, Edit, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

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
    v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", sg: ""
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
          sg: dt.sg || ""
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
      v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", sg: ""
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
        sg: form.sg
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
      "V2": d.v2,
      "V3": d.v3,
      "V4": d.v4,
      "V5": d.v5,
      "V6": d.v6,
      "SG (Paquetes)": d.sg,
      "Valor Día": d.valorDia,
      "Adicional": d.adicional,
      "Vueltas": d.vueltas,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coordinacion");
    XLSX.writeFile(wb, `Coordinacion-${new Date().toISOString().split('T')[0]}.xlsx`);
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
                        row.v1 || row.v2 || row.v3 || row.v4 || row.v5 || row.v6 || row.sg) ? (
                        <div className="flex flex-col gap-1 items-center">
                          {(row.valorDia !== "" && row.valorDia !== undefined) && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[11px]">Valor día: {row.valorDia}</span>}
                          {(row.adicional !== "" && row.adicional !== undefined) && <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[11px]">Adicional: {row.adicional}</span>}
                          {(row.vueltas !== "" && row.vueltas !== undefined) && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[11px]">Vueltas: {row.vueltas}</span>}
                          {(row.v1 || row.v2 || row.v3 || row.v4 || row.v5 || row.v6 || row.sg) && (
                            <div className="flex flex-wrap gap-1 justify-center mt-1">
                              {row.v1 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V1: {row.v1}</span>}
                              {row.v2 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V2: {row.v2}</span>}
                              {row.v3 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V3: {row.v3}</span>}
                              {row.v4 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V4: {row.v4}</span>}
                              {row.v5 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V5: {row.v5}</span>}
                              {row.v6 && <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">V6: {row.v6}</span>}
                              {row.sg && <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">SG: {row.sg} paq.</span>}
                            </div>
                          )}
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
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 flex flex-col max-h-[90vh]" style={{ background: "#1e293b", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
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
                  <input
                    type="text"
                    value={form.local}
                    onChange={(e) => setForm({...form, local: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                  />
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
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Puntos</label>
                  <input
                    type="text"
                    value={form.puntos}
                    onChange={(e) => setForm({...form, puntos: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
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

              {/* Casillas V1..V6 y SG (Paquetes) */}
              <div className="mt-6 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Control de Vueltas (V1 - V6) y Paquetes (SG)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Coloca <span className="text-emerald-400 font-bold">OK</span> al terminar cada vuelta
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                  {/* V1 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V1</label>
                    <input
                      type="text"
                      value={form.v1 || ""}
                      onChange={(e) => setForm({...form, v1: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* V2 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V2</label>
                    <input
                      type="text"
                      value={form.v2 || ""}
                      onChange={(e) => setForm({...form, v2: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* V3 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V3</label>
                    <input
                      type="text"
                      value={form.v3 || ""}
                      onChange={(e) => setForm({...form, v3: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* V4 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V4</label>
                    <input
                      type="text"
                      value={form.v4 || ""}
                      onChange={(e) => setForm({...form, v4: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* V5 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V5</label>
                    <input
                      type="text"
                      value={form.v5 || ""}
                      onChange={(e) => setForm({...form, v5: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* V6 */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-emerald-400 text-center">V6</label>
                    <input
                      type="text"
                      value={form.v6 || ""}
                      onChange={(e) => setForm({...form, v6: e.target.value.toUpperCase()})}
                      placeholder="OK"
                      className="w-full px-2 py-2 text-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none focus:border-emerald-400 placeholder:text-emerald-600/40"
                    />
                  </div>

                  {/* SG */}
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold mb-1 text-amber-400 text-center">SG</label>
                    <input
                      type="text"
                      value={form.sg || ""}
                      onChange={(e) => setForm({...form, sg: e.target.value})}
                      placeholder="Paq."
                      className="w-full px-2 py-2 text-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm font-bold text-amber-300 outline-none focus:border-amber-400 placeholder:text-amber-500/40"
                    />
                  </div>
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
                    <label className="block text-xs font-semibold mb-1.5 text-green-400">Adicional</label>
                    <input
                      type="text"
                      value={form.adicional}
                      onChange={(e) => setForm({...form, adicional: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5 text-sm text-slate-200 outline-none focus:border-green-500"
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-blue-400">Vueltas</label>
                    <input
                      type="text"
                      value={form.vueltas}
                      onChange={(e) => setForm({...form, vueltas: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm text-slate-200 outline-none focus:border-blue-500"
                      placeholder="Ej: 2"
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
