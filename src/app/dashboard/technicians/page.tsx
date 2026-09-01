"use client";

import { useState, useEffect } from "react";
import {
  Search, Phone, Mail, MapPin, Award, X, TrendingUp,
  CheckCircle2, Plus, Save, User, Pencil, Truck, Trash2, Download, FileText,
} from "lucide-react";
import { getStatusBg } from "@/lib/utils";
import type { Technician, TechnicianStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const normalizeString = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

const STATUS_OPTS: TechnicianStatus[] = ["disponible", "en ruta", "trabajando", "offline"];
const STATUS_COLOR: Record<TechnicianStatus, string> = {
  disponible: "#93c947", "en ruta": "#72b01d", trabajando: "#f59e0b", offline: "#64748b",
};


const uploadDocument = async (file: File | null, id: string, name: string) => {
  if (!file) return undefined;
  const fileExt = file.name.split('.').pop();
  const filePath = `${id}/${name}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('choferes_docs').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('choferes_docs').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Add Technician Modal ───────────────────────────────────────────────────────
function AddTechModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (tech: Technician) => void;
}) {
  // supabase is imported at top level
  const [form, setForm] = useState({
    techNumber: "",
    name: "",
    rut: "",
    direccion: "",
    comuna: "",
    phone: "",
    phone2: "",
    estadoCivil: "",
    estudios: "",
    patente: "",
    modeloAuto: "",
    anioAuto: "",
    email: "",
    status: "disponible" as TechnicianStatus,
    certInput: "",
  });
  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licenciaFrontal: null as File | null,
    licenciaTrasera: null as File | null,
    carnetFrontal: null as File | null,
    carnetTrasera: null as File | null,
    certificadoAntecedentes: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.rut.trim()) e.rut = "El RUT es obligatorio";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveError("");
    setUploading(true);
    const newId = `tech-${Date.now()}`;
    
    try {
      const docsUrls: any = {};
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, newId, 'hojaConductor');
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, newId, 'licenciaFrontal');
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, newId, 'licenciaTrasera');
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, newId, 'carnetFrontal');
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, newId, 'carnetTrasera');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, newId, 'certificadoAntecedentes');

      const newTech: Technician = {
        id: newId,
        name: form.name.trim(),
        rut: form.rut.trim(),
        direccion: form.direccion.trim(),
        comuna: form.comuna.trim(),
        phone: form.phone.trim(),
        phone2: form.phone2.trim(),
        estadoCivil: form.estadoCivil.trim(),
        estudios: form.estudios.trim(),
        patente: form.patente.trim().toUpperCase(),
        modeloAuto: form.modeloAuto.trim(),
        anioAuto: form.anioAuto.trim(),
        email: form.email.trim(),
        status: form.status,
        completedOrders: 0,
        avgTime: 0,
        productivity: 0,
        documentos: docsUrls,
      };
      
      const { error: insertError } = await supabase.from('tecnicos').insert({ id: newId, data: newTech });
      if (insertError) {
        setSaveError('Error al guardar: ' + insertError.message);
        setUploading(false);
        return;
      }
      setSaved(true);
      setTimeout(() => { onAdd(newTech); onClose(); }, 900);
    } catch (e: any) {
      setSaveError("Error al subir archivos: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(27,30,36,0.95)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#e2e8f0",
    outline: "none",
    fontFamily: "inherit",
  };

  const errStyle: React.CSSProperties = { color: "#f87171", fontSize: 11, marginTop: 3 };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.12)" }}>
                <User size={18} style={{ color: "#72b01d" }} />
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#f1f5f9" }}>Agregar Chofer</div>
                <div className="text-xs" style={{ color: "#475569" }}>Completa los datos del nuevo chofer</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">

            {/* Nombre y RUT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Nombre completo <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: Juan Pérez González" value={form.name} onChange={set("name")} />
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  RUT <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 12.345.678-9" value={form.rut} onChange={set("rut")} />
                {errors.rut && <div style={errStyle}>{errors.rut}</div>}
              </div>
            </div>

            {/* Dirección / Comuna */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Dirección
                </label>
                <input style={inputStyle} placeholder="Ej: Av. Providencia 1234" value={form.direccion} onChange={set("direccion")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Comuna
                </label>
                <input style={inputStyle} placeholder="Ej: Providencia" value={form.comuna} onChange={set("comuna")} />
              </div>
            </div>

            {/* Teléfono / Teléfono 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Teléfono <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 56944771425" value={form.phone} onChange={set("phone")} />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  WhatsApp / Secundario
                </label>
                <input style={inputStyle} placeholder="Ej: 56911223344" value={form.phone2} onChange={set("phone2")} />
              </div>
            </div>

            {/* Correo / vacio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <input style={inputStyle} type="email" placeholder="nombre@correo.cl" value={form.email} onChange={set("email")} />
              </div>
            </div>

            {/* Estado Civil / Estudios */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado civil
                </label>
                <input style={inputStyle} placeholder="Ej: Soltero" value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estudios
                </label>
                <input style={inputStyle} placeholder="Ej: Educación Media Completa" value={form.estudios} onChange={set("estudios")} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 16 }}>
            </div>
            
            {/* Vehículo info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Patente
                </label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="EJ: AB-CD-12" value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Modelo
                </label>
                <input style={inputStyle} placeholder="Ej: Kia Rio" value={form.modeloAuto} onChange={set("modeloAuto")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Año
                </label>
                <input style={inputStyle} placeholder="Ej: 2018" value={form.anioAuto} onChange={set("anioAuto")} />
              </div>
            </div>

            {/* Documentos */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", marginBottom: 12 }}>
              <div className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>Documentos Adjuntos (PDF o Imagen)</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor' },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)' },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)' },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)' },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      style={{ fontSize: 12, color: "#e2e8f0", width: "100%" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDocs(d => ({ ...d, [key]: file }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Estado */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Estado inicial
              </label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TechnicianStatus }))}
              >
                {STATUS_OPTS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 24px",
                  background: saved ? "#578814" : "linear-gradient(135deg, #72b01d, #578814)",
                  color: "white", borderRadius: 9, fontSize: 14, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(114,176,29,0.35)", fontFamily: "inherit",
                }}
              >
                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {uploading ? "Subiendo..." : saved ? "¡Guardado!" : "Guardar Chofer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Tech Modal ───────────────────────────────────────────────────────────
function EditTechModal({
  tech, onClose, onSave,
}: {
  tech: Technician;
  onClose: () => void;
  onSave: (updated: Technician) => void;
}) {
  const [form, setForm] = useState({
    name: tech.name,
    rut: tech.rut,
    direccion: tech.direccion || "",
    comuna: tech.comuna || "",
    phone: tech.phone,
    phone2: tech.phone2 || "",
    estadoCivil: tech.estadoCivil || "",
    estudios: tech.estudios || "",
    patente: tech.patente || "",
    modeloAuto: tech.modeloAuto || "",
    anioAuto: tech.anioAuto || "",
    email: tech.email,
    status: tech.status,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [docs, setDocs] = useState({
    hojaConductor: null as File | null,
    licenciaFrontal: null as File | null,
    licenciaTrasera: null as File | null,
    carnetFrontal: null as File | null,
    carnetTrasera: null as File | null,
    certificadoAntecedentes: null as File | null,
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(27,30,36,0.95)",
    border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8,
    padding: "10px 14px", fontSize: 13.5, color: "#e2e8f0",
    outline: "none", fontFamily: "inherit",
  };

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      const docsUrls = { ...(tech.documentos || {}) };
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, tech.id, 'hojaConductor');
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, tech.id, 'licenciaFrontal');
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, tech.id, 'licenciaTrasera');
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, tech.id, 'carnetFrontal');
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, tech.id, 'carnetTrasera');
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, tech.id, 'certificadoAntecedentes');

      const updated = { ...tech, ...form, patente: form.patente.trim().toUpperCase(), documentos: docsUrls };
      const { error } = await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => { onSave(updated); onClose(); }, 800);
    } catch (e: any) {
      setSaveError('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const REGIONS = ["Metropolitana","Valparaíso","Biobío","Tarapacá","Antofagasta","Atacama","Coquimbo","O'Higgins","Maule","Ñuble","La Araucanía","Los Ríos","Los Lagos","Aysén","Magallanes","Arica y Parinacota"];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.12)" }}>
                <Pencil size={18} style={{ color: "#72b01d" }} />
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#f1f5f9" }}>Editar Chofer</div>
                <div className="text-xs" style={{ color: "#475569" }}>{tech.name}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Nombre completo *</label>
                <input style={inputStyle} value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>RUT</label>
                <input style={inputStyle} value={form.rut} onChange={set("rut")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Dirección</label>
                <input style={inputStyle} value={form.direccion} onChange={set("direccion")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Comuna</label>
                <input style={inputStyle} value={form.comuna} onChange={set("comuna")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Teléfono principal</label>
                <input style={inputStyle} value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>WhatsApp / Secundario</label>
                <input style={inputStyle} value={form.phone2} onChange={set("phone2")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Correo electrónico</label>
                <input style={inputStyle} type="email" value={form.email} onChange={set("email")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado Civil</label>
                <input style={inputStyle} value={form.estadoCivil} onChange={set("estadoCivil")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estudios</label>
                <input style={inputStyle} value={form.estudios} onChange={set("estudios")} />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Patente Vehículo</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set("patente")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Modelo Auto</label>
                <input style={inputStyle} value={form.modeloAuto} onChange={set("modeloAuto")} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Año Auto</label>
                <input style={inputStyle} value={form.anioAuto} onChange={set("anioAuto")} />
              </div>
            </div>
            {/* Documentos */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", marginBottom: 12 }}>
              <div className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>Documentos Adjuntos (PDF o Imagen)</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor' },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)' },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)' },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)' },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      style={{ fontSize: 12, color: "#e2e8f0", width: "100%" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDocs(d => ({ ...d, [key]: file }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#94a3b8", marginBottom:6 }}>Estado</label>
              <select style={{ ...inputStyle, cursor:"pointer" }} value={form.status} onChange={set("status")}>
                <option value="disponible">Disponible</option>
                <option value="en ruta">En ruta</option>
                <option value="trabajando">Trabajando</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {saveError && (
              <div className="p-3 rounded-lg text-sm" style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171" }}>{saveError}</div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display:"inline-flex", alignItems:"center", gap:8, padding:"10px 24px",
                  background: saved ? "#578814" : "linear-gradient(135deg,#72b01d,#578814)",
                  color:"white", borderRadius:9, fontSize:14, fontWeight:700,
                  border:"none", cursor:"pointer", opacity: saving ? 0.7 : 1,
                  boxShadow:"0 4px 16px rgba(114,176,29,0.35)", fontFamily:"inherit",
                }}
              >
                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saved ? "¡Guardado!" : saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tech Detail Modal ─────────────────────────────────────────────────────────
function TechModal({
  tech, onClose, onUpdateStatus, onEdit, onDelete,
}: {
  tech: Technician;
  onClose: () => void;
  onUpdateStatus: (id: string, s: TechnicianStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {

  const downloadInfo = () => {
    const text = `FICHA DE CHOFER - OPSDASAI\n\n` +
      `Nombre: ${tech.name}\n` +
      `RUT: ${tech.rut}\n` +
      `Teléfono: ${tech.phone}\n` +
      `Email: ${tech.email || "—"}\n` +
      `Estado: ${tech.status.toUpperCase()}\n` +
      `Comuna: ${tech.comuna || "—"}\n` +
      `Dirección: ${tech.direccion || "—"}\n` +
      `Estado Civil: ${tech.estadoCivil || "—"}\n` +
      `Nivel de Estudios: ${tech.estudios || "—"}\n` +
      `Patente Vehículo: ${tech.patente || "—"}\n\n` +
      `Métricas:\n` +
      `- Coordinaciones: ${tech.completedOrders}\n` +
      `- Productividad: ${tech.productivity}%\n`;
      
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Chofer_${tech.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const radarData = [
    { subject: "Productividad", value: tech.productivity },
    { subject: "Velocidad", value: tech.avgTime > 0 ? Math.min(100, Math.round(100 / tech.avgTime * 2)) : 0 },
    { subject: "Experiencia", value: Math.min(100, Math.round(tech.completedOrders / 3)) },
    { subject: "Disponib.", value: tech.status === "disponible" ? 100 : tech.status === "offline" ? 20 : 60 },
    { subject: "Calidad", value: Math.round(tech.productivity * 0.95) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
              {tech.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
                {tech.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={tech.status}
                  onChange={(e) => onUpdateStatus(tech.id, e.target.value as TechnicianStatus)}
                  className={`status-badge ${getStatusBg(tech.status)} outline-none cursor-pointer`}
                  style={{ 
                    border: "none", 
                    appearance: "none", 
                    paddingRight: "12px", // make room for dropdown arrow conceptually, though appearance:none removes it
                    textTransform: "capitalize"
                  }}
                >
                  <option value="disponible" className="bg-[#1b1e24] text-[#93c947]">Disponible</option>
                  <option value="en ruta" className="bg-[#1b1e24] text-[#72b01d]">En ruta</option>
                  <option value="trabajando" className="bg-[#1b1e24] text-[#f59e0b]">Trabajando</option>
                  <option value="offline" className="bg-[#1b1e24] text-[#64748b]">Offline</option>
                </select>
                <span className="text-xs" style={{ color: "#475569" }}>RUT: {tech.rut}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="px-6 pt-4" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={downloadInfo}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: "rgba(147,201,71,0.15)",
              color: "#93c947", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(147,201,71,0.3)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Download size={14} /> Descargar Ficha
          </button>
          
          <button
            onClick={onEdit}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: "rgba(114,176,29,0.12)",
              color: "#93c947", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(114,176,29,0.25)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Pencil size={14} /> Editar datos
          </button>

          {/* Eliminar con confirmación inline */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", background: "rgba(239,68,68,0.10)",
                color: "#f87171", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "1px solid rgba(239,68,68,0.22)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Trash2 size={14} /> Eliminar chofer
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 14px' }}>
              <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>¿Confirmar eliminación?</span>
              <button
                onClick={onDelete}
                style={{ padding: '4px 12px', background: '#ef4444', color: 'white', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left col */}
            <div className="space-y-4">
              {/* Contact */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Contacto</div>
                {[
                  { icon: Phone, value: tech.phone },
                  { icon: Mail, value: tech.email || "—" },
                  { icon: MapPin, value: tech.comuna || "—" },
                  { icon: MapPin, value: tech.direccion || "—" },
                ].map(({ icon: Icon, value }, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Icon size={14} style={{ color: "#72b01d", flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: "#e2e8f0" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>KPIs</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Coordinaciones", value: tech.completedOrders, color: "#72b01d", icon: CheckCircle2 },
                    { label: "Productividad", value: `${tech.productivity}%`, color: "#93c947", icon: TrendingUp },
                  ].map((k) => (
                    <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}20` }}>
                      <k.icon size={16} style={{ color: k.color, margin: "0 auto 4px" }} />
                      <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Productivity bar */}
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex justify-between text-xs mb-2" style={{ color: "#64748b" }}>
                    <span>Productividad</span><span>{tech.productivity}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${tech.productivity}%`, background: "linear-gradient(90deg, #72b01d, #93c947)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>

              
              {/* Documentos */}
              {(tech.documentos?.hojaConductor || tech.documentos?.licenciaFrontal || tech.documentos?.licenciaTrasera || tech.documentos?.carnetFrontal || tech.documentos?.carnetTrasera || tech.documentos?.certificadoAntecedentes) && (
                <div style={{ marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Documentos Adjuntos</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'hojaConductor', label: 'Hoja de Conductor', url: tech.documentos?.hojaConductor },
                      { key: 'licenciaFrontal', label: 'Licencia (Frontal)', url: tech.documentos?.licenciaFrontal },
                      { key: 'licenciaTrasera', label: 'Licencia (Trasera)', url: tech.documentos?.licenciaTrasera },
                      { key: 'carnetFrontal', label: 'Carnet (Frontal)', url: tech.documentos?.carnetFrontal },
                      { key: 'carnetTrasera', label: 'Carnet (Trasera)', url: tech.documentos?.carnetTrasera },
                      { key: 'certificadoAntecedentes', label: 'Antecedentes', url: tech.documentos?.certificadoAntecedentes }
                    ].filter(d => d.url).map((d) => (
                      <a 
                        key={d.key} 
                        href={d.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg" 
                        style={{ background: "rgba(114,176,29,0.1)", color: "#93c947", fontSize: 12, textDecoration: "none" }}
                      >
                        <Search size={14} /> Ver {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right col — Radar */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Perfil de Rendimiento</div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Radar name={tech.name} dataKey="value" stroke="#72b01d" fill="#72b01d" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tech Card ─────────────────────────────────────────────────────────────────
function TechCard({ tech, onClick, onDelete }: { tech: Technician; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <div className="glass-card-hover p-5 cursor-pointer" style={{ position: 'relative' }} onClick={onClick}>
      {/* Botón eliminar — aparece en hover */}
      <button
        onClick={onDelete}
        title="Eliminar chofer"
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#f87171',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
        onFocus={e => (e.currentTarget.style.opacity = '1')}
        onBlur={e => (e.currentTarget.style.opacity = '0')}
      >
        <Trash2 size={13} />
      </button>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
          {tech.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: "#f1f5f9", wordBreak: "break-word" }}>
            {tech.name}
          </div>
          <div className="text-xs" style={{ color: "#475569", wordBreak: "break-word" }}>
            {tech.patente ? `Patente: ${tech.patente}` : "Sin Patente"}
          </div>
        </div>
        <span className={`status-badge text-xs ${getStatusBg(tech.status)}`}>{tech.status}</span>
      </div>

      {/* Contact info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
          <a href={`tel:${tech.phone}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone}</a>
        </div>
        {tech.phone2 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <a href={`https://wa.me/${tech.phone2.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone2}</a>
          </div>
        )}
        {tech.phone2 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <a href={`https://wa.me/${tech.phone2.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.phone2}</a>
          </div>
        )}
        {tech.email && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <Mail size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <a href={`mailto:${tech.email}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-500 transition-colors">{tech.email}</a>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <MapPin size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
          <span className="truncate">{tech.comuna || "—"}</span>
        </div>
      </div>


      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: "Coord.", value: tech.completedOrders, color: "#72b01d" },
          { label: "Produc.", value: `${tech.productivity}%`, color: "#93c947" },
        ].map((k) => (
          <div key={k.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs" style={{ color: "#475569" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Productivity bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${tech.productivity}%`, background: STATUS_COLOR[tech.status] }} />
      </div>

      {/* Certs eliminadas */}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coordinacionesCount, setCoordinacionesCount] = useState<Record<string, number>>({});
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  useEffect(() => {
    async function fetchAll() {
      // Cargar técnicos desde Supabase
      const { data: techData } = await supabase
        .from('tecnicos')
        .select('*')
        .order('tech_number', { ascending: true });
      if (techData) {
        setTechnicians(techData.map(t => {
          const dt = t.data || {};
          return {
            id: t.id,
            name: dt.name || t.name || '',
            rut: dt.rut || t.rut || '',
            direccion: dt.direccion || '',
            comuna: dt.comuna || '',
            phone: dt.phone || t.phone || '',
            phone2: dt.phone2 || '',
            estadoCivil: dt.estadoCivil || '',
            estudios: dt.estudios || '',
            patente: dt.patente || '',
            modeloAuto: dt.modeloAuto || '',
            anioAuto: dt.anioAuto || '',
            email: dt.email || t.email || '',
            status: (dt.status || t.status || 'disponible') as TechnicianStatus,
            completedOrders: dt.completedOrders || t.completed_orders || 0,
            avgTime: dt.avgTime || t.avg_time || 0,
            productivity: dt.productivity || t.productivity || 0,
            documentos: dt.documentos || {},
            autoDocumentos: dt.autoDocumentos || {},
          };
        }));
      }
      setLoadingTechs(false);

      // Cargar conteo de coordinaciones (forzando evitar caché)
      const { data: coordData } = await supabase.from('servicios').select('asignado_a, data');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          // Extraemos todos los posibles nombres que referencien al chofer en este servicio
          let possibleNames: string[] = [];
          if (row.asignado_a) possibleNames.push(String(row.asignado_a));
          if (row.data) {
            if (row.data.asignadoA) possibleNames.push(String(row.data.asignadoA));
            if (row.data.nombreChofer) possibleNames.push(String(row.data.nombreChofer));
          }
          
          const namesStr = possibleNames.filter(Boolean).join(",");
          
          if (namesStr) {
            // Separamos por comas, guiones o saltos de línea
            const names = namesStr.split(/[,\-|\n]+/).map(normalizeString).filter(Boolean);
            const uniqueNames = Array.from(new Set(names));
            uniqueNames.forEach(name => { counts[name] = (counts[name] || 0) + 1; });
          }
        });
        setCoordinacionesCount(counts);
      }
    }
    fetchAll();
  }, []);

  const enrichedTechnicians = technicians.map(t => {
    const normName = normalizeString(t.name);
    return {
      ...t,
      completedOrders: coordinacionesCount[normName] || 0
    };
  });

  const filtered = enrichedTechnicians.filter((t) => {
    const matchSearch = search === "" || [t.name, t.email, t.comuna, t.phone, t.rut].some(
      (f) => (f || "").toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statsByStatus = STATUS_OPTS.map((s) => ({
    status: s,
    count: technicians.filter((t) => t.status === s).length,
  }));

  const handleAdd = (newTech: Technician) => {
    setTechnicians((prev) => [newTech, ...prev]);
  };

  const handleEdit = (updated: Technician) => {
    setTechnicians(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTech(updated);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tecnicos').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }
    setTechnicians(prev => prev.filter(t => t.id !== id));
    setSelectedTech(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: TechnicianStatus) => {
    // Actualizar estado en pantalla inmediatamente
    setTechnicians((prev) => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTech && selectedTech.id === id) {
      setSelectedTech({ ...selectedTech, status: newStatus });
    }
    // Guardar en Supabase para que persista
    await supabase.from('tecnicos').update({ status: newStatus }).eq('id', id);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Choferes</h2>
          <p className="section-subtitle">{technicians.length} choferes registrados en el sistema</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Agregar chofer
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsByStatus.map(({ status, count }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className="stat-card text-left"
            style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
              <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar por nombre, RUT, teléfono, correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ops-select text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} choferes</div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tech) => (
          <TechCard
            key={tech.id}
            tech={tech}
            onClick={() => setSelectedTech(tech)}
            onDelete={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${tech.name}? Esta acción no se puede deshacer.`)) handleDelete(tech.id); }}
          />
        ))}
      </div>

      {selectedTech && !editingTech && (
        <TechModal
          tech={selectedTech}
          onClose={() => setSelectedTech(null)}
          onUpdateStatus={handleUpdateStatus}
          onEdit={() => setEditingTech(selectedTech)}
          onDelete={() => handleDelete(selectedTech.id)}
        />
      )}
      {editingTech && (
        <EditTechModal
          tech={editingTech}
          onClose={() => setEditingTech(null)}
          onSave={(updated) => { handleEdit(updated); setEditingTech(null); }}
        />
      )}
      {showAddModal && (
        <AddTechModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
