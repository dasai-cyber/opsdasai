"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Technician } from "@/types";
import { 
  Car, FileText, Upload, X, CheckCircle2, AlertCircle, FileBox
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  disponible: "#72b01d",
  "en ruta": "#3b82f6",
  trabajando: "#f59e0b",
  offline: "#64748b",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(27,30,36,0.95)",
  border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8,
  padding: "10px 14px", fontSize: 13.5, color: "#e2e8f0",
  outline: "none", fontFamily: "inherit",
};

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

  const [docs, setDocs] = useState({
    revisionTecnica: null as File | null,
    gases: null as File | null,
    permisoCirculacion: null as File | null,
  });

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      const autoDocsUrls = { ...(tech.autoDocumentos || {}) };
      
      if (docs.revisionTecnica) autoDocsUrls.revisionTecnica = await uploadDocument(docs.revisionTecnica, tech.id, 'revisionTecnica');
      if (docs.gases) autoDocsUrls.gases = await uploadDocument(docs.gases, tech.id, 'gases');
      if (docs.permisoCirculacion) autoDocsUrls.permisoCirculacion = await uploadDocument(docs.permisoCirculacion, tech.id, 'permisoCirculacion');

      const updated = { ...tech, autoDocumentos: autoDocsUrls };
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

  const DocInput = ({ label, field, currentUrl }: { label: string; field: keyof typeof docs, currentUrl?: string }) => (
    <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)" }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 8 }}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        {currentUrl && (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400" title="Ver archivo actual">
            <FileText size={20} />
          </a>
        )}
        <input 
          type="file" 
          accept="image/*,.pdf" 
          style={{ fontSize: 12, color: "#94a3b8" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setDocs(d => ({ ...d, [field]: e.target.files![0] }));
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.12)" }}>
                <Car size={18} style={{ color: "#72b01d" }} />
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#f1f5f9" }}>Documentación del Auto</div>
                <div className="text-xs" style={{ color: "#475569" }}>Patente: {tech.patente} • Chofer: {tech.name}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <DocInput label="Revisión Técnica" field="revisionTecnica" currentUrl={tech.autoDocumentos?.revisionTecnica} />
              <DocInput label="Gases" field="gases" currentUrl={tech.autoDocumentos?.gases} />
              <DocInput label="Permiso de Circulación" field="permisoCirculacion" currentUrl={tech.autoDocumentos?.permisoCirculacion} />
            </div>

            {saveError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: 12, borderRadius: 8, fontSize: 13 }}>{saveError}</div>}
          </div>

          <div className="px-6 py-4 flex justify-end gap-3" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={onClose} style={{ background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8 }}>
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving || saved}
              style={{
                background: saved ? "#22c55e" : "#72b01d", color: "white", fontSize: 13, fontWeight: 500,
                padding: "8px 20px", borderRadius: 8, opacity: saving ? 0.7 : 1, transition: "background 0.2s"
              }}
            >
              {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Documentos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auto Card Component ────────────────────────────────────────────────────
function AutoCard({ tech, onClick }: { tech: Technician; onClick: () => void }) {
  const getDocStatus = (url?: string) => {
    return url 
      ? <div className="flex items-center gap-1 text-xs text-green-500"><CheckCircle2 size={12} /> Subida</div>
      : <div className="flex items-center gap-1 text-xs text-slate-500"><AlertCircle size={12} /> Falta</div>;
  };

  return (
    <div className="glass-card-hover p-5 cursor-pointer flex flex-col h-full" onClick={onClick}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
          <Car size={24} style={{ color: "#72b01d" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg" style={{ color: "#f1f5f9", letterSpacing: "1px" }}>
            {tech.patente} <span className="text-sm font-normal text-slate-400 ml-2">{tech.modeloAuto} {tech.anioAuto}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            Chofer: <span className="text-slate-300">{tech.name}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Revisión Técnica</span>
          {getDocStatus(tech.autoDocumentos?.revisionTecnica)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Gases</span>
          {getDocStatus(tech.autoDocumentos?.gases)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-2"><FileBox size={12} /> Permiso de Circ.</span>
          {getDocStatus(tech.autoDocumentos?.permisoCirculacion)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AutosPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  useEffect(() => {
    async function fetchAll() {
      const { data: techData } = await supabase
        .from('tecnicos')
        .select('*')
        .order('tech_number', { ascending: true });
        
      if (techData) {
        const mapped = techData.map(t => {
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
            status: (dt.status || t.status || 'disponible') as any,
            completedOrders: dt.completedOrders || t.completed_orders || 0,
            avgTime: dt.avgTime || t.avg_time || 0,
            productivity: dt.productivity || t.productivity || 0,
            documentos: dt.documentos || {},
            autoDocumentos: dt.autoDocumentos || {},
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Documentación de Autos</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Administra los documentos de los vehículos registrados en la plataforma.
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-brand-500 border-slate-700 animate-spin" />
        </div>
      ) : technicians.length === 0 ? (
        <div className="text-center py-12" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <Car size={40} className="mx-auto mb-3" style={{ color: "#475569" }} />
          <h3 className="text-lg font-medium" style={{ color: "#e2e8f0" }}>No hay autos registrados</h3>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Para que aparezca un auto aquí, debes asignarle una <strong>Patente</strong> a un chofer en su ficha respectiva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {technicians.map(tech => (
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
