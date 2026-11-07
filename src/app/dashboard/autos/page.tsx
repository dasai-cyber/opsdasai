"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Technician } from "@/types";
import { formatDate } from "@/lib/utils";
import { 
  Car, FileText, Upload, X, CheckCircle2, AlertCircle, FileBox, Star,
  AlertTriangle, Clock, Calendar, ShieldAlert, Check, ExternalLink, Filter
} from "lucide-react";

// ─── Document Configuration ──────────────────────────────────────────────────
export type DocTypeKey = 'revisionTecnica' | 'gases' | 'permisoCirculacion' | 'soap' | 'padron';

export interface DocDef {
  key: DocTypeKey;
  label: string;
  shortLabel: string;
  hasExpiry: boolean;
}

export const DOCS_CONFIG: DocDef[] = [
  { key: 'revisionTecnica', label: 'Revisión Técnica', shortLabel: 'Rev. Técnica', hasExpiry: true },
  { key: 'gases', label: 'Gases', shortLabel: 'Gases', hasExpiry: true },
  { key: 'permisoCirculacion', label: 'Permiso de Circulación', shortLabel: 'Permiso Circ.', hasExpiry: true },
  { key: 'soap', label: 'SOAP (Seguro Obligatorio)', shortLabel: 'SOAP', hasExpiry: true },
  { key: 'padron', label: 'Padrón del Vehículo', shortLabel: 'Padrón', hasExpiry: false },
];

export interface DocExpiryStatus {
  status: 'vencido' | 'alerta_5_dias' | 'proximo' | 'al_dia' | 'sin_fecha';
  daysRemaining: number | null;
  label: string;
  badgeClass: string;
  formattedDate: string;
}

export function getDocumentExpiryStatus(dateStr: string | null | undefined): DocExpiryStatus {
  if (!dateStr || !dateStr.trim()) {
    return {
      status: 'sin_fecha',
      daysRemaining: null,
      label: 'Sin fecha',
      badgeClass: 'text-slate-400 bg-white/5 border-white/10',
      formattedDate: '',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiry: Date | null = null;
  const trimmed = dateStr.trim();
  if (trimmed.includes('-')) {
    const [y, m, d] = trimmed.split('-').map(Number);
    expiry = new Date(y, m - 1, d);
  } else if (trimmed.includes('/')) {
    const [d, m, y] = trimmed.split('/').map(Number);
    expiry = new Date(y, m - 1, d);
  } else {
    expiry = new Date(trimmed);
  }

  if (!expiry || isNaN(expiry.getTime())) {
    return {
      status: 'sin_fecha',
      daysRemaining: null,
      label: 'Fecha inválida',
      badgeClass: 'text-slate-400 bg-white/5 border-white/10',
      formattedDate: '',
    };
  }

  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = formatDate(expiry);

  if (diffDays < 0) {
    const pastDays = Math.abs(diffDays);
    return {
      status: 'vencido',
      daysRemaining: diffDays,
      label: pastDays === 1 ? '¡Vencido ayer!' : `¡Vencido hace ${pastDays}d!`,
      badgeClass: 'text-red-400 bg-red-500/20 border-red-500/40 font-bold',
      formattedDate,
    };
  }

  if (diffDays <= 5) {
    let alertText = '';
    if (diffDays === 0) alertText = '¡Vence HOY!';
    else if (diffDays === 1) alertText = '¡Vence MAÑANA!';
    else alertText = `¡Vence en ${diffDays} días!`;

    return {
      status: 'alerta_5_dias',
      daysRemaining: diffDays,
      label: alertText,
      badgeClass: 'text-amber-300 bg-amber-500/25 border-amber-500/50 font-bold animate-pulse',
      formattedDate,
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'proximo',
      daysRemaining: diffDays,
      label: `Vence en ${diffDays}d`,
      badgeClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 font-medium',
      formattedDate,
    };
  }

  return {
    status: 'al_dia',
    daysRemaining: diffDays,
    label: 'Al día',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-medium',
    formattedDate,
  };
}

export function getVehicleAlertSummary(tech: Technician) {
  const fechas = tech.autoFechasVencimiento || {};
  let vencidos = 0;
  let alerta5Dias = 0;
  let proximos = 0;
  let alDia = 0;
  let minDays: number | null = null;
  let mostCriticalDoc = "";

  DOCS_CONFIG.forEach(d => {
    if (!d.hasExpiry) return;
    const dateVal = (fechas as any)[d.key];
    if (!dateVal) return;
    const st = getDocumentExpiryStatus(dateVal);
    if (st.status === 'vencido') {
      vencidos++;
      if (minDays === null || st.daysRemaining! < minDays) {
        minDays = st.daysRemaining;
        mostCriticalDoc = d.shortLabel;
      }
    } else if (st.status === 'alerta_5_dias') {
      alerta5Dias++;
      if (minDays === null || st.daysRemaining! < minDays) {
        minDays = st.daysRemaining;
        mostCriticalDoc = d.shortLabel;
      }
    } else if (st.status === 'proximo') {
      proximos++;
    } else if (st.status === 'al_dia') {
      alDia++;
    }
  });

  return { vencidos, alerta5Dias, proximos, alDia, minDays, mostCriticalDoc };
}

const uploadDocument = async (file: File, id: string, docType: string) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${id}/${docType}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('choferes_docs').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('choferes_docs').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Edit Auto Modal ────────────────────────────────────────────────────────
function EditAutoModal({
  tech, onClose, onSave,
}: {
  tech: Technician;
  onClose: () => void;
  onSave: (updated: Technician) => void;
}) {
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

  const [docs, setDocs] = useState<{ [K in DocTypeKey]?: File | null }>({});
  const [fechas, setFechas] = useState<{ [K in DocTypeKey]?: string }>({
    revisionTecnica: tech.autoFechasVencimiento?.revisionTecnica || "",
    gases: tech.autoFechasVencimiento?.gases || "",
    permisoCirculacion: tech.autoFechasVencimiento?.permisoCirculacion || "",
    soap: tech.autoFechasVencimiento?.soap || "",
    padron: tech.autoFechasVencimiento?.padron || "",
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const autoDocsUrls = { ...(tech.autoDocumentos || {}) };

      for (const item of DOCS_CONFIG) {
        const file = docs[item.key];
        if (file) {
          autoDocsUrls[item.key] = await uploadDocument(file, tech.id, item.key);
        }
      }

      const updated: Technician = {
        ...tech,
        autoDocumentos: autoDocsUrls,
        autoFechasVencimiento: fechas,
      };

      const { error } = await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => { onSave(updated); onClose(); }, 700);
    } catch (e: any) {
      setSaveError('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/10" style={{ background: "linear-gradient(135deg, #ff5aac, #5600d4)", color: "white" }}>
                <Car size={22} />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-100 flex items-center gap-2">
                  <span>Documentación del Auto</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/10 text-brand-400 border border-white/10">
                    {tech.patente}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Chofer: <strong className="text-slate-200">{tech.name}</strong> • {tech.modeloAuto || "Vehículo"} {tech.anioAuto || ""}
                </div>
              </div>
            </div>
            <button onClick={confirmClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          {/* Subtitle / Tip */}
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 text-amber-400" />
            <span>
              Ingresa la <strong>fecha de vencimiento</strong> de cada papel. El sistema te alertará automáticamente con un aviso cuando falten <strong>5 días o menos</strong> para que venza.
            </span>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
            {DOCS_CONFIG.map((doc) => {
              const currentUrl = (tech.autoDocumentos as any)?.[doc.key];
              const dateVal = fechas[doc.key] || "";
              const expirySt = doc.hasExpiry && dateVal ? getDocumentExpiryStatus(dateVal) : null;

              return (
                <div 
                  key={doc.key} 
                  className={`p-4 rounded-xl border transition-all ${
                    expirySt?.status === 'vencido' 
                      ? 'border-red-500/40 bg-red-500/[0.04]' 
                      : expirySt?.status === 'alerta_5_dias'
                      ? 'border-amber-500/40 bg-amber-500/[0.05]'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <FileBox size={16} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-200">{doc.label}</span>
                    </div>
                    {expirySt && (
                      <span className={`px-2 py-0.5 rounded text-xs border ${expirySt.badgeClass}`}>
                        {expirySt.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {/* Fecha de vencimiento */}
                    {doc.hasExpiry ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                          <span>Fecha de Vencimiento</span>
                          {dateVal && (
                            <span className="text-slate-300 font-mono font-bold">
                              ({formatDate(dateVal)})
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={dateVal}
                          onChange={(e) => setFechas({ ...fechas, [doc.key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/80 text-sm text-slate-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-slate-400 italic">
                        El padrón no requiere fecha de vencimiento.
                      </div>
                    )}

                    {/* Archivo */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                        <span>Archivo adjunto</span>
                        {currentUrl && (
                          <a 
                            href={currentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink size={11} /> Ver actual
                          </a>
                        )}
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-slate-200 hover:file:bg-white/20 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocs(d => ({ ...d, [doc.key]: e.target.files![0] }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {saveError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{saveError}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end gap-3 bg-slate-900/60 border-t border-white/5">
            <button 
              onClick={confirmClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving || saved}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
              style={{
                background: saved ? "#10b981" : "linear-gradient(135deg, #ff5aac, #5600d4)",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : saved ? "¡Guardado con éxito!" : "Guardar Documentos y Fechas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auto Card Component ────────────────────────────────────────────────────
function AutoCard({ tech, onClick }: { tech: Technician; onClick: () => void }) {
  const [rating, setRating] = useState(tech.rating || 0);

  const handleRate = async (e: React.MouseEvent, val: number) => {
    e.stopPropagation();
    setRating(val);
    const updated = { ...tech, rating: val };
    await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
  };

  const summary = useMemo(() => getVehicleAlertSummary(tech), [tech]);

  return (
    <div 
      className={`glass-card-hover p-5 cursor-pointer flex flex-col h-full relative transition-all rounded-2xl border ${
        summary.vencidos > 0 
          ? 'border-red-500/40 bg-gradient-to-b from-red-500/[0.06] to-slate-900/90' 
          : summary.alerta5Dias > 0 
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] to-slate-900/90'
          : 'border-white/5'
      }`} 
      onClick={onClick}
    >
      {/* Banner de alerta superior */}
      {summary.vencidos > 0 ? (
        <div className="mb-3 -mt-2 -mx-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-400" />
            <span>{summary.vencidos} {summary.vencidos === 1 ? 'documento vencido' : 'documentos vencidos'}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-red-500/30 px-1.5 py-0.5 rounded">¡Atención!</span>
        </div>
      ) : summary.alerta5Dias > 0 ? (
        <div className="mb-3 -mt-2 -mx-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" />
            <span>
              {summary.mostCriticalDoc} {summary.minDays === 0 ? 'vence HOY' : summary.minDays === 1 ? 'vence MAÑANA' : `vence en ${summary.minDays} días`}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-amber-500/30 px-1.5 py-0.5 rounded">≤ 5 días</span>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-13 h-13 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md shadow-pink-500/10" 
          style={{ background: "linear-gradient(135deg, #ff5aac, #5600d4)", color: "white", width: 48, height: 48 }}
        >
          <Car size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base flex items-start justify-between text-slate-100">
            <div className="truncate">
              <span className="font-mono text-lg tracking-wider text-brand-400 font-extrabold">{tech.patente}</span>
              <span className="text-xs font-normal text-slate-400 ml-2">
                {tech.modeloAuto} {tech.anioAuto}
              </span>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  fill={star <= rating ? "#fbbf24" : "transparent"}
                  color={star <= rating ? "#fbbf24" : "#475569"}
                  onClick={(e) => handleRate(e, star)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  className="hover:scale-110"
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            Chofer: <strong className="text-slate-200">{tech.name}</strong>
          </div>
        </div>
      </div>

      {/* Documentos y Vencimientos */}
      <div className="mt-auto space-y-2 pt-3 border-t border-white/5">
        {DOCS_CONFIG.map((doc) => {
          const currentUrl = (tech.autoDocumentos as any)?.[doc.key];
          const dateVal = (tech.autoFechasVencimiento as any)?.[doc.key];
          const expirySt = doc.hasExpiry ? getDocumentExpiryStatus(dateVal) : null;

          return (
            <div key={doc.key} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
              <div className="flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[150px]">
                <FileBox size={13} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-300 truncate" title={doc.label}>{doc.shortLabel}</span>
                {currentUrl && (
                  <a 
                    href={currentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand-400 hover:text-brand-300 flex-shrink-0"
                    title="Ver archivo"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {doc.hasExpiry ? (
                  dateVal ? (
                    <div className="flex items-center gap-1 text-right">
                      <span className="text-[11px] font-mono text-slate-400">
                        {expirySt?.formattedDate}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${expirySt?.badgeClass}`}>
                        {expirySt?.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {currentUrl ? "Subido (Sin fecha)" : "Falta"}
                    </span>
                  )
                ) : (
                  currentUrl ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Subido
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
                      <AlertCircle size={10} /> Falta
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AutosPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'todos' | 'alerta_5_dias' | 'vencidos' | 'al_dia'>('todos');

  useEffect(() => {
    async function fetchAll() {
      const { data: techData } = await supabase
        .from('tecnicos')
        .select('*')
        .order('tech_number', { ascending: true });
        
      if (techData) {
        const mapped: Technician[] = techData.map(t => {
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
            tipoServicio: dt.tipoServicio || '',
            nLocal: dt.nLocal || '',
            email: dt.email || t.email || '',
            status: (dt.status || t.status || 'disponible') as any,
            completedOrders: dt.completedOrders || t.completed_orders || 0,
            avgTime: dt.avgTime || t.avg_time || 0,
            productivity: dt.productivity || t.productivity || 0,
            rating: dt.rating || 0,
            documentos: dt.documentos || {},
            autoDocumentos: dt.autoDocumentos || {},
            autoFechasVencimiento: dt.autoFechasVencimiento || {},
          };
        });
        // Filtrar SOLO los que tienen patente
        setTechnicians(mapped.filter(t => t.patente && t.patente.trim().length > 0));
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleSaveTech = (updated: Technician) => {
    setTechnicians(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalAutos = technicians.length;
    let conAlerta5Dias = 0;
    let conVencidos = 0;
    let alDiaTotal = 0;

    technicians.forEach(t => {
      const summary = getVehicleAlertSummary(t);
      if (summary.vencidos > 0) conVencidos++;
      if (summary.alerta5Dias > 0) conAlerta5Dias++;
      if (summary.vencidos === 0 && summary.alerta5Dias === 0) alDiaTotal++;
    });

    return { totalAutos, conAlerta5Dias, conVencidos, alDiaTotal };
  }, [technicians]);

  const filteredAutos = useMemo(() => {
    return technicians.filter(t => {
      const matchesSearch = 
        (t.patente && t.patente.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'alerta_5_dias') {
        const summary = getVehicleAlertSummary(t);
        return summary.alerta5Dias > 0;
      }
      if (filterType === 'vencidos') {
        const summary = getVehicleAlertSummary(t);
        return summary.vencidos > 0;
      }
      if (filterType === 'al_dia') {
        const summary = getVehicleAlertSummary(t);
        return summary.vencidos === 0 && summary.alerta5Dias === 0;
      }
      return true;
    });
  }, [technicians, searchQuery, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span>Documentación de Autos</span>
            {metrics.conAlerta5Dias > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                ⚠️ {metrics.conAlerta5Dias} por vencer (≤ 5 días)
              </span>
            )}
          </h1>
          <p className="text-sm mt-1 text-slate-400">
            Control de vigencia, fechas de vencimiento y archivos de los vehículos registrados.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por patente o chofer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm outline-none rounded-lg border border-white/10 bg-white/[0.03] text-slate-200 focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Alerta Destacada si hay papeles por vencer en 5 días o vencidos */}
      {(metrics.conAlerta5Dias > 0 || metrics.conVencidos > 0) && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-red-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-300">
              <AlertTriangle size={20} className="animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-200">
                Alerta de Vencimiento de Documentación
              </div>
              <div className="text-xs text-amber-300/80 mt-0.5">
                {metrics.conAlerta5Dias > 0 && (
                  <span>
                    Hay <strong>{metrics.conAlerta5Dias}</strong> vehículo(s) con papeles que vencen en <strong>5 días o menos</strong>.{" "}
                  </span>
                )}
                {metrics.conVencidos > 0 && (
                  <span>
                    Hay <strong>{metrics.conVencidos}</strong> vehículo(s) con papeles <strong>vencidos</strong>.
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            {metrics.conAlerta5Dias > 0 && (
              <button
                onClick={() => setFilterType(filterType === 'alerta_5_dias' ? 'todos' : 'alerta_5_dias')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow"
              >
                {filterType === 'alerta_5_dias' ? 'Mostrar Todos' : 'Ver Por Vencer (≤ 5 días)'}
              </button>
            )}
            {metrics.conVencidos > 0 && (
              <button
                onClick={() => setFilterType(filterType === 'vencidos' ? 'todos' : 'vencidos')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/30 text-red-300 border border-red-500/40 hover:bg-red-500/40 transition-colors"
              >
                {filterType === 'vencidos' ? 'Mostrar Todos' : 'Ver Vencidos'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen / Filtros Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterType('todos')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterType === 'todos' 
              ? 'border-brand-500/50 bg-brand-500/10 shadow-lg shadow-pink-500/5' 
              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          <div className="text-xs text-slate-400 font-semibold">Total Vehículos</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{metrics.totalAutos}</div>
          <div className="text-[10px] text-slate-500 mt-1">Con patente registrada</div>
        </button>

        <button
          onClick={() => setFilterType('alerta_5_dias')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterType === 'alerta_5_dias' 
              ? 'border-amber-500/60 bg-amber-500/20 shadow-lg shadow-amber-500/10' 
              : 'border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
          }`}
        >
          <div className="text-xs text-amber-300 font-bold flex items-center justify-between">
            <span>Por Vencer</span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded">≤ 5 días</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{metrics.conAlerta5Dias}</div>
          <div className="text-[10px] text-amber-400/70 mt-1">Requieren renovación pronto</div>
        </button>

        <button
          onClick={() => setFilterType('vencidos')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterType === 'vencidos' 
              ? 'border-red-500/60 bg-red-500/20 shadow-lg shadow-red-500/10' 
              : 'border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.08]'
          }`}
        >
          <div className="text-xs text-red-400 font-bold flex items-center justify-between">
            <span>Vencidos</span>
            <span className="text-[10px] bg-red-500/20 px-1.5 py-0.2 rounded">Urgente</span>
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">{metrics.conVencidos}</div>
          <div className="text-[10px] text-red-400/70 mt-1">Fuera de vigencia</div>
        </button>

        <button
          onClick={() => setFilterType('al_dia')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterType === 'al_dia' 
              ? 'border-emerald-500/50 bg-emerald-500/20 shadow-lg shadow-emerald-500/10' 
              : 'border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
          }`}
        >
          <div className="text-xs text-emerald-400 font-semibold">Al Día</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.alDiaTotal}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">Sin alertas pendientes</div>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-brand-500 border-slate-700 animate-spin" />
        </div>
      ) : technicians.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <Car size={40} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-200">No hay autos registrados</h3>
          <p className="text-sm mt-1 text-slate-400">
            Para que aparezca un auto aquí, debes asignarle una <strong>Patente</strong> a un chofer en su ficha respectiva.
          </p>
        </div>
      ) : filteredAutos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <Filter size={36} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-200">No hay resultados</h3>
          <p className="text-sm mt-1 text-slate-400">
            No encontramos ningún vehículo que coincida con el filtro seleccionado.
          </p>
          <button
            onClick={() => { setSearchQuery(""); setFilterType("todos"); }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/15 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAutos.map(tech => (
            <AutoCard key={tech.id} tech={tech} onClick={() => setEditingTech(tech)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingTech && (
        <EditAutoModal
          tech={editingTech}
          onClose={() => setEditingTech(null)}
          onSave={handleSaveTech}
        />
      )}
    </div>
  );
}
