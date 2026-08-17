"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Save, X, Edit, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface CoordinacionRow {
  id: string;
  patente: string;
  nombreChofer: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  local: string;
  direccion: string;
  comuna: string;
  asignadoA: string;
  descuento: string;
  bono: string;
  vueltas: string;
}

export default function CoordinacionPage() {
  const [data, setData] = useState<CoordinacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Choferes list
  const [choferes, setChoferes] = useState<string[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CoordinacionRow | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Partial<CoordinacionRow>>({
    patente: "", nombreChofer: "", fecha: "", horaInicio: "", horaTermino: "",
    local: "", direccion: "", comuna: "", asignadoA: "",
    descuento: "", bono: "", vueltas: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('servicios').select('*');
    if (!error && rows) {
      const parsed: CoordinacionRow[] = rows.map(r => ({
        id: r.id,
        ...(r.data || {})
      }));
      // Sort by newer first
      parsed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setData(parsed);
    }
    setLoading(false);
  };

  const fetchChoferes = async () => {
    const { data: rows } = await supabase.from('tecnicos').select('*');
    if (rows) {
      setChoferes(rows.map(r => r.data?.name || "").filter(Boolean));
    }
  };

  useEffect(() => {
    fetchData();
    fetchChoferes();
  }, []);

  const openAdd = () => {
    setForm({
      patente: "", nombreChofer: "", fecha: new Date().toISOString().split('T')[0], 
      horaInicio: "", horaTermino: "", local: "", direccion: "", comuna: "", asignadoA: "",
      descuento: "", bono: "", vueltas: ""
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
        nombreChofer: form.nombreChofer,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaTermino: form.horaTermino,
        local: form.local,
        direccion: form.direccion,
        comuna: form.comuna,
        asignadoA: form.asignadoA,
        descuento: form.descuento,
        bono: form.bono,
        vueltas: form.vueltas
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
    const ws = XLSX.utils.json_to_sheet(data);
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
              placeholder="Buscar patente, chofer, local, etc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none w-full"
              style={{ color: "#f1f5f9" }}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.01)" }}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Vehículo</th>
                <th className="px-4 py-3 font-semibold">Chofer</th>
                <th className="px-4 py-3 font-semibold">Fecha / Hora</th>
                <th className="px-4 py-3 font-semibold">Local / Dirección</th>
                <th className="px-4 py-3 font-semibold">Comuna</th>
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
                    <td className="px-4 py-3 font-medium text-brand-400">{row.nombreChofer || "—"}</td>
                    <td className="px-4 py-3">
                      <div>{row.fecha || "—"}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>{row.horaInicio} - {row.horaTermino}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.local || "—"}</div>
                      <div className="text-xs truncate max-w-[150px]" style={{ color: "#64748b" }}>{row.direccion || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{row.comuna || "—"}</td>
                    <td className="px-4 py-3 text-xs">{row.asignadoA || "—"}</td>
                    <td className="px-4 py-3 text-xs text-center">
                      {(row.descuento || row.bono || row.vueltas) ? (
                        <div className="flex flex-col gap-1 items-center">
                          {row.descuento && <span className="bg-red-500/10 text-red-400 px-2 rounded">Desc: {row.descuento}</span>}
                          {row.bono && <span className="bg-green-500/10 text-green-400 px-2 rounded">Bono: {row.bono}</span>}
                          {row.vueltas && <span className="bg-blue-500/10 text-blue-400 px-2 rounded">Vueltas: {row.vueltas}</span>}
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
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Patente Vehículo</label>
                  <input
                    type="text"
                    value={form.patente}
                    onChange={(e) => setForm({...form, patente: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Ej: AB-CD-12"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre Chofer</label>
                  <input
                    type="text"
                    list="choferes-list"
                    value={form.nombreChofer}
                    onChange={(e) => setForm({...form, nombreChofer: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-slate-200 outline-none focus:border-brand-500"
                    placeholder="Escriba o seleccione..."
                  />
                  <datalist id="choferes-list">
                    {choferes.map((c, i) => <option key={i} value={c} />)}
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
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    value={form.asignadoA}
                    onChange={(e) => setForm({...form, asignadoA: e.target.value})}
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

                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Dirección</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm({...form, direccion: e.target.value})}
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

              {/* Extras Row */}
              <div className="mt-6 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>Opciones Adicionales</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-red-400">Descuento</label>
                    <input
                      type="text"
                      value={form.descuento}
                      onChange={(e) => setForm({...form, descuento: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-slate-200 outline-none focus:border-red-500"
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-green-400">Bono</label>
                    <input
                      type="text"
                      value={form.bono}
                      onChange={(e) => setForm({...form, bono: e.target.value})}
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
