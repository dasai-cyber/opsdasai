"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Save, X, Edit, Trash2, Package } from "lucide-react";
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
  "WALMART PAQUETERIA",
];

const LOCALES_VALOR_MAP: Record<string, string> = {
  "L41 HUECHURABA": "75.000",
  "L45 MAIPU": "70.000",
  "L95 LA REINA": "70.000",
};

interface PaqueteriaRow {
  id: string;
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

const normalizeString = (str: string) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export interface TarifaZonaInfo {
  tarifa: string;
  segundaVuelta: string;
  zona: string;
}

export const getTarifaByVehiculoYComuna = (vehiculo?: string, comuna?: string): TarifaZonaInfo => {
  if (!vehiculo) {
    return { tarifa: "", segundaVuelta: "", zona: "" };
  }

  const isCamion = normalizeString(vehiculo).includes("camion");
  const isFurgon = normalizeString(vehiculo).includes("furgon");

  if (!isCamion && !isFurgon) {
    return { tarifa: "", segundaVuelta: "", zona: "" };
  }

  const c = normalizeString(comuna || "");

  // 1. ALGARROBO / CARTAGENA / CASABLANCA
  const zona1 = ["algarrobo", "cartagena", "casablanca"];
  if (zona1.some(z => c.includes(z))) {
    return {
      zona: "ALGARROBO / CARTAGENA / CASABLANCA",
      tarifa: isCamion ? "200.000" : "130.000",
      segundaVuelta: isCamion ? "180.000" : "120.000",
    };
  }

  // 2. EL QUISCO / EL TABO / SAN ANTONIO / SANTO DOMINGO
  const zona2 = ["el quisco", "el tabo", "san antonio", "santo domingo"];
  if (zona2.some(z => c.includes(z))) {
    return {
      zona: "EL QUISCO / EL TABO / SAN ANTONIO / SANTO DOMINGO",
      tarifa: isCamion ? "200.000" : "130.000",
      segundaVuelta: isCamion ? "180.000" : "120.000",
    };
  }

  // 3. LOS ANDES / SAN FELIPE
  const zona3 = ["los andes", "san felipe", "calle larga", "rinconada", "san esteban", "catemu", "panquehue", "putaendo", "santa maria"];
  if (zona3.some(z => c.includes(z))) {
    return {
      zona: "LOS ANDES / SAN FELIPE",
      tarifa: isCamion ? "180.000" : "120.000",
      segundaVuelta: isCamion ? "160.000" : "110.000",
    };
  }

  // 4. COLINA / LAMPA
  const zona4 = ["colina", "lampa", "tiltil", "til til"];
  if (zona4.some(z => c.includes(z))) {
    return {
      zona: "COLINA / LAMPA",
      tarifa: isCamion ? "145.000" : "90.000",
      segundaVuelta: isCamion ? "125.000" : "80.000",
    };
  }

  // 5. BUIN / PAINE
  const zona5 = ["buin", "paine"];
  if (zona5.some(z => c.includes(z))) {
    return {
      zona: "BUIN / PAINE",
      tarifa: isCamion ? "145.000" : "90.000",
      segundaVuelta: isCamion ? "125.000" : "80.000",
    };
  }

  // 6. PEÑAFLOR / TALAGANTE / CALERA DE TANGO
  const zona6 = ["penaflor", "talagante", "calera de tango", "padre hurtado"];
  if (zona6.some(z => c.includes(z))) {
    return {
      zona: "PEÑAFLOR / TALAGANTE / CALERA DE TANGO",
      tarifa: isCamion ? "145.000" : "90.000",
      segundaVuelta: isCamion ? "125.000" : "80.000",
    };
  }

  // 7. MELIPILLA / ISLA DE MAIPO / EL MONTE
  const zona7 = ["melipilla", "isla de maipo", "el monte", "curacavi", "maria pinto", "san pedro", "alhue"];
  if (zona7.some(z => c.includes(z))) {
    return {
      zona: "MELIPILLA / ISLA DE MAIPO / EL MONTE",
      tarifa: isCamion ? "145.000" : "90.000",
      segundaVuelta: isCamion ? "125.000" : "80.000",
    };
  }

  // 8. NODO RM (Default)
  return {
    zona: "NODO RM",
    tarifa: isCamion ? "130.000" : "70.000",
    segundaVuelta: isCamion ? "110.000" : "60.000",
  };
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

export default function PaqueteriaPage() {
  const [data, setData] = useState<PaqueteriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Choferes list
  const [choferes, setChoferes] = useState<Array<{name: string, patente: string}>>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PaqueteriaRow | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Partial<PaqueteriaRow>>({
    patente: "", vehiculo: "", fecha: "", horaInicio: "", horaTermino: "",
    local: "WALMART PAQUETERIA", folio: "", puntos: "", comuna: "", asignadoA: "",
    valorDia: "", adicional: "", vueltas: "",
    v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
    sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
  });

  const [comunaRM, setComunaRM] = useState("");
  const [comunaRegiones, setComunaRegiones] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('servicios').select('*');
    if (!error && rows) {
      // Filtrar solo registros pertenecientes a paquetería
      const paqRows = rows.filter(r => r.id?.startsWith('paq-') || r.data?.type === 'paqueteria' || r.data?.categoria === 'paqueteria');
      const parsed: PaqueteriaRow[] = paqRows.map(r => {
        const dt = r.data || {};
        return {
          id: r.id,
          patente: dt.patente || "",
          vehiculo: dt.vehiculo || "",
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
      patente: "", vehiculo: "", fecha: new Date().toISOString().split('T')[0], 
      horaInicio: "", horaTermino: "", local: "WALMART PAQUETERIA", folio: "", puntos: "", comuna: "", asignadoA: "",
      valorDia: "", adicional: "", vueltas: "",
      v1: "", v2: "", v3: "", v4: "", v5: "", v6: "", v7: "",
      sg1: "", sg2: "", sg3: "", sg4: "", sg5: "", sg6: "", sg7: "", sg: ""
    });
    setComunaRM("");
    setComunaRegiones("");
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: PaqueteriaRow) => {
    setForm({ ...row, vehiculo: row.vehiculo || "" });
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
    const newId = editingRow ? editingRow.id : `paq-${Date.now()}`;
    const payload = {
      id: newId,
      data: {
        type: 'paqueteria',
        categoria: 'paqueteria',
        patente: form.patente,
        vehiculo: form.vehiculo || "",
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
    if (!confirm("¿Eliminar este registro de paquetería?")) return;
    await supabase.from('servicios').delete().eq('id', id);
    fetchData();
  };

  const exportExcel = () => {
    const formattedData = data.map(d => ({
      "PPU": d.patente,
      "Vehículo": d.vehiculo || "",
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
      "Tarifa": d.valorDia,
      "Segunda Vuelta": d.adicional,
      "Bono": d.vueltas,
      "Total": (parseMoneyValue(d.valorDia) + parseMoneyValue(d.adicional) + parseMoneyValue(d.vueltas)) > 0
        ? (parseMoneyValue(d.valorDia) + parseMoneyValue(d.adicional) + parseMoneyValue(d.vueltas)).toLocaleString("es-CL")
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Paqueteria");
    XLSX.writeFile(wb, `Paqueteria-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSgChange = (sgKey: keyof PaqueteriaRow, val: string) => {
    const updated = { ...form, [sgKey]: val };
    let total = 0;
    let hasAnySg = false;
    for (let i = 1; i <= 7; i++) {
      const k = `sg${i}` as keyof PaqueteriaRow;
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
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#f8fafc" }}>
              <Package className="text-brand-500" size={24} /> Paquetería
            </h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Gestión de entregas de paquetería, vehículos, choferes y rutas
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
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              style={{ background: "#72b01d", color: "white", border: "none" }}
            >
              <Plus size={16} /> Nueva Paquetería
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
                <th className="px-4 py-3 font-semibold">PPU / Vehículo</th>
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
                  <td colSpan={8} className="p-8 text-center" style={{ color: "#64748b" }}>No hay registros de paquetería.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold">{row.patente || "—"}</div>
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
                          {(row.valorDia !== "" && row.valorDia !== undefined) && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[11px]">Tarifa: {row.valorDia}</span>}
                          {(row.adicional !== "" && row.adicional !== undefined) && <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[11px]">Segunda vuelta: {row.adicional}</span>}
                          {(row.vueltas !== "" && row.vueltas !== undefined) && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[11px]">Bono: {row.vueltas}</span>}
                          {((parseMoneyValue(row.valorDia) + parseMoneyValue(row.adicional) + parseMoneyValue(row.vueltas)) > 0) && (
                            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                              Total: ${(parseMoneyValue(row.valorDia) + parseMoneyValue(row.adicional) + parseMoneyValue(row.vueltas)).toLocaleString("es-CL")}
                            </span>
                          )}
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
                      <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" style={{ color: "#94a3b8" }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer" style={{ color: "#ef4444" }}>
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
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#f8fafc" }}>
                <Package size={20} className="text-brand-500" /> {editingRow ? "Editar Paquetería" : "Nueva Paquetería"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Asignado a</label>
                  <input
                    type="text"
                    list="choferes-list-paq"
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
                  <datalist id="choferes-list-paq">
                    {choferes.map((c, i) => <option key={i} value={c.name} />)}
                  </datalist>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>PPU</label>
                  <input
                    list="patentes-list-paq"
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
                  <datalist id="patentes-list-paq">
                    {choferes.filter(c => c.patente).map((c, i) => <option key={i} value={c.patente} />)}
                  </datalist>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Vehículo</label>
                  <select
                    value={form.vehiculo || ""}
                    onChange={(e) => {
                      const newVehiculo = e.target.value;
                      const info = getTarifaByVehiculoYComuna(newVehiculo, form.comuna);
                      const isV2Ok = form.v2 === "OK" || form.v2 === "SI" || form.v2 === "SÍ";
                      setForm(prev => ({
                        ...prev,
                        vehiculo: newVehiculo,
                        valorDia: newVehiculo ? (info.tarifa || prev.valorDia || "") : prev.valorDia,
                        adicional: (isV2Ok || prev.adicional) && newVehiculo ? info.segundaVuelta : (newVehiculo && isV2Ok ? info.segundaVuelta : prev.adicional),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="" className="bg-[#1e293b] text-slate-400">Seleccionar vehículo...</option>
                    <option value="Furgón" className="bg-[#1e293b] text-white">Furgón</option>
                    <option value="Camión" className="bg-[#1e293b] text-white">Camión</option>
                  </select>
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
                    value={form.local || "WALMART PAQUETERIA"}
                    onChange={(e) => setForm({...form, local: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="WALMART PAQUETERIA" className="bg-[#1e293b] text-white">
                      WALMART PAQUETERIA
                    </option>
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

                {/* Casilla RM */}
                <div className="col-span-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-sky-400">RM (Región Metropolitana)</label>
                    {COMUNAS_RM.includes(form.comuna || "") && (
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <input
                    list="rm-comunas-list"
                    type="text"
                    value={comunaRM}
                    onChange={(e) => {
                      const val = e.target.value;
                      setComunaRM(val);
                      if (val) {
                        setComunaRegiones("");
                        const info = getTarifaByVehiculoYComuna(form.vehiculo, val);
                        const isV2Ok = form.v2 === "OK" || form.v2 === "SI" || form.v2 === "SÍ";
                        setForm(prev => ({
                          ...prev,
                          comuna: val,
                          valorDia: prev.vehiculo ? (info.tarifa || prev.valorDia || "") : prev.valorDia,
                          adicional: isV2Ok && prev.vehiculo ? info.segundaVuelta : prev.adicional,
                        }));
                      } else {
                        setForm(prev => ({ ...prev, comuna: "" }));
                      }
                    }}
                    placeholder="Escriba o busque comuna RM..."
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-slate-200 outline-none focus:border-sky-500"
                  />
                  <datalist id="rm-comunas-list">
                    {COMUNAS_RM.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Casilla Otras Regiones */}
                <div className="col-span-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-purple-400">Otras Regiones</label>
                    {COMUNAS_OTRAS_REGIONES.includes(form.comuna || "") && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <input
                    list="otras-regiones-list"
                    type="text"
                    value={comunaRegiones}
                    onChange={(e) => {
                      const val = e.target.value;
                      setComunaRegiones(val);
                      if (val) {
                        setComunaRM("");
                        const info = getTarifaByVehiculoYComuna(form.vehiculo, val);
                        const isV2Ok = form.v2 === "OK" || form.v2 === "SI" || form.v2 === "SÍ";
                        setForm(prev => ({
                          ...prev,
                          comuna: val,
                          valorDia: prev.vehiculo ? (info.tarifa || prev.valorDia || "") : prev.valorDia,
                          adicional: isV2Ok && prev.vehiculo ? info.segundaVuelta : prev.adicional,
                        }));
                      } else {
                        setForm(prev => ({ ...prev, comuna: "" }));
                      }
                    }}
                    placeholder="Escriba o busque comuna regiones..."
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-slate-200 outline-none focus:border-purple-500"
                  />
                  <datalist id="otras-regiones-list">
                    {COMUNAS_OTRAS_REGIONES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
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
                    const vKey = `v${num}` as keyof PaqueteriaRow;
                    const sgKey = `sg${num}` as keyof PaqueteriaRow;
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
                              const willBeOk = !isOk;
                              const nextForm = { ...form, [vKey]: willBeOk ? "OK" : "NO" };
                              if (num === 2) {
                                const info = getTarifaByVehiculoYComuna(form.vehiculo, form.comuna);
                                if (willBeOk) {
                                  nextForm.adicional = info.segundaVuelta;
                                } else {
                                  nextForm.adicional = "";
                                }
                              }
                              setForm(nextForm);
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-purple-400">Tarifa</label>
                      {form.vehiculo && (
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 truncate max-w-[120px]" title={getTarifaByVehiculoYComuna(form.vehiculo, form.comuna).zona}>
                          {getTarifaByVehiculoYComuna(form.vehiculo, form.comuna).zona.split('/')[0]}
                        </span>
                      )}
                    </div>
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
                      <label className="block text-xs font-semibold text-green-400">Segunda vuelta</label>
                      {form.vehiculo && (
                        <button
                          type="button"
                          onClick={() => {
                            const info = getTarifaByVehiculoYComuna(form.vehiculo, form.comuna);
                            setForm({ ...form, adicional: info.segundaVuelta, v2: "OK" });
                          }}
                          className="text-[10px] font-bold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-1.5 py-0.5 rounded border border-green-500/20 cursor-pointer transition-colors"
                          title="Clic para fijar tarifa de segunda vuelta según tabla"
                        >
                          ${getTarifaByVehiculoYComuna(form.vehiculo, form.comuna).segundaVuelta}
                        </button>
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-emerald-400">Total</label>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Auto (Suma)
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={
                        (parseMoneyValue(form.valorDia) + parseMoneyValue(form.adicional) + parseMoneyValue(form.vueltas)) > 0
                          ? `$ ${(parseMoneyValue(form.valorDia) + parseMoneyValue(form.adicional) + parseMoneyValue(form.vueltas)).toLocaleString("es-CL")}`
                          : "$0"
                      }
                      className="w-full px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-300 outline-none select-none cursor-default"
                      placeholder="$0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3" style={{ background: "rgba(0,0,0,0.2)" }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", color: "#e2e8f0" }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
