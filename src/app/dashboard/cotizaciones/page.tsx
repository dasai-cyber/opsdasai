"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, Save, FileText, Printer, Eye, X,
  Building2, User, Mail, Hash, Calendar, Package,
  CheckCircle2, ChevronDown, Search, Filter, Download, FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  descripcion: string;
  cantidad: number;
  valorUnit: number;
}

interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  rut: string;
  atencion: string;
  emailContacto: string;
  descripcionServicio: string;
  direccion: string;
  items: LineItem[];
  validacion: string;
  plazoEntrega: string;
  nota: string;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  createdAt: string;
}

const EMPTY_ITEM = (): LineItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  descripcion: "",
  cantidad: 1,
  valorUnit: 0,
});

const EMPTY_COT = (): Omit<Cotizacion, 'id' | 'createdAt'> => ({
  numero: "",
  fecha: new Date().toLocaleDateString('es-CL'),
  cliente: "",
  rut: "",
  atencion: "",
  emailContacto: "",
  descripcionServicio: "",
  direccion: "",
  items: [EMPTY_ITEM()],
  validacion: "5 días",
  plazoEntrega: "3 días",
  nota: "",
  estado: 'borrador',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IVA_RATE = 0.19;

function calcTotals(items: LineItem[]) {
  const neto = items.reduce((s, i) => s + i.cantidad * i.valorUnit, 0);
  const iva = Math.round(neto * IVA_RATE);
  return { neto, iva, bruto: neto + iva };
}

function fmtCLP(n: number) {
  return "$ " + n.toLocaleString("es-CL");
}

const downloadWord = async (cot: Cotizacion) => {
  try {
    const response = await fetch('/api/generar-cotizacion-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cotizacion: cot }),
    });
    if (!response.ok) {
      throw new Error('Error al generar Word');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion_${cot.numero || cot.id}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Hubo un error al generar el archivo Word');
  }
};

const ESTADO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  borrador:  { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "Borrador" },
  enviada:   { bg: "rgba(245,158,11,0.15)",  color: "#f59e0b", label: "Enviada" },
  aprobada:  { bg: "rgba(114,176,29,0.15)",  color: "#72b01d", label: "Aprobada" },
  rechazada: { bg: "rgba(239,68,68,0.15)",   color: "#ef4444", label: "Rechazada" },
};

// Helper to format date as "06 de Agosto 2026"
function formatLongDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    if (!isNaN(day) && month >= 0 && month < 12 && !isNaN(year)) {
      return `${String(day).padStart(2, '0')} de ${months[month]} ${year}`;
    }
  }
  return dateStr;
}

// ─── Print Modal ──────────────────────────────────────────────────────────────
function PrintView({ cot, onClose }: { cot: Cotizacion; onClose: () => void }) {
  const { neto, iva, bruto } = calcTotals(cot.items);

  const handleDownloadWord = () => downloadWord(cot);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("print-area");
    if (!element) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin:      0,
      filename:    `Cotizacion_${cot.numero || cot.id}.pdf`,
      image:       { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'letter', orientation: 'portrait' },
    };
    html2pdf().from(element).set(opt).save();
  };

  // Design tokens — exact match to mockup
  const NAVY       = '#1D2D44';
  const BLUE_TEXT  = '#1F497D';
  const TABLE_HDR  = '#4E5E77';
  const ROW_ALT    = '#EBF1F6';
  const LABEL_GRY  = '#64748B';
  const BODY_TXT   = '#334155';
  const CLIENT_BLU = '#2B6CB0';
  const WAVE_H     = 130;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 830 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 14 }}>
          <button onClick={handleDownloadWord} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#2b579a', color: 'white', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <FileText size={14} /> Word
          </button>
          <button onClick={handleDownloadPDF} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#dc2626', color: 'white', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={14} /> PDF
          </button>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'linear-gradient(135deg,#72b01d,#578814)', color: 'white', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Printer size={14} /> Imprimir
          </button>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <X size={14} /> Cerrar
          </button>
        </div>

        {/* Document */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div id="print-area" style={{
            position: 'relative',
            background: 'white',
            width: '794px',
            minHeight: '1123px',
            boxSizing: 'border-box',
            fontFamily: "'Arial', sans-serif",
            fontSize: 12,
            color: BODY_TXT,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}>

            {/* TOP WAVE */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: WAVE_H, zIndex: 0, pointerEvents: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/top_wave.png" alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
            </div>

            {/* CONTENT */}
            <div style={{
              position: 'relative', zIndex: 1,
              padding: `${WAVE_H - 10}px 58px ${WAVE_H + 30}px 58px`,
              display: 'flex', flexDirection: 'column', minHeight: '1123px',
            }}>

              {/* Header: Logo ← | → Título */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo_keytek.png" alt="keytek" style={{ height: 88, objectFit: 'contain', objectPosition: 'left bottom' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: BLUE_TEXT, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    COTIZACIÓN #{cot.numero || '___'}
                  </div>
                  <div style={{ fontSize: 12, color: LABEL_GRY, marginTop: 4, fontWeight: 500 }}>
                    {formatLongDate(cot.fecha)}
                  </div>
                </div>
              </div>

              {/* CLIENTE */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: BODY_TXT, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>
                  Cliente
                </div>
                {cot.atencion ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: CLIENT_BLU, marginBottom: 2 }}>Nombre: {cot.atencion}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: CLIENT_BLU }}>Empresa: {cot.cliente}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 700, color: CLIENT_BLU }}>{cot.cliente}</div>
                )}
              </div>

              {/* Descripción del servicio (opcional) */}
              {cot.descripcionServicio && (
                <div style={{ marginBottom: 20, padding: '10px 14px', background: '#F8FAFC', borderLeft: `3px solid ${BLUE_TEXT}`, borderRadius: 3 }}>
                  <strong style={{ color: BLUE_TEXT, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>Descripción del Servicio:</strong>
                  <span style={{ whiteSpace: 'pre-wrap', fontSize: 11, display: 'block', marginTop: 3, color: BODY_TXT }}>{cot.descripcionServicio}</span>
                </div>
              )}

              {/* TABLA DE ITEMS */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: TABLE_HDR, color: 'white' }}>
                    <th style={{ padding: '9px 14px', textAlign: 'left',   fontSize: 11, fontWeight: 700 }}>Descripción</th>
                    <th style={{ padding: '9px 14px', textAlign: 'center', fontSize: 11, fontWeight: 700, width: 80 }}>Cantidad</th>
                    <th style={{ padding: '9px 14px', textAlign: 'right',  fontSize: 11, fontWeight: 700, width: 120 }}>Precio</th>
                    <th style={{ padding: '9px 14px', textAlign: 'right',  fontSize: 11, fontWeight: 700, width: 120 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cot.items.map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? 'white' : ROW_ALT }}>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: BODY_TXT, borderBottom: '1px solid #E2E8F0' }}>{item.descripcion}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 11, color: BODY_TXT, borderBottom: '1px solid #E2E8F0' }}>{item.cantidad}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right',  fontSize: 11, color: BODY_TXT, borderBottom: '1px solid #E2E8F0' }}>{fmtCLP(item.valorUnit)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right',  fontSize: 11, color: BODY_TXT, borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>{fmtCLP(item.cantidad * item.valorUnit)}</td>
                    </tr>
                  ))}
                  {cot.items.length < 3 && Array.from({ length: 3 - cot.items.length }).map((_, i) => (
                    <tr key={`filler-${i}`} style={{ background: (cot.items.length + i) % 2 === 0 ? 'white' : ROW_ALT }}>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #E2E8F0' }}>&nbsp;</td>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #E2E8F0' }}>&nbsp;</td>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #E2E8F0' }}>&nbsp;</td>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #E2E8F0' }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTALES */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
                <table style={{ borderCollapse: 'collapse', minWidth: 260 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 16px', fontWeight: 800, color: BODY_TXT, fontSize: 12 }}>TOTAL</td>
                      <td style={{ padding: '6px 16px', textAlign: 'right', fontWeight: 700, color: BODY_TXT, fontSize: 12 }}>{fmtCLP(neto)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 16px', fontWeight: 800, color: BODY_TXT, fontSize: 12 }}>IVA (19%)</td>
                      <td style={{ padding: '6px 16px', textAlign: 'right', fontWeight: 700, color: BODY_TXT, fontSize: 12 }}>{fmtCLP(iva)}</td>
                    </tr>
                    <tr style={{ background: TABLE_HDR }}>
                      <td style={{ padding: '8px 16px', fontWeight: 900, color: 'white', fontSize: 13 }}>TOTAL:</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 900, color: 'white', fontSize: 13 }}>{fmtCLP(bruto)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* NOTA */}
              <div style={{ fontSize: 11, color: BODY_TXT, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800, color: NAVY }}>Nota:</span>{' '}
                {cot.nota || 'La cotización es válida por 5 días.'}
              </div>

            </div>

            {/* BOTTOM WAVE */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: WAVE_H, zIndex: 0, pointerEvents: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bottom_wave.png" alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
            </div>

            {/* EMAIL FOOTER */}
            <div style={{
              position: 'absolute', bottom: 26, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, color: 'white', fontSize: 12, fontWeight: 600, zIndex: 2,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              contacto@keytek.cl
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function CotizacionForm({
  initial,
  onClose,
  onSave,
}: {
  initial?: Cotizacion | null;
  onClose: () => void;
  onSave: (c: Cotizacion) => Promise<void>;
}) {
  const [form, setForm] = useState(initial ?? { ...EMPTY_COT(), id: `cot-${Date.now()}`, createdAt: new Date().toISOString() } as Cotizacion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof Cotizacion) => (val: any) => setForm(f => ({ ...f, [field]: val }));

  const setItem = (id: string, field: keyof LineItem, val: any) =>
    setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, [field]: val } : i) }));

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] }));
  const removeItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

  const { neto, iva, bruto } = calcTotals(form.items);

  const handleSave = async () => {
    if (!form.cliente) { setError("El campo Cliente es obligatorio."); return; }
    setSaving(true); setError("");
    try { await onSave(form); } catch (e: any) { setError(e?.message || "Error al guardar"); setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8, color: "#f1f5f9", fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>
              {initial ? "Editar Cotización" : "Nueva Cotización"}
            </div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>ATM's Servicios — RUT: 76.049.304-K</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Meta row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>FECHA</label>
              <input style={inputStyle} value={form.fecha} onChange={e => set("fecha")(e.target.value)} placeholder="DD/MM/AAAA" />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>N° COTIZACIÓN</label>
              <input style={inputStyle} value={form.numero} onChange={e => set("numero")(e.target.value)} placeholder="Ej: 024-2026" />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>ESTADO</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.estado} onChange={e => set("estado")(e.target.value)}>
                <option value="borrador" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Borrador</option>
                <option value="enviada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Enviada</option>
                <option value="aprobada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Aprobada</option>
                <option value="rechazada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Rechazada</option>
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>SEÑOR(ES) / CLIENTE *</label>
              <input style={inputStyle} value={form.cliente} onChange={e => set("cliente")(e.target.value)} placeholder="Nombre empresa o persona" />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>RUT</label>
              <input style={inputStyle} value={form.rut} onChange={e => set("rut")(e.target.value)} placeholder="XX.XXX.XXX-X" />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>ATENCIÓN</label>
              <input style={inputStyle} value={form.atencion} onChange={e => set("atencion")(e.target.value)} placeholder="Nombre contacto" />
            </div>
            <div>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL CONTACTO</label>
              <input style={inputStyle} value={form.emailContacto} onChange={e => set("emailContacto")(e.target.value)} placeholder="email@empresa.cl" />
            </div>
          </div>

          {/* Descripción servicio */}
          <div>
            <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>DESCRIPCIÓN DEL SERVICIO</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              value={form.descripcionServicio}
              onChange={e => set("descripcionServicio")(e.target.value)}
              placeholder="Ej: VISITA ELÉCTRICA ATM 6423 — TIENDA PRONTO COPEC..."
            />
          </div>

          {/* Items */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>ÍTEMS</label>
              <button onClick={addItem} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(114,176,29,0.12)", border: "1px solid rgba(114,176,29,0.25)", color: "#72b01d", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={12} /> Agregar ítem
              </button>
            </div>

            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 130px 130px 32px", gap: 6, marginBottom: 6 }}>
              {["DESCRIPCIÓN", "CANT.", "VALOR UNIT.", "TOTAL", ""].map(h => (
                <div key={h} style={{ color: "#475569", fontSize: 10, fontWeight: 700 }}>{h}</div>
              ))}
            </div>

            {form.items.map(item => {
              const total = item.cantidad * item.valorUnit;
              return (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 130px 130px 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input style={inputStyle} value={item.descripcion} onChange={e => setItem(item.id, "descripcion", e.target.value)} placeholder="Descripción del ítem" />
                  <input style={{ ...inputStyle, textAlign: "center" }} type="number" min={1} value={item.cantidad} onChange={e => setItem(item.id, "cantidad", Number(e.target.value))} />
                  <input style={{ ...inputStyle, textAlign: "right" }} type="number" min={0} value={item.valorUnit} onChange={e => setItem(item.id, "valorUnit", Number(e.target.value))} placeholder="0" />
                  <div style={{ ...inputStyle, textAlign: "right", color: "#72b01d", fontWeight: 700, pointerEvents: "none" }}>{fmtCLP(total)}</div>
                  <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Nota */}
          <div>
            <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>NOTA</label>
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
              value={form.nota ?? ""}
              onChange={e => set("nota")(e.target.value)}
              placeholder="Observaciones, condiciones, plazo de entrega..."
            />
          </div>

          {/* Totales */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20 }}>
            <div />

            {/* Totals */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px", minWidth: 200 }}>
              {[
                { label: "NETO", value: fmtCLP(neto) },
                { label: "IVA (19%)", value: fmtCLP(iva) },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#94a3b8" }}>
                  <span>{r.label}</span><span style={{ fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#72b01d", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 4 }}>
                <span>BRUTO</span><span>{fmtCLP(bruto)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} disabled={saving} style={{ padding: "9px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", background: saving ? "#578814" : "linear-gradient(135deg,#72b01d,#578814)", border: "none", color: "white", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.8 : 1 }}>
              {saving ? (
                <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Guardando...</>
              ) : (
                <><Save size={14} />Guardar Cotización</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cotizacion | null>(null);
  const [previewing, setPreviewing] = useState<Cotizacion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Cotizacion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cotizaciones")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCotizaciones(data.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at })));
    setLoading(false);
  }

  const handleDownloadWord = (cot: Cotizacion) => {
    downloadWord(cot);
  };

  async function handleSave(cot: Cotizacion) {
    const exists = cotizaciones.some(c => c.id === cot.id);
    const { error } = await supabase
      .from("cotizaciones")
      .upsert({ id: cot.id, data: cot });
    if (error) throw new Error(error.message);
    setCotizaciones(prev =>
      exists ? prev.map(c => c.id === cot.id ? cot : c) : [cot, ...prev]
    );
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("cotizaciones").delete().eq("id", confirmDelete.id);
    if (!error) {
      setCotizaciones(prev => prev.filter(c => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
    setDeleting(false);
  }

  const filtered = cotizaciones.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.numero.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q) || c.descripcionServicio.toLowerCase().includes(q);
    const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  // Stats
  const stats = {
    total: cotizaciones.length,
    aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length,
    enviadas: cotizaciones.filter(c => c.estado === 'enviada').length,
    monto: cotizaciones.filter(c => c.estado === 'aprobada').reduce((s, c) => s + calcTotals(c.items).bruto, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Cotizaciones</h2>
          <p className="section-subtitle">Gestión de presupuestos y propuestas comerciales</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#72b01d,#578814)", border: "none", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(114,176,29,0.35)" }}
        >
          <Plus size={16} /> Nueva Cotización
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total cotizaciones", value: stats.total, color: "#72b01d", icon: FileText },
          { label: "Enviadas", value: stats.enviadas, color: "#f59e0b", icon: Mail },
          { label: "Aprobadas", value: stats.aprobadas, color: "#10b981", icon: CheckCircle2 },
          { label: "Monto aprobado", value: fmtCLP(stats.monto), color: "#3b82f6", icon: Package },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}18` }}>
                  <Icon size={20} style={{ color: k.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: "#f1f5f9" }}>{k.value}</div>
              <div className="text-sm" style={{ color: "#64748b" }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N°, cliente, descripción..."
            style={{ width: "100%", padding: "8px 12px 8px 34px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          style={{ padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, fontFamily: "inherit", cursor: "pointer", minWidth: 150 }}
        >
          <option value="todos" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Todos los estados</option>
          <option value="borrador" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Borrador</option>
          <option value="enviada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Enviada</option>
          <option value="aprobada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Aprobada</option>
          <option value="rechazada" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Rechazada</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card p-12 text-center" style={{ color: "#64748b" }}>Cargando cotizaciones...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText size={40} style={{ color: "#334155", margin: "0 auto 12px" }} />
          <div style={{ color: "#94a3b8", fontWeight: 600 }}>No hay cotizaciones</div>
          <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>Crea tu primera cotización con el botón de arriba</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const { bruto } = calcTotals(c.items);
            const est = ESTADO_STYLE[c.estado];
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(114,176,29,0.08)", border: "1px solid rgba(114,176,29,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={20} style={{ color: "#72b01d" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>N° {c.numero || "Sin número"}</span>
                        <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: est.bg, color: est.color, fontWeight: 700 }}>{est.label}</span>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                        <Building2 size={11} style={{ display: "inline", marginRight: 4 }} />{c.cliente || "Sin cliente"}
                        {c.atencion && <> · <User size={11} style={{ display: "inline", marginRight: 4 }} />{c.atencion}</>}
                      </div>
                      {c.descripcionServicio && (
                        <div style={{ color: "#94a3b8", fontSize: 12, maxWidth: 500 }}>{c.descripcionServicio.slice(0, 120)}{c.descripcionServicio.length > 120 ? "…" : ""}</div>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span style={{ color: "#475569", fontSize: 11 }}><Calendar size={10} style={{ display: "inline", marginRight: 3 }} />{c.fecha}</span>
                        <span style={{ color: "#72b01d", fontSize: 12, fontWeight: 700 }}>{fmtCLP(bruto)}</span>
                        <span style={{ color: "#475569", fontSize: 11 }}>{c.items.length} ítem{c.items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setPreviewing(c)} className="btn-secondary text-xs py-1.5 px-3"><Eye size={12} /> Ver / Imprimir</button>
                    <button onClick={() => { setEditing(c); setShowForm(true); }} className="btn-secondary text-xs py-1.5 px-3"><FileText size={12} /> Editar</button>
                    <button onClick={() => handleDownloadWord(c)} className="btn-secondary text-xs py-1.5 px-3" style={{ color: "#72b01d" }}><FileText size={12} /> Word</button>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      className="text-xs py-1.5 px-3"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                    >
                      <Trash2 size={12} /> Borrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <CotizacionForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {previewing && <PrintView cot={previewing} onClose={() => setPreviewing(null)} />}

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1b1e24", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} style={{ color: "#f87171" }} />
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>¿Eliminar cotización?</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Esta acción no se puede deshacer</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>N° {confirmDelete.numero}</div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{confirmDelete.cliente}</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ padding: "9px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: deleting ? "#7f1d1d" : "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", color: "white", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: deleting ? 0.8 : 1 }}>
                {deleting ? "Eliminando..." : <><Trash2 size={14} /> Sí, eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
