"use client";

import { useState, useEffect } from "react";
import {
  Search, Phone, Mail, MapPin, Award, X, TrendingUp,
  CheckCircle2, Plus, Save, User, Pencil, Truck, Trash2, Download, FileText,
  CreditCard, FileCheck
} from "lucide-react";
import { getStatusBg } from "@/lib/utils";
import type { Technician, TechnicianStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(27,30,36,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "#f1f5f9",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#94a3b8",
  marginBottom: 5,
  letterSpacing: "0.02em",
  textTransform: "uppercase"
};

const errStyle: React.CSSProperties = { color: "#f87171", fontSize: 11, marginTop: 3 };

// ─── Add Technician Modal ───────────────────────────────────────────────────────
function AddTechModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (tech: Technician) => void;
}) {
  const [form, setForm] = useState({
    patente: "",
    name: "",
    rut: "",
    phone: "",
    phone2: "",
    email: "",
    gpsCccs: "SI",
    beetrack: "",
    induccion: "SI",
    carpeta: "SI",
    contrato: "FIRMADO",
    anexo: "",
    duenoFurgon: "",
    tipoVehiculo: "FURGON SIMPLE",
    facturacion: "COMODATO",
    nombreEmpresa: "",
    rutEmpresa: "",
    banco: "ESTADO",
    tipoCuenta: "CORRIENTE",
    numeroCuenta: "",
    comuna: "",
    direccion: "",
    licencia: "B",
    gps: "NO",
    seguro: "NO",
    status: "disponible" as TechnicianStatus,
  });

  const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\n\n[Aceptar] = Guardar y cerrar\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };

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
    if (!form.name.trim()) e.name = "CONDUCTOR es obligatorio";
    if (!form.rut.trim()) e.rut = "RUT es obligatorio";
    if (!form.phone.trim()) e.phone = "CELULAR es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveError("");
    setUploading(true);
    const newId = `tech-${Date.now()}`;
    
    try {
      const docsUrls: Record<string, string> = {};
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, newId, 'hojaConductor') || "";
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, newId, 'licenciaFrontal') || "";
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, newId, 'licenciaTrasera') || "";
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, newId, 'carnetFrontal') || "";
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, newId, 'carnetTrasera') || "";
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, newId, 'certificadoAntecedentes') || "";

      const newTech: Technician = {
        id: newId,
        patente: form.patente.trim().toUpperCase(),
        name: form.name.trim().toUpperCase(),
        rut: form.rut.trim(),
        phone: form.phone.trim(),
        phone2: form.phone2.trim(),
        whatsapp: form.phone2.trim(),
        email: form.email.trim().toLowerCase(),
        gpsCccs: form.gpsCccs.trim().toUpperCase(),
        beetrack: form.beetrack.trim(),
        induccion: form.induccion.trim().toUpperCase(),
        carpeta: form.carpeta.trim().toUpperCase(),
        contrato: form.contrato.trim().toUpperCase(),
        anexo: form.anexo.trim(),
        duenoFurgon: form.duenoFurgon.trim().toUpperCase(),
        tipoVehiculo: form.tipoVehiculo.trim().toUpperCase(),
        facturacion: form.facturacion.trim().toUpperCase(),
        nombreEmpresa: form.nombreEmpresa.trim().toUpperCase(),
        rutEmpresa: form.rutEmpresa.trim(),
        banco: form.banco.trim().toUpperCase(),
        tipoCuenta: form.tipoCuenta.trim().toUpperCase(),
        numeroCuenta: form.numeroCuenta.trim(),
        comuna: form.comuna.trim(),
        direccion: form.direccion.trim(),
        licencia: form.licencia.trim().toUpperCase(),
        gps: form.gps.trim().toUpperCase(),
        seguro: form.seguro.trim().toUpperCase(),
        
        status: form.status,
        tipoServicio: "Paquetería",
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
      setTimeout(() => { onAdd(newTech); onClose(); }, 600);
    } catch (e: any) {
      setSaveError("Error al subir archivos: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.1)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.15)", background: "rgba(255,255,255,0.01)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.15)" }}>
                <User size={20} style={{ color: "#93c947" }} />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-100">Agregar Chofer</div>
                <div className="text-xs text-slate-400">Completa los 25 campos de la flota Dasai</div>
              </div>
            </div>
            <button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }} className="hover:text-slate-200">
              <X size={22} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              
              {/* 1. PPU */}
              <div>
                <label style={labelStyle}>PPU</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="Ej: LHRK71" value={form.patente} onChange={set("patente")} />
              </div>

              {/* 2. CONDUCTOR */}
              <div className="sm:col-span-2">
                <label style={labelStyle}>CONDUCTOR <span style={{ color: "#72b01d" }}>*</span></label>
                <input style={inputStyle} placeholder="Nombre completo del conductor" value={form.name} onChange={set("name")} />
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>

              {/* 3. RUT */}
              <div>
                <label style={labelStyle}>RUT <span style={{ color: "#72b01d" }}>*</span></label>
                <input style={inputStyle} placeholder="Ej: 15793535-6" value={form.rut} onChange={set("rut")} />
                {errors.rut && <div style={errStyle}>{errors.rut}</div>}
              </div>

              {/* 4. CELULAR */}
              <div>
                <label style={labelStyle}>CELULAR <span style={{ color: "#72b01d" }}>*</span></label>
                <input style={inputStyle} placeholder="Ej: +569 79472968" value={form.phone} onChange={set("phone")} />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>

              {/* 5. WHATSAPP */}
              <div>
                <label style={labelStyle}>WHATSAPP</label>
                <input style={inputStyle} placeholder="Ej: +569 986878220" value={form.phone2} onChange={set("phone2")} />
              </div>

              {/* 6. MAIL CONDUCTOR */}
              <div className="md:col-span-2">
                <label style={labelStyle}>MAIL CONDUCTOR</label>
                <input style={inputStyle} type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={set("email")} />
              </div>

              {/* 7. GPS CCCS */}
              <div>
                <label style={labelStyle}>GPS CCCS</label>
                <select style={inputStyle} value={form.gpsCccs} onChange={set("gpsCccs")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 8. BEETRACK */}
              <div>
                <label style={labelStyle}>BEETRACK</label>
                <input style={inputStyle} placeholder="Ej: cc157935356" value={form.beetrack} onChange={set("beetrack")} />
              </div>

              {/* 9. INDUCCION */}
              <div>
                <label style={labelStyle}>INDUCCION</label>
                <select style={inputStyle} value={form.induccion} onChange={set("induccion")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 10. CARPETA */}
              <div>
                <label style={labelStyle}>CARPETA</label>
                <select style={inputStyle} value={form.carpeta} onChange={set("carpeta")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 11. CONTRATO */}
              <div>
                <label style={labelStyle}>CONTRATO</label>
                <select style={inputStyle} value={form.contrato} onChange={set("contrato")}>
                  <option value="FIRMADO">FIRMADO</option>
                  <option value="FALTA FIRMAR">FALTA FIRMAR</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 12. ANEXO */}
              <div>
                <label style={labelStyle}>ANEXO</label>
                <input style={inputStyle} placeholder="Anexo" value={form.anexo} onChange={set("anexo")} />
              </div>

              {/* 13. DUEÑO FURGON */}
              <div>
                <label style={labelStyle}>DUEÑO FURGON</label>
                <input style={inputStyle} placeholder="Dueño furgón" value={form.duenoFurgon} onChange={set("duenoFurgon")} />
              </div>

              {/* 14. TIPO VEHIC */}
              <div>
                <label style={labelStyle}>TIPO VEHIC</label>
                <select style={inputStyle} value={form.tipoVehiculo} onChange={set("tipoVehiculo")}>
                  <option value="FURGON SIMPLE">FURGON SIMPLE</option>
                  <option value="FURGON MEDIO">FURGON MEDIO</option>
                  <option value="FURGON GRANDE">FURGON GRANDE</option>
                  <option value="CAMION">CAMION</option>
                  <option value="AUTO">AUTO</option>
                </select>
              </div>

              {/* 15. FACTURACION */}
              <div>
                <label style={labelStyle}>FACTURACION</label>
                <select style={inputStyle} value={form.facturacion} onChange={set("facturacion")}>
                  <option value="COMODATO">COMODATO</option>
                  <option value="EMPRESA">EMPRESA</option>
                  <option value="HONORARIOS">HONORARIOS</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              {/* 16. NOMBRE EMPRESA */}
              <div className="md:col-span-2">
                <label style={labelStyle}>NOMBRE EMPRESA</label>
                <input style={inputStyle} placeholder="Ej: DASAI SPA" value={form.nombreEmpresa} onChange={set("nombreEmpresa")} />
              </div>

              {/* 17. RUT EMPRESA */}
              <div>
                <label style={labelStyle}>RUT EMPRESA</label>
                <input style={inputStyle} placeholder="Ej: 77361303-6" value={form.rutEmpresa} onChange={set("rutEmpresa")} />
              </div>

              {/* 18. BANCO */}
              <div>
                <label style={labelStyle}>BANCO</label>
                <select style={inputStyle} value={form.banco} onChange={set("banco")}>
                  <option value="SANTANDER">SANTANDER</option>
                  <option value="ESTADO">BANCO ESTADO</option>
                  <option value="BCI">BCI</option>
                  <option value="CHILE">BANCO DE CHILE</option>
                  <option value="SCOTIABANK">SCOTIABANK</option>
                  <option value="ITAU">ITAU</option>
                  <option value="FALABELLA">BANCO FALABELLA</option>
                  <option value="MERCADO PAGO">MERCADO PAGO</option>
                  <option value="SECURITY">BANCO SECURITY</option>
                  <option value="BICE">BICE</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              {/* 19. TIPO CUENTA */}
              <div>
                <label style={labelStyle}>TIPO CUENTA</label>
                <select style={inputStyle} value={form.tipoCuenta} onChange={set("tipoCuenta")}>
                  <option value="CORRIENTE">CORRIENTE</option>
                  <option value="VISTA">VISTA / CUENTA RUT</option>
                  <option value="CHEQUERA ELECTRONICA">CHEQUERA ELECTRÓNICA</option>
                  <option value="AHORRO">AHORRO</option>
                </select>
              </div>

              {/* 20. NUMERO CUENTA */}
              <div>
                <label style={labelStyle}>NUMERO CUENTA</label>
                <input style={inputStyle} placeholder="Ej: 77738150" value={form.numeroCuenta} onChange={set("numeroCuenta")} />
              </div>

              {/* 21. COMUNA */}
              <div>
                <label style={labelStyle}>COMUNA</label>
                <input style={inputStyle} placeholder="Ej: Maipú" value={form.comuna} onChange={set("comuna")} />
              </div>

              {/* 22. DIRECCIÓN */}
              <div className="md:col-span-2">
                <label style={labelStyle}>DIRECCIÓN</label>
                <input style={inputStyle} placeholder="Ej: PASAJE TAMARA 834" value={form.direccion} onChange={set("direccion")} />
              </div>

              {/* 23. LICENCIA */}
              <div>
                <label style={labelStyle}>LICENCIA</label>
                <input style={inputStyle} placeholder="Ej: B, B C, B A4 A2" value={form.licencia} onChange={set("licencia")} />
              </div>

              {/* 24. GPS */}
              <div>
                <label style={labelStyle}>GPS</label>
                <select style={inputStyle} value={form.gps} onChange={set("gps")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 25. SEGURO */}
              <div>
                <label style={labelStyle}>SEGURO</label>
                <select style={inputStyle} value={form.seguro} onChange={set("seguro")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

            </div>

            {/* Documentos Adjuntos Opcionales */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", marginTop: 16 }}>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={14} className="text-[#93c947]" /> Documentos Adjuntos (Opcional)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Vida Conductor' },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)' },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)' },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)' },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#94a3b8", marginBottom: 4 }}>{label}</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      style={{ fontSize: 11, color: "#e2e8f0", width: "100%" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDocs(d => ({ ...d, [key]: file }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Estado Inicial */}
            <div className="pt-2">
              <label style={labelStyle}>Estado inicial del chofer</label>
              <select
                style={{ ...inputStyle, cursor: "pointer", maxWidth: 260 }}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TechnicianStatus }))}
              >
                {STATUS_OPTS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {saveError && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={confirmClose} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={uploading}
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
                {uploading ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Chofer"}
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
    patente: tech.patente || "",
    name: tech.name || "",
    rut: tech.rut || "",
    phone: tech.phone || "",
    phone2: tech.phone2 || tech.whatsapp || "",
    email: tech.email || "",
    gpsCccs: tech.gpsCccs || "SI",
    beetrack: tech.beetrack || "",
    induccion: tech.induccion || "SI",
    carpeta: tech.carpeta || "SI",
    contrato: tech.contrato || "FIRMADO",
    anexo: tech.anexo || "",
    duenoFurgon: tech.duenoFurgon || "",
    tipoVehiculo: tech.tipoVehiculo || "FURGON SIMPLE",
    facturacion: tech.facturacion || "COMODATO",
    nombreEmpresa: tech.nombreEmpresa || "",
    rutEmpresa: tech.rutEmpresa || "",
    banco: tech.banco || "ESTADO",
    tipoCuenta: tech.tipoCuenta || "CORRIENTE",
    numeroCuenta: tech.numeroCuenta || "",
    comuna: tech.comuna || "",
    direccion: tech.direccion || "",
    licencia: tech.licencia || "B",
    gps: tech.gps || "NO",
    seguro: tech.seguro || "NO",
    status: tech.status,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const confirmClose = () => {
    if (window.confirm("¿Deseas guardar los cambios antes de salir?\n\n[Aceptar] = Guardar y cerrar\n[Cancelar] = Cerrar sin guardar")) {
      handleSave();
    } else {
      onClose();
    }
  };

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

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      const docsUrls = { ...(tech.documentos || {}) };
      if (docs.hojaConductor) docsUrls.hojaConductor = await uploadDocument(docs.hojaConductor, tech.id, 'hojaConductor') || "";
      if (docs.licenciaFrontal) docsUrls.licenciaFrontal = await uploadDocument(docs.licenciaFrontal, tech.id, 'licenciaFrontal') || "";
      if (docs.licenciaTrasera) docsUrls.licenciaTrasera = await uploadDocument(docs.licenciaTrasera, tech.id, 'licenciaTrasera') || "";
      if (docs.carnetFrontal) docsUrls.carnetFrontal = await uploadDocument(docs.carnetFrontal, tech.id, 'carnetFrontal') || "";
      if (docs.carnetTrasera) docsUrls.carnetTrasera = await uploadDocument(docs.carnetTrasera, tech.id, 'carnetTrasera') || "";
      if (docs.certificadoAntecedentes) docsUrls.certificadoAntecedentes = await uploadDocument(docs.certificadoAntecedentes, tech.id, 'certificadoAntecedentes') || "";

      const updated: Technician = {
        ...tech,
        ...form,
        name: form.name.trim().toUpperCase(),
        patente: form.patente.trim().toUpperCase(),
        phone2: form.phone2.trim(),
        whatsapp: form.phone2.trim(),
        documentos: docsUrls,
      };

      const { error } = await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => { onSave(updated); onClose(); }, 600);
    } catch (e: any) {
      setSaveError('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.15)", background: "rgba(255,255,255,0.01)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.15)" }}>
                <Pencil size={18} style={{ color: "#93c947" }} />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-100">Editar Chofer</div>
                <div className="text-xs text-slate-400">{tech.name} — {tech.rut}</div>
              </div>
            </div>
            <button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }} className="hover:text-slate-200"><X size={22} /></button>
          </div>

          <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              
              {/* 1. PPU */}
              <div>
                <label style={labelStyle}>PPU</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set("patente")} />
              </div>

              {/* 2. CONDUCTOR */}
              <div className="sm:col-span-2">
                <label style={labelStyle}>CONDUCTOR *</label>
                <input style={inputStyle} value={form.name} onChange={set("name")} />
              </div>

              {/* 3. RUT */}
              <div>
                <label style={labelStyle}>RUT</label>
                <input style={inputStyle} value={form.rut} onChange={set("rut")} />
              </div>

              {/* 4. CELULAR */}
              <div>
                <label style={labelStyle}>CELULAR</label>
                <input style={inputStyle} value={form.phone} onChange={set("phone")} />
              </div>

              {/* 5. WHATSAPP */}
              <div>
                <label style={labelStyle}>WHATSAPP</label>
                <input style={inputStyle} value={form.phone2} onChange={set("phone2")} />
              </div>

              {/* 6. MAIL CONDUCTOR */}
              <div className="md:col-span-2">
                <label style={labelStyle}>MAIL CONDUCTOR</label>
                <input style={inputStyle} type="email" value={form.email} onChange={set("email")} />
              </div>

              {/* 7. GPS CCCS */}
              <div>
                <label style={labelStyle}>GPS CCCS</label>
                <select style={inputStyle} value={form.gpsCccs} onChange={set("gpsCccs")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 8. BEETRACK */}
              <div>
                <label style={labelStyle}>BEETRACK</label>
                <input style={inputStyle} value={form.beetrack} onChange={set("beetrack")} />
              </div>

              {/* 9. INDUCCION */}
              <div>
                <label style={labelStyle}>INDUCCION</label>
                <select style={inputStyle} value={form.induccion} onChange={set("induccion")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 10. CARPETA */}
              <div>
                <label style={labelStyle}>CARPETA</label>
                <select style={inputStyle} value={form.carpeta} onChange={set("carpeta")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 11. CONTRATO */}
              <div>
                <label style={labelStyle}>CONTRATO</label>
                <select style={inputStyle} value={form.contrato} onChange={set("contrato")}>
                  <option value="FIRMADO">FIRMADO</option>
                  <option value="FALTA FIRMAR">FALTA FIRMAR</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 12. ANEXO */}
              <div>
                <label style={labelStyle}>ANEXO</label>
                <input style={inputStyle} value={form.anexo} onChange={set("anexo")} />
              </div>

              {/* 13. DUEÑO FURGON */}
              <div>
                <label style={labelStyle}>DUEÑO FURGON</label>
                <input style={inputStyle} value={form.duenoFurgon} onChange={set("duenoFurgon")} />
              </div>

              {/* 14. TIPO VEHIC */}
              <div>
                <label style={labelStyle}>TIPO VEHIC</label>
                <select style={inputStyle} value={form.tipoVehiculo} onChange={set("tipoVehiculo")}>
                  <option value="FURGON SIMPLE">FURGON SIMPLE</option>
                  <option value="FURGON MEDIO">FURGON MEDIO</option>
                  <option value="FURGON GRANDE">FURGON GRANDE</option>
                  <option value="CAMION">CAMION</option>
                  <option value="AUTO">AUTO</option>
                </select>
              </div>

              {/* 15. FACTURACION */}
              <div>
                <label style={labelStyle}>FACTURACION</label>
                <select style={inputStyle} value={form.facturacion} onChange={set("facturacion")}>
                  <option value="COMODATO">COMODATO</option>
                  <option value="EMPRESA">EMPRESA</option>
                  <option value="HONORARIOS">HONORARIOS</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              {/* 16. NOMBRE EMPRESA */}
              <div className="md:col-span-2">
                <label style={labelStyle}>NOMBRE EMPRESA</label>
                <input style={inputStyle} value={form.nombreEmpresa} onChange={set("nombreEmpresa")} />
              </div>

              {/* 17. RUT EMPRESA */}
              <div>
                <label style={labelStyle}>RUT EMPRESA</label>
                <input style={inputStyle} value={form.rutEmpresa} onChange={set("rutEmpresa")} />
              </div>

              {/* 18. BANCO */}
              <div>
                <label style={labelStyle}>BANCO</label>
                <select style={inputStyle} value={form.banco} onChange={set("banco")}>
                  <option value="SANTANDER">SANTANDER</option>
                  <option value="ESTADO">BANCO ESTADO</option>
                  <option value="BCI">BCI</option>
                  <option value="CHILE">BANCO DE CHILE</option>
                  <option value="SCOTIABANK">SCOTIABANK</option>
                  <option value="ITAU">ITAU</option>
                  <option value="FALABELLA">BANCO FALABELLA</option>
                  <option value="MERCADO PAGO">MERCADO PAGO</option>
                  <option value="SECURITY">BANCO SECURITY</option>
                  <option value="BICE">BICE</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              {/* 19. TIPO CUENTA */}
              <div>
                <label style={labelStyle}>TIPO CUENTA</label>
                <select style={inputStyle} value={form.tipoCuenta} onChange={set("tipoCuenta")}>
                  <option value="CORRIENTE">CORRIENTE</option>
                  <option value="VISTA">VISTA / CUENTA RUT</option>
                  <option value="CHEQUERA ELECTRONICA">CHEQUERA ELECTRÓNICA</option>
                  <option value="AHORRO">AHORRO</option>
                </select>
              </div>

              {/* 20. NUMERO CUENTA */}
              <div>
                <label style={labelStyle}>NUMERO CUENTA</label>
                <input style={inputStyle} value={form.numeroCuenta} onChange={set("numeroCuenta")} />
              </div>

              {/* 21. COMUNA */}
              <div>
                <label style={labelStyle}>COMUNA</label>
                <input style={inputStyle} value={form.comuna} onChange={set("comuna")} />
              </div>

              {/* 22. DIRECCIÓN */}
              <div className="md:col-span-2">
                <label style={labelStyle}>DIRECCIÓN</label>
                <input style={inputStyle} value={form.direccion} onChange={set("direccion")} />
              </div>

              {/* 23. LICENCIA */}
              <div>
                <label style={labelStyle}>LICENCIA</label>
                <input style={inputStyle} value={form.licencia} onChange={set("licencia")} />
              </div>

              {/* 24. GPS */}
              <div>
                <label style={labelStyle}>GPS</label>
                <select style={inputStyle} value={form.gps} onChange={set("gps")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {/* 25. SEGURO */}
              <div>
                <label style={labelStyle}>SEGURO</label>
                <select style={inputStyle} value={form.seguro} onChange={set("seguro")}>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>

            </div>

            {/* Documentos */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", marginTop: 16 }}>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={14} className="text-[#93c947]" /> Documentos Adjuntos
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Vida Conductor' },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)' },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)' },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)' },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)' },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#94a3b8", marginBottom: 4 }}>{label}</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      style={{ fontSize: 11, color: "#e2e8f0", width: "100%" }} 
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
            <div className="pt-2">
              <label style={labelStyle}>Estado</label>
              <select style={{ ...inputStyle, cursor: "pointer", maxWidth: 260 }} value={form.status} onChange={set("status")}>
                <option value="disponible">Disponible</option>
                <option value="en ruta">En ruta</option>
                <option value="trabajando">Libre</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {saveError && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={confirmClose} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px",
                  background: saved ? "#578814" : "linear-gradient(135deg,#72b01d,#578814)",
                  color: "white", borderRadius: 9, fontSize: 14, fontWeight: 700,
                  border: "none", cursor: "pointer", opacity: saving ? 0.7 : 1,
                  boxShadow: "0 4px 16px rgba(114,176,29,0.35)", fontFamily: "inherit",
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
    const text = `FICHA DE CHOFER / FLOTA - OPSDASAI\n` +
      `===============================================\n\n` +
      `PPU: ${tech.patente || "—"}\n` +
      `CONDUCTOR: ${tech.name}\n` +
      `RUT: ${tech.rut}\n` +
      `CELULAR: ${tech.phone}\n` +
      `WHATSAPP: ${tech.phone2 || tech.whatsapp || "—"}\n` +
      `MAIL CONDUCTOR: ${tech.email || "—"}\n` +
      `GPS CCCS: ${tech.gpsCccs || "—"}\n` +
      `BEETRACK: ${tech.beetrack || "—"}\n` +
      `INDUCCION: ${tech.induccion || "—"}\n` +
      `CARPETA: ${tech.carpeta || "—"}\n` +
      `CONTRATO: ${tech.contrato || "—"}\n` +
      `ANEXO: ${tech.anexo || "—"}\n` +
      `DUEÑO FURGON: ${tech.duenoFurgon || "—"}\n` +
      `TIPO VEHIC: ${tech.tipoVehiculo || "—"}\n` +
      `FACTURACION: ${tech.facturacion || "—"}\n` +
      `NOMBRE EMPRESA: ${tech.nombreEmpresa || "—"}\n` +
      `RUT EMPRESA: ${tech.rutEmpresa || "—"}\n` +
      `BANCO: ${tech.banco || "—"}\n` +
      `TIPO CUENTA: ${tech.tipoCuenta || "—"}\n` +
      `NUMERO CUENTA: ${tech.numeroCuenta || "—"}\n` +
      `COMUNA: ${tech.comuna || "—"}\n` +
      `DIRECCIÓN: ${tech.direccion || "—"}\n` +
      `LICENCIA: ${tech.licencia || "—"}\n` +
      `GPS: ${tech.gps || "—"}\n` +
      `SEGURO: ${tech.seguro || "—"}\n\n` +
      `ESTADO: ${tech.status.toUpperCase()}\n` +
      `COORDINACIONES: ${tech.completedOrders}\n`;
      
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
    { subject: "Productividad", value: tech.productivity || 80 },
    { subject: "Velocidad", value: tech.avgTime > 0 ? Math.min(100, Math.round(100 / tech.avgTime * 2)) : 75 },
    { subject: "Experiencia", value: Math.min(100, Math.max(30, Math.round(tech.completedOrders * 4))) },
    { subject: "Disponib.", value: tech.status === "disponible" ? 100 : tech.status === "offline" ? 20 : 60 },
    { subject: "Calidad", value: 85 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92vh", overflowY: "auto" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
              {tech.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{tech.name}</h3>
                {tech.patente && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#72b01d]/20 text-[#93c947] border border-[#72b01d]/30">
                    {tech.patente}
                  </span>
                )}
                {tech.tipoVehiculo && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                    {tech.tipoVehiculo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <select
                  value={tech.status}
                  onChange={(e) => onUpdateStatus(tech.id, e.target.value as TechnicianStatus)}
                  className={`status-badge ${getStatusBg(tech.status)} outline-none cursor-pointer`}
                  style={{ border: "none", appearance: "none", paddingRight: "12px", textTransform: "capitalize" }}
                >
                  <option value="disponible" className="bg-[#1b1e24] text-[#93c947]">Disponible</option>
                  <option value="en ruta" className="bg-[#1b1e24] text-[#72b01d]">En ruta</option>
                  <option value="trabajando" className="bg-[#1b1e24] text-[#f59e0b]">Trabajando</option>
                  <option value="offline" className="bg-[#1b1e24] text-[#64748b]">Offline</option>
                </select>
                <span className="text-xs" style={{ color: "#64748b" }}>RUT: <strong className="text-slate-300">{tech.rut}</strong></span>
                {tech.beetrack && <span className="text-xs" style={{ color: "#64748b" }}>Beetrack: <strong className="text-slate-300">{tech.beetrack}</strong></span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }} className="hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="px-6 pt-4 flex items-center gap-2.5 flex-wrap">
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

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3 text-[#93c947] flex items-center gap-1.5">
                  <User size={13} /> Datos del Conductor
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">PPU (Patente):</span>
                    <span className="text-brand-400 font-mono font-bold">{tech.patente || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">CONDUCTOR:</span>
                    <span className="text-slate-100 font-semibold">{tech.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">RUT:</span>
                    <span className="text-slate-200 font-mono">{tech.rut || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">CELULAR:</span>
                    <a href={`tel:${tech.phone}`} className="text-brand-400 font-semibold hover:underline">{tech.phone || "—"}</a>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">WHATSAPP:</span>
                    <a href={`https://wa.me/${(tech.phone2 || tech.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-brand-400 font-semibold hover:underline">
                      {tech.phone2 || tech.whatsapp || "—"}
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">MAIL CONDUCTOR:</span>
                    <span className="text-slate-200">{tech.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">COMUNA:</span>
                    <span className="text-slate-200 font-medium">{tech.comuna || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">DIRECCIÓN:</span>
                    <span className="text-slate-200 text-right">{tech.direccion || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">LICENCIA:</span>
                    <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold">{tech.licencia || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3 text-[#93c947] flex items-center gap-1.5">
                  <Truck size={13} /> Flota y Vehículo
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-slate-400 text-[11px]">TIPO VEHIC</div>
                    <div className="font-bold text-slate-100 text-sm mt-0.5">{tech.tipoVehiculo || "—"}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-slate-400 text-[11px]">DUEÑO FURGON</div>
                    <div className="text-slate-200 truncate mt-0.5">{tech.duenoFurgon || "DASAI"}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-slate-400 text-[11px]">BEETRACK</div>
                    <div className="text-slate-200 truncate font-mono mt-0.5">{tech.beetrack || "—"}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">GPS:</span>
                    <span className={`font-bold ${tech.gps === 'SI' ? 'text-[#93c947]' : 'text-slate-400'}`}>{tech.gps || "NO"}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">GPS CCCS:</span>
                    <span className={`font-bold ${tech.gpsCccs === 'SI' ? 'text-[#93c947]' : 'text-slate-400'}`}>{tech.gpsCccs || "NO"}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">SEGURO:</span>
                    <span className={`font-bold ${tech.seguro === 'SI' ? 'text-[#93c947]' : 'text-slate-400'}`}>{tech.seguro || "NO"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-4">
              
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3 text-[#93c947] flex items-center gap-1.5">
                  <CreditCard size={13} /> Contrato y Facturación
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">CONTRATO:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${tech.contrato === 'FIRMADO' ? 'bg-[#72b01d]/20 text-[#93c947]' : 'bg-amber-500/20 text-amber-400'}`}>
                      {tech.contrato || "PENDIENTE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">ANEXO:</span>
                    <span className="text-slate-200">{tech.anexo || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">INDUCCION:</span>
                    <span className="font-semibold text-slate-200">{tech.induccion || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">CARPETA:</span>
                    <span className="font-semibold text-slate-200">{tech.carpeta || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">FACTURACION:</span>
                    <span className="font-semibold text-slate-200">{tech.facturacion || "COMODATO"}</span>
                  </div>
                  {tech.nombreEmpresa && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">NOMBRE EMPRESA:</span>
                      <span className="text-slate-200 font-medium text-right">{tech.nombreEmpresa}</span>
                    </div>
                  )}
                  {tech.rutEmpresa && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">RUT EMPRESA:</span>
                      <span className="text-slate-200 font-mono">{tech.rutEmpresa}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">BANCO:</span>
                    <span className="text-slate-200 font-semibold">{tech.banco || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">TIPO CUENTA:</span>
                    <span className="text-slate-200">{tech.tipoCuenta || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">NUMERO CUENTA:</span>
                    <span className="text-slate-100 font-mono font-bold">{tech.numeroCuenta || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[#93c947] flex items-center gap-1.5">
                  <TrendingUp size={13} /> Coordinaciones y Rendimiento
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-xl text-center bg-[#72b01d]/10 border border-[#72b01d]/20">
                    <div className="text-xl font-bold text-[#72b01d]">{tech.completedOrders}</div>
                    <div className="text-[11px] text-[#94a3b8]">Coordinaciones</div>
                  </div>
                  <div className="p-2.5 rounded-xl text-center bg-[#93c947]/10 border border-[#93c947]/20">
                    <div className="text-xl font-bold text-[#93c947]">{tech.productivity || 100}%</div>
                    <div className="text-[11px] text-[#94a3b8]">Productividad</div>
                  </div>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Radar name={tech.name} dataKey="value" stroke="#72b01d" fill="#72b01d" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

          {/* Documentos Adjuntos */}
          {(tech.documentos?.hojaConductor || tech.documentos?.licenciaFrontal || tech.documentos?.licenciaTrasera || tech.documentos?.carnetFrontal || tech.documentos?.carnetTrasera || tech.documentos?.certificadoAntecedentes) && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 text-[#93c947] flex items-center gap-1.5">
                <FileText size={13} /> Documentos Adjuntos
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'hojaConductor', label: 'Hoja de Conductor', url: tech.documentos?.hojaConductor },
                  { key: 'licenciaFrontal', label: 'Licencia (Frontal)', url: tech.documentos?.licenciaFrontal },
                  { key: 'licenciaTrasera', label: 'Licencia (Trasera)', url: tech.documentos?.licenciaTrasera },
                  { key: 'carnetFrontal', label: 'Carnet (Frontal)', url: tech.documentos?.carnetFrontal },
                  { key: 'carnetTrasera', label: 'Carnet (Trasera)', url: tech.documentos?.carnetTrasera },
                  { key: 'certificadoAntecedentes', label: 'Cert. de Antecedentes', url: tech.documentos?.certificadoAntecedentes }
                ].filter(d => d.url).map((d) => (
                  <a 
                    key={d.key} 
                    href={d.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg transition-colors hover:bg-[#72b01d]/20" 
                    style={{ background: "rgba(114,176,29,0.1)", color: "#93c947", fontSize: 12, textDecoration: "none" }}
                  >
                    <Search size={14} /> <span className="truncate">{d.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Tech Card ─────────────────────────────────────────────────────────────────
function TechCard({ tech, onClick, onDelete }: { tech: Technician; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <div className="glass-card-hover p-4 cursor-pointer relative group flex flex-col justify-between" onClick={onClick}>
      {/* Botón eliminar */}
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

      {/* Header card */}
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
            {tech.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="font-bold text-sm text-slate-100 truncate leading-snug" title={tech.name}>
              {tech.name}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              RUT: {tech.rut}
            </div>
          </div>
        </div>

        {/* Patente & Vehiculo badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {tech.patente ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#72b01d]/15 text-[#93c947] border border-[#72b01d]/30">
              {tech.patente}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] text-slate-500 bg-white/5">Sin PPU</span>
          )}
          {tech.tipoVehiculo && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
              {tech.tipoVehiculo}
            </span>
          )}
          <span className={`status-badge text-[10px] ml-auto ${getStatusBg(tech.status)}`}>
            {tech.status}
          </span>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 mb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <a href={`tel:${tech.phone}`} onClick={e => e.stopPropagation()} className="truncate hover:text-brand-400 transition-colors">
              {tech.phone || "—"}
            </a>
          </div>
          {(tech.phone2 || tech.whatsapp) && (
            <div className="flex items-center gap-2">
              <Phone size={11} style={{ color: "#93c947", flexShrink: 0 }} />
              <a href={`https://wa.me/${(tech.phone2 || tech.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="truncate hover:text-brand-400 transition-colors">
                {tech.phone2 || tech.whatsapp} (WA)
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <span className="truncate">{tech.comuna || tech.direccion || "—"}</span>
          </div>
        </div>
      </div>

      {/* Footer / KPIs */}
      <div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mb-2">
          <div className="text-center p-1.5 rounded-lg bg-white/[0.02]">
            <div className="text-xs font-bold text-[#72b01d]">{tech.completedOrders}</div>
            <div className="text-[10px] text-slate-500">Coord.</div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-white/[0.02]">
            <div className="text-xs font-bold text-[#93c947]">{tech.banco ? tech.banco.slice(0, 10) : "—"}</div>
            <div className="text-[10px] text-slate-500">Banco</div>
          </div>
        </div>

        {/* Productivity bar */}
        <div className="h-1 rounded-full bg-white/5">
          <div className="h-1 rounded-full bg-gradient-to-r from-[#72b01d] to-[#93c947]" style={{ width: `${Math.min(100, Math.max(15, tech.productivity || 80))}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehiculoFilter, setVehiculoFilter] = useState<string>("all");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coordinacionesCount, setCoordinacionesCount] = useState<Record<string, number>>({});
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  useEffect(() => {
    async function fetchAll() {
      const { data: techData } = await supabase
        .from('tecnicos')
        .select('*')
        .order('tech_number', { ascending: true });

      if (techData) {
        setTechnicians(techData.map(t => {
          const dt = t.data || {};
          return {
            id: t.id,
            techNumber: t.tech_number,
            name: dt.name || t.name || '',
            rut: dt.rut || t.rut || '',
            direccion: dt.direccion || '',
            comuna: dt.comuna || '',
            phone: dt.phone || t.phone || '',
            phone2: dt.phone2 || dt.whatsapp || '',
            whatsapp: dt.whatsapp || dt.phone2 || '',
            email: dt.email || t.email || '',
            licencia: dt.licencia || '',
            
            patente: dt.patente || '',
            tipoVehiculo: dt.tipoVehiculo || '',
            duenoFurgon: dt.duenoFurgon || '',
            gps: dt.gps || '',
            gpsCccs: dt.gpsCccs || '',
            beetrack: dt.beetrack || '',
            seguro: dt.seguro || '',
            
            induccion: dt.induccion || '',
            carpeta: dt.carpeta || '',
            contrato: dt.contrato || '',
            anexo: dt.anexo || '',
            tipoServicio: dt.tipoServicio || 'Paquetería',
            nLocal: dt.nLocal || '',
            
            facturacion: dt.facturacion || '',
            nombreEmpresa: dt.nombreEmpresa || '',
            rutEmpresa: dt.rutEmpresa || '',
            banco: dt.banco || '',
            tipoCuenta: dt.tipoCuenta || '',
            numeroCuenta: dt.numeroCuenta || '',
            
            estadoCivil: dt.estadoCivil || '',
            estudios: dt.estudios || '',
            modeloAuto: dt.modeloAuto || '',
            anioAuto: dt.anioAuto || '',
            
            status: (dt.status || t.status || 'disponible') as TechnicianStatus,
            completedOrders: dt.completedOrders || t.completed_orders || 0,
            avgTime: dt.avgTime || t.avg_time || 0,
            productivity: dt.productivity || t.productivity || 0,
            rating: dt.rating || 0,
            documentos: dt.documentos || {},
            autoDocumentos: dt.autoDocumentos || {},
          };
        }));
      }
      setLoadingTechs(false);

      const { data: coordData } = await supabase.from('servicios').select('asignado_a, data');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          let possibleNames: string[] = [];
          if (row.asignado_a) possibleNames.push(String(row.asignado_a));
          if (row.data) {
            if (row.data.asignadoA) possibleNames.push(String(row.data.asignadoA));
            if (row.data.nombreChofer) possibleNames.push(String(row.data.nombreChofer));
          }
          
          const namesStr = possibleNames.filter(Boolean).join(",");
          if (namesStr) {
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
      completedOrders: coordinacionesCount[normName] || t.completedOrders || 0
    };
  });

  const filtered = enrichedTechnicians.filter((t) => {
    const matchSearch = search === "" || [
      t.name, t.email, t.comuna, t.phone, t.phone2, t.rut, t.patente, t.tipoVehiculo, t.beetrack, t.banco, t.nombreEmpresa
    ].some((f) => (f || "").toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchVehiculo = vehiculoFilter === "all" || (t.tipoVehiculo || "").toUpperCase().includes(vehiculoFilter.toUpperCase());
    
    return matchSearch && matchStatus && matchVehiculo;
  });

  const getStatsForTipo = (tipo: string) => {
    return STATUS_OPTS.map((s) => ({
      status: s,
      count: technicians.filter((t) => t.status === s && (t.tipoServicio?.toLowerCase() === tipo.toLowerCase() || t.tipoServicio?.toLowerCase() === 'ambas')).length,
    }));
  };
  const statsSupermercado = getStatsForTipo('Supermercado');
  const statsPaqueteria = getStatsForTipo('Paquetería');

  const exportToExcel = () => {
    if (technicians.length === 0) return;

    const data = filtered.map(t => ({
      "PPU": t.patente || "",
      "CONDUCTOR": t.name || "",
      "RUT": t.rut || "",
      "CELULAR": t.phone || "",
      "WHATSAPP": t.phone2 || t.whatsapp || "",
      "MAIL CONDUCTOR": t.email || "",
      "GPS CCCS": t.gpsCccs || "",
      "BEETRACK": t.beetrack || "",
      "INDUCCION": t.induccion || "",
      "CARPETA": t.carpeta || "",
      "CONTRATO": t.contrato || "",
      "ANEXO": t.anexo || "",
      "DUEÑO FURGON": t.duenoFurgon || "",
      "TIPO VEHIC": t.tipoVehiculo || "",
      "FACTURACION": t.facturacion || "",
      "NOMBRE EMPRESA": t.nombreEmpresa || "",
      "RUT EMPRESA": t.rutEmpresa || "",
      "BANCO": t.banco || "",
      "TIPO CUENTA": t.tipoCuenta || "",
      "NUMERO CUENTA": t.numeroCuenta || "",
      "COMUNA": t.comuna || "",
      "DIRECCIÓN": t.direccion || "",
      "LICENCIA": t.licencia || "",
      "GPS": t.gps || "",
      "SEGURO": t.seguro || "",
      "ESTADO": t.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flota Choferes");

    XLSX.writeFile(workbook, `Flota_Choferes_Dasai_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

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
    setTechnicians((prev) => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTech && selectedTech.id === id) {
      setSelectedTech({ ...selectedTech, status: newStatus });
    }
    await supabase.from('tecnicos').update({ status: newStatus }).eq('id', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Choferes y Flota</h2>
          <p className="section-subtitle">{technicians.length} choferes registrados en la flota Dasai</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={exportToExcel}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 8, color: "#cbd5e1" }}
          >
            <Download size={16} /> Exportar Flota
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Agregar Chofer
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#94a3b8" }}>Paquetería</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsPaqueteria.map(({ status, count }) => (
              <button key={`paq-${status}`} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status === 'trabajando' ? 'libre' : status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#94a3b8" }}>Supermercado</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsSupermercado.map(({ status, count }) => (
              <button key={`sup-${status}`} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status === 'trabajando' ? 'libre' : status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input 
            className="ops-input pl-9" 
            placeholder="Buscar por conductor, RUT, PPU patente, comuna, banco, beetrack…" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        
        <select className="ops-select text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        <select className="ops-select text-sm" value={vehiculoFilter} onChange={(e) => setVehiculoFilter(e.target.value)}>
          <option value="all">Todos los vehículos</option>
          <option value="FURGON SIMPLE">Furgón Simple</option>
          <option value="FURGON MEDIO">Furgón Medio</option>
          <option value="FURGON GRANDE">Furgón Grande</option>
          <option value="CAMION">Camión</option>
        </select>

        <div className="text-xs font-semibold" style={{ color: "#93c947" }}>{filtered.length} choferes</div>
      </div>

      {/* Cards grid */}
      {loadingTechs ? (
        <div className="text-center py-12 text-slate-400">Cargando flota de choferes...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-12 text-slate-400">
          No se encontraron choferes que coincidan con los filtros.
        </div>
      ) : (
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
      )}

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
