"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
  Receipt, ShoppingCart, Package, Send, Calendar, Search, Filter,
  CheckSquare, Square, Download, Printer, RefreshCw, Eye, FileSpreadsheet,
  AlertCircle, Building2, CreditCard, ChevronDown, Check, ArrowRight,
  HelpCircle, Sparkles, X
} from "lucide-react";

// ─── Interfaces ─────────────────────────────────────────────────────────────
export type CategoriaTipo = 'coordinacion' | 'paqueteria' | 'dhl';

export interface PrefacturaItem {
  id: string;
  categoria: CategoriaTipo;
  patente: string;
  vehiculo?: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  local: string;
  folio: string;
  puntos: string | number;
  asignadoA: string;
  v1: string;
  sg1: string | number;
  v2: string;
  sg2: string | number;
  v3: string;
  sg3: string | number;
  v4: string;
  sg4: string | number;
  v5: string;
  sg5: string | number;
  valorDia: string | number;
  adicional: string | number;
  vueltas: string | number;
  comisionDasai?: string | number;
  totalCalculado: number;
}

export interface ClienteData {
  razonSocial: string;
  rut: string;
  giro: string;
  direccion: string;
  contacto: string;
}

export interface EmisorData {
  nombre: string;
  subtitulo: string;
  rut: string;
  direccion: string;
  telefono: string;
  correo: string;
}

export interface TransferenciaData {
  banco: string;
  tipoCuenta: string;
  numCuenta: string;
  titular: string;
  rut: string;
  correo: string;
}

// ─── Preset Clients ─────────────────────────────────────────────────────────
const CLIENTE_PRESETS: Record<string, ClienteData> = {
  walmart: {
    razonSocial: "Walmart Chile SpA",
    rut: "76.012.345-6",
    giro: "Supermercados y Distribución Logística",
    direccion: "Av. Presidente Eduardo Frei Montalva 8301, Quilicura, Santiago",
    contacto: "Operaciones & Logística · facturacion@walmart.com",
  },
  dhl: {
    razonSocial: "DHL Express Chile Ltda.",
    rut: "88.765.432-1",
    giro: "Transporte y Envíos Expresos Internacionales",
    direccion: "Av. Américo Vespucio Oriente 1385, Enea, Pudahuel, Santiago",
    contacto: "Finanzas & Cuentas por Pagar · pagos@dhl.cl",
  },
  cencosud: {
    razonSocial: "Cencosud Retail S.A.",
    rut: "96.792.430-K",
    giro: "Grandes Tiendas y Supermercados",
    direccion: "Av. Kennedy 9001, Las Condes, Santiago",
    contacto: "Administración y Cobranzas · cobranzas@cencosud.cl",
  },
  plantilla: {
    razonSocial: "Empresa Cliente SpA",
    rut: "76.000.000-0",
    giro: "Comercio al por menor",
    direccion: "Av. Ejemplo 1234, Santiago",
    contacto: "Nombre Apellido · correo@cliente.cl",
  },
};

const DEFAULT_EMISOR: EmisorData = {
  nombre: "DASAI",
  subtitulo: "Distribución y última milla · Calidad & Servicio",
  rut: "77.123.456-7",
  direccion: "Santiago, Región Metropolitana",
  telefono: "+56 9 8765 4321",
  correo: "contacto@dasai.cl",
};

const DEFAULT_TRANSFERENCIA: TransferenciaData = {
  banco: "Banco Santander",
  tipoCuenta: "Cuenta Corriente",
  numCuenta: "000000000",
  titular: "Dasai SpA",
  rut: "77.123.456-7",
  correo: "pagos@dasai.cl",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseMoneyValue = (val: string | number | undefined): number => {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

const formatCLP = (amount: number): string => {
  return `$ ${amount.toLocaleString("es-CL")}`;
};

export default function PrefacturaPage() {
  const [data, setData] = useState<PrefacturaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Categorías seleccionadas
  const [selectedCats, setSelectedCats] = useState<Set<CategoriaTipo>>(
    new Set<CategoriaTipo>(['coordinacion', 'paqueteria', 'dhl'])
  );

  // Filtros adicionales
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filterPPU, setFilterPPU] = useState<"todos" | "con_ppu" | "sin_ppu">("todos");

  // Selección individual de filas para la prefactura
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Datos de la Prefactura
  const [numPrefactura, setNumPrefactura] = useState("PF-0001");
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().split("T")[0]);
  const [plazoDias, setPlazoDias] = useState<number>(30);
  const [descuentoPct, setDescuentoPct] = useState<number>(0);
  const [observaciones, setObservaciones] = useState("Período de distribución correspondiente al mes facturado.");

  // Cliente
  const [clientePreset, setClientePreset] = useState("plantilla");
  const [cliente, setCliente] = useState<ClienteData>(CLIENTE_PRESETS.plantilla);

  // Emisor & Transferencia
  const [emisor, setEmisor] = useState<EmisorData>(DEFAULT_EMISOR);
  const [transferencia, setTransferencia] = useState<TransferenciaData>(DEFAULT_TRANSFERENCIA);

  // Modo de visualización: 'gestion' (interactivo para filtrar/seleccionar) | 'documento' (previsualización formal para imprimir)
  const [vistaModo, setVistaModo] = useState<'gestion' | 'documento'>('gestion');

  // Calcular fecha de vencimiento
  const fechaVencimiento = useMemo(() => {
    if (!fechaEmision) return "";
    try {
      const parts = fechaEmision.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + (Number(plazoDias) || 0));
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }, [fechaEmision, plazoDias]);

  // Cargar datos de localStorage para configuraciones
  useEffect(() => {
    try {
      const savedEmisor = localStorage.getItem("prefactura_emisor");
      if (savedEmisor) setEmisor(JSON.parse(savedEmisor));
      const savedTrans = localStorage.getItem("prefactura_transferencia");
      if (savedTrans) setTransferencia(JSON.parse(savedTrans));
      const savedNum = localStorage.getItem("prefactura_num");
      if (savedNum) setNumPrefactura(savedNum);
    } catch (e) {
      console.warn("Error leyendo localStorage:", e);
    }
  }, []);

  // Fetch real-time de servicios desde Supabase
  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('servicios').select('*');
    if (!error && rows) {
      const parsed: PrefacturaItem[] = rows.map(r => {
        const dt = r.data || {};
        let cat: CategoriaTipo = 'coordinacion';
        if (r.id?.startsWith('dhl-') || dt.type === 'dhl' || dt.categoria === 'dhl') {
          cat = 'dhl';
        } else if (r.id?.startsWith('paq-') || dt.type === 'paqueteria' || dt.categoria === 'paqueteria') {
          cat = 'paqueteria';
        } else {
          cat = 'coordinacion';
        }

        const valorDiaNum = parseMoneyValue(dt.valorDia || dt.descuento || "");
        const adicionalNum = parseMoneyValue(dt.adicional || dt.bono || "");
        const vueltasNum = parseMoneyValue(dt.vueltas || "");
        const total = valorDiaNum + adicionalNum + vueltasNum;

        // Calcular puntos si no vienen
        let puntosVal: string | number = dt.puntos || "";
        if (!puntosVal) {
          const sumSG = (Number(dt.sg1 || dt.sg) || 0) + (Number(dt.sg2) || 0) + (Number(dt.sg3) || 0) + (Number(dt.sg4) || 0) + (Number(dt.sg5) || 0);
          if (sumSG > 0) puntosVal = sumSG;
        }

        return {
          id: r.id,
          categoria: cat,
          patente: dt.patente || "",
          vehiculo: dt.vehiculo || "",
          fecha: dt.fecha || "",
          horaInicio: dt.horaInicio || "",
          horaTermino: dt.horaTermino || "",
          local: dt.local || "",
          folio: dt.folio || dt.guias || "",
          puntos: puntosVal,
          asignadoA: dt.asignadoA || "",
          v1: dt.v1 || "",
          sg1: dt.sg1 || dt.sg || "",
          v2: dt.v2 || "",
          sg2: dt.sg2 || "",
          v3: dt.v3 || "",
          sg3: dt.sg3 || "",
          v4: dt.v4 || "",
          sg4: dt.sg4 || "",
          v5: dt.v5 || "",
          sg5: dt.sg5 || "",
          valorDia: dt.valorDia || "",
          adicional: dt.adicional || "",
          vueltas: dt.vueltas || "",
          comisionDasai: dt.comisionDasai || "",
          totalCalculado: total,
        };
      });

      // Ordenar por fecha descendente
      parsed.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setData(parsed);

      // Por defecto, seleccionar todos los IDs
      setSelectedRowIds(new Set(parsed.map(p => p.id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('custom-prefactura-servicios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Manejar cambio de preset de cliente
  const handleSelectPreset = (key: string) => {
    setClientePreset(key);
    if (CLIENTE_PRESETS[key]) {
      setCliente(CLIENTE_PRESETS[key]);
    }
  };

  // Toggle de categoría individual
  const toggleCategory = (cat: CategoriaTipo) => {
    const next = new Set(selectedCats);
    if (next.has(cat)) {
      if (next.size > 1) next.delete(cat); // Impedir deseleccionar todas
    } else {
      next.add(cat);
    }
    setSelectedCats(next);

    // Ajustar preset sugerido según la categoría si solo hay una seleccionada
    if (next.size === 1) {
      if (next.has('dhl')) handleSelectPreset('dhl');
      else if (next.has('paqueteria')) handleSelectPreset('walmart');
      else if (next.has('coordinacion')) handleSelectPreset('walmart');
    }
  };

  const selectAllCategories = () => {
    setSelectedCats(new Set<CategoriaTipo>(['coordinacion', 'paqueteria', 'dhl']));
  };

  const selectSingleCategory = (cat: CategoriaTipo) => {
    setSelectedCats(new Set<CategoriaTipo>([cat]));
    if (cat === 'dhl') handleSelectPreset('dhl');
    else if (cat === 'paqueteria') handleSelectPreset('walmart');
    else if (cat === 'coordinacion') handleSelectPreset('walmart');
  };

  // Filtrado de servicios
  const hasPPU = (patente: string | null | undefined): boolean => {
    if (!patente) return false;
    const p = patente.trim().toLowerCase();
    return p.length > 0 && p !== '-' && p !== 'sin ppu' && p !== 's/p' && p !== 'null' && p !== 'undefined';
  };

  const filteredData = useMemo(() => {
    return data.filter(d => {
      // Filtro de Categoría seleccionada
      if (!selectedCats.has(d.categoria)) return false;

      // Búsqueda de texto
      if (search) {
        const s = search.toLowerCase();
        const matches = (
          d.patente.toLowerCase().includes(s) ||
          d.asignadoA.toLowerCase().includes(s) ||
          d.local.toLowerCase().includes(s) ||
          String(d.folio).toLowerCase().includes(s)
        );
        if (!matches) return false;
      }

      // Rango de fechas
      if (fechaDesde && d.fecha && d.fecha < fechaDesde) return false;
      if (fechaHasta && d.fecha && d.fecha > fechaHasta) return false;

      // Filtro PPU
      if (filterPPU === 'con_ppu' && !hasPPU(d.patente)) return false;
      if (filterPPU === 'sin_ppu' && hasPPU(d.patente)) return false;

      return true;
    });
  }, [data, selectedCats, search, fechaDesde, fechaHasta, filterPPU]);

  // Filas efectivamente seleccionadas para la prefactura
  const prefacturaRows = useMemo(() => {
    return filteredData.filter(d => selectedRowIds.has(d.id));
  }, [filteredData, selectedRowIds]);

  // Selección en masa
  const handleToggleAllRows = () => {
    const allFilteredSelected = filteredData.every(d => selectedRowIds.has(d.id));
    const next = new Set(selectedRowIds);
    if (allFilteredSelected) {
      filteredData.forEach(d => next.delete(d.id));
    } else {
      filteredData.forEach(d => next.add(d.id));
    }
    setSelectedRowIds(next);
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  // Cálculos de liquidación
  const subtotalNeto = useMemo(() => {
    return prefacturaRows.reduce((acc, r) => acc + r.totalCalculado, 0);
  }, [prefacturaRows]);

  const descuentoMonto = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Number(descuentoPct) || 0));
    return Math.round(subtotalNeto * (pct / 100));
  }, [subtotalNeto, descuentoPct]);

  const neto = useMemo(() => {
    return Math.max(0, subtotalNeto - descuentoMonto);
  }, [subtotalNeto, descuentoMonto]);

  const iva = useMemo(() => {
    return Math.round(neto * 0.19);
  }, [neto]);

  const totalPagar = useMemo(() => {
    return neto + iva;
  }, [neto, iva]);

  // Contadores por categoría disponibles
  const catCounts = useMemo(() => {
    let coord = 0, paq = 0, dhl = 0;
    let coordTotal = 0, paqTotal = 0, dhlTotal = 0;
    data.forEach(d => {
      if (d.categoria === 'coordinacion') { coord++; coordTotal += d.totalCalculado; }
      else if (d.categoria === 'paqueteria') { paq++; paqTotal += d.totalCalculado; }
      else if (d.categoria === 'dhl') { dhl++; dhlTotal += d.totalCalculado; }
    });
    return { coord, paq, dhl, coordTotal, paqTotal, dhlTotal };
  }, [data]);

  // Exportar a Excel con la estructura exacta de la plantilla oficial
  const handleExportExcel = () => {
    const aoa: any[][] = [];

    // Fila 1 a 5: Cabecera Emisor y Prefactura
    aoa.push(["", "", emisor.nombre, "", "", "", "", "", "", "", "", "", "", "", "", "PREFACTURA", "", ""]);
    aoa.push(["", "", emisor.subtitulo, "", "", "", "", "", "", "", "", "", "", "", "", "N° prefactura", "", numPrefactura]);
    aoa.push(["", "", `RUT empresa: ${emisor.rut}`, "", "", "", "", "", "", "", "", "", "", "", "", "Fecha emisión", "", formatDate(fechaEmision)]);
    aoa.push(["", "", `Dirección: ${emisor.direccion}`, "", "", "", "", "", "", "", "", "", "", "", "", "Plazo de pago (días)", "", plazoDias]);
    aoa.push(["", "", `Tel: ${emisor.telefono} · ${emisor.correo}`, "", "", "", "", "", "", "", "", "", "", "", "", "Fecha vencimiento", "", formatDate(fechaVencimiento)]);
    aoa.push([]);

    // Datos del Cliente
    aoa.push(["DATOS DEL CLIENTE"]);
    aoa.push(["Razón social", "", cliente.razonSocial]);
    aoa.push(["RUT", "", cliente.rut]);
    aoa.push(["Giro", "", cliente.giro]);
    aoa.push(["Dirección", "", cliente.direccion]);
    aoa.push(["Contacto", "", cliente.contacto]);
    aoa.push([]);

    // Detalle del Servicio
    aoa.push(["DETALLE DEL SERVICIO"]);
    aoa.push([
      "PPU", "Fecha", "Hora Inicio", "Hora Término", "Local", "Puntos", "Asignado a",
      "V1", "SG1", "V2", "SG2", "V3", "SG3", "V4", "SG4", "V5", "SG5",
      "Valor Día", "Adicional", "Bono", "Total"
    ]);

    prefacturaRows.forEach(r => {
      aoa.push([
        r.patente,
        formatDate(r.fecha),
        r.horaInicio || "",
        r.horaTermino || "",
        r.local || "",
        r.puntos || "",
        r.asignadoA || "",
        r.v1 || "",
        r.sg1 || "",
        r.v2 || "",
        r.sg2 || "",
        r.v3 || "",
        r.sg3 || "",
        r.v4 || "",
        r.sg4 || "",
        r.v5 || "",
        r.sg5 || "",
        parseMoneyValue(r.valorDia),
        parseMoneyValue(r.adicional),
        parseMoneyValue(r.vueltas),
        r.totalCalculado
      ]);
    });

    // Totales
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "TOTAL", subtotalNeto]);
    aoa.push([]);
    aoa.push(["Observaciones:", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Subtotal neto", "", "", subtotalNeto]);
    aoa.push([observaciones, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Descuento (%)", "", `${descuentoPct}%`, descuentoMonto]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Neto", "", "", neto]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "IVA (%)", "", "19%", iva]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "TOTAL A PAGAR", "", "", totalPagar]);
    aoa.push([]);

    // Datos de Transferencia
    aoa.push(["DATOS DE TRANSFERENCIA"]);
    aoa.push(["Banco", "", transferencia.banco]);
    aoa.push(["Tipo de cuenta", "", transferencia.tipoCuenta]);
    aoa.push(["N° de cuenta", "", transferencia.numCuenta]);
    aoa.push(["Titular / RUT", "", `${transferencia.titular} · ${transferencia.rut}`]);
    aoa.push(["Correo comprobante", "", transferencia.correo]);
    aoa.push([]);

    // Nota al pie
    aoa.push(["Documento informativo, no válido como documento tributario. Los valores se facturarán electrónicamente según lo acordado."]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prefactura");

    const safeClient = cliente.razonSocial.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
    XLSX.writeFile(wb, `Prefactura_${numPrefactura}_${safeClient}_${fechaEmision}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden" style={{ background: "#0a0a0b" }}>
      {/* Estilos para impresión en papel o PDF horizontal */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #prefactura-print-area, #prefactura-print-area * { visibility: visible; }
          #prefactura-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 20px !important;
            font-size: 11px !important;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #cbd5e1 !important; color: #0f172a !important; }
          th { background: #f1f5f9 !important; font-weight: bold !important; }
          @page { size: landscape; margin: 10mm; }
        }
      `}</style>

      {/* Header Principal */}
      <div className="p-6 border-b border-white/5 no-print" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/10" style={{ background: "linear-gradient(135deg, #ff5aac, #5600d4)", color: "white" }}>
                <Receipt size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>Generador de Prefactura</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Sincronización en Vivo
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolida servicios agregados en Supermercado, Paquetería o DHL, aplica IVA y genera la prefactura oficial.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setVistaModo(vistaModo === 'gestion' ? 'documento' : 'gestion')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                vistaModo === 'documento'
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/30 shadow'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Eye size={15} />
              {vistaModo === 'documento' ? "Modo Filtros y Selección" : "Vista Previa Documento"}
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all shadow"
            >
              <Download size={15} />
              Exportar Excel Oficial (.xlsx)
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #ff5aac 0%, #700ece 100%)" }}
            >
              <Printer size={15} />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* ─── PASO 1: SELECTOR DE CATEGORÍAS (Requerimiento Clave) ─────────── */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-slate-950 font-bold text-xs flex items-center justify-center">1</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Selecciona las Categorías a Incluir en la Prefactura:
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={selectAllCategories}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Todas
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => selectSingleCategory('coordinacion')}
                className="px-2 py-1 rounded-lg hover:text-white text-slate-400 transition-colors"
              >
                Solo Supermercado
              </button>
              <button
                onClick={() => selectSingleCategory('paqueteria')}
                className="px-2 py-1 rounded-lg hover:text-white text-slate-400 transition-colors"
              >
                Solo Paquetería
              </button>
              <button
                onClick={() => selectSingleCategory('dhl')}
                className="px-2 py-1 rounded-lg hover:text-white text-slate-400 transition-colors"
              >
                Solo DHL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Supermercado */}
            <div
              onClick={() => toggleCategory('coordinacion')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedCats.has('coordinacion')
                  ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                  : 'border-white/5 bg-white/[0.02] opacity-50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedCats.has('coordinacion') ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-slate-500'}`}>
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Supermercado</span>
                    {selectedCats.has('coordinacion') && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {catCounts.coord} servicios • {formatCLP(catCounts.coordTotal)}
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedCats.has('coordinacion') ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-600'}`}>
                {selectedCats.has('coordinacion') && <Check size={14} />}
              </div>
            </div>

            {/* Paquetería */}
            <div
              onClick={() => toggleCategory('paqueteria')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedCats.has('paqueteria')
                  ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-white/5 bg-white/[0.02] opacity-50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedCats.has('paqueteria') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Paquetería</span>
                    {selectedCats.has('paqueteria') && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {catCounts.paq} servicios • {formatCLP(catCounts.paqTotal)}
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedCats.has('paqueteria') ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'}`}>
                {selectedCats.has('paqueteria') && <Check size={14} />}
              </div>
            </div>

            {/* DHL */}
            <div
              onClick={() => toggleCategory('dhl')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedCats.has('dhl')
                  ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                  : 'border-white/5 bg-white/[0.02] opacity-50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedCats.has('dhl') ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'}`}>
                  <Send size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <span>DHL</span>
                    {selectedCats.has('dhl') && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {catCounts.dhl} servicios • {formatCLP(catCounts.dhlTotal)}
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedCats.has('dhl') ? 'bg-amber-500 border-amber-400 text-white' : 'border-slate-600'}`}>
                {selectedCats.has('dhl') && <Check size={14} />}
              </div>
            </div>
          </div>
        </div>

        {/* ─── PASO 2: FILTROS ADICIONALES (Búsqueda, Fechas, PPU) ──────────── */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 flex items-center px-4 py-2 rounded-xl border" style={{ background: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Search size={16} className="text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por PPU, chofer, local o folio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-200"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 ml-1">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Calendar size={14} className="text-brand-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
            <Calendar size={14} className="text-brand-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Filtro PPU */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-black/20 shrink-0">
            <button
              onClick={() => setFilterPPU("todos")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterPPU === 'todos' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
            >
              Todas PPU
            </button>
            <button
              onClick={() => setFilterPPU("con_ppu")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterPPU === 'con_ppu' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              Con PPU
            </button>
            <button
              onClick={() => setFilterPPU("sin_ppu")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterPPU === 'sin_ppu' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
            >
              Sin PPU
            </button>
          </div>

          {(search || fechaDesde || fechaHasta || filterPPU !== 'todos') && (
            <button
              onClick={() => { setSearch(""); setFechaDesde(""); setFechaHasta(""); setFilterPPU("todos"); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:bg-white/5"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ─── DATOS CLIENTE Y FACTURACIÓN ───────────────────────────────────── */}
      <div className="p-6 border-b border-white/5 no-print" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos del Cliente */}
          <div className="lg:col-span-2 p-4 rounded-xl border border-white/5 bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Datos del Cliente Facturado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Plantilla / Cliente:</span>
                <select
                  value={clientePreset}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="walmart">Walmart Chile SpA</option>
                  <option value="dhl">DHL Express Chile</option>
                  <option value="cencosud">Cencosud Retail S.A.</option>
                  <option value="plantilla">Empresa Cliente SpA (Genérico)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Razón Social</label>
                <input
                  type="text"
                  value={cliente.razonSocial}
                  onChange={(e) => setCliente({ ...cliente, razonSocial: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">RUT</label>
                <input
                  type="text"
                  value={cliente.rut}
                  onChange={(e) => setCliente({ ...cliente, rut: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Giro</label>
                <input
                  type="text"
                  value={cliente.giro}
                  onChange={(e) => setCliente({ ...cliente, giro: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Dirección</label>
                <input
                  type="text"
                  value={cliente.direccion}
                  onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Contacto</label>
                <input
                  type="text"
                  value={cliente.contacto}
                  onChange={(e) => setCliente({ ...cliente, contacto: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Configuración de Fechas y N° Prefactura */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Emisión y Cobro</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">N° Prefactura</label>
                <input
                  type="text"
                  value={numPrefactura}
                  onChange={(e) => {
                    setNumPrefactura(e.target.value);
                    localStorage.setItem("prefactura_num", e.target.value);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs font-bold text-brand-300 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fecha Emisión</label>
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Plazo (Días)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={plazoDias}
                  onChange={(e) => setPlazoDias(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs text-slate-200 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fecha Vencimiento</label>
                <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-black/10 text-xs font-semibold text-emerald-400">
                  {formatDate(fechaVencimiento) || "—"}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Descuento Comercial:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={descuentoPct}
                  onChange={(e) => setDescuentoPct(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded bg-black/20 border border-white/10 text-right text-xs text-slate-200 outline-none focus:border-brand-500"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── VISTA GESTIÓN: TABLA INTERACTIVA DE SERVICIOS ────────────────── */}
      {vistaModo === 'gestion' && (
        <div className="p-6 flex-1 flex flex-col no-print">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAllRows}
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
              >
                {filteredData.length > 0 && filteredData.every(d => selectedRowIds.has(d.id)) ? (
                  <>
                    <CheckSquare size={14} className="text-brand-400" />
                    Deseleccionar todos
                  </>
                ) : (
                  <>
                    <Square size={14} />
                    Seleccionar todos ({filteredData.length})
                  </>
                )}
              </button>
              <span className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-200">{filteredData.length}</strong> servicios •{" "}
                <strong className="text-emerald-400">{prefacturaRows.length}</strong> seleccionados para la prefactura
              </span>
            </div>

            <div className="text-xs text-slate-400">
              Subtotal Servicios Seleccionados: <strong className="text-slate-100 text-sm">{formatCLP(subtotalNeto)}</strong>
            </div>
          </div>

          {/* Tabla de Servicios */}
          <div className="rounded-xl border border-white/5 overflow-x-auto flex-1 bg-black/20">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px" }}>
                <tr>
                  <th className="px-3 py-3 w-8 text-center">Sel.</th>
                  <th className="px-3 py-3 font-semibold">Categoría</th>
                  <th className="px-3 py-3 font-semibold">PPU</th>
                  <th className="px-3 py-3 font-semibold">Fecha</th>
                  <th className="px-3 py-3 font-semibold">Horario</th>
                  <th className="px-3 py-3 font-semibold">Local</th>
                  <th className="px-3 py-3 font-semibold text-center">Puntos</th>
                  <th className="px-3 py-3 font-semibold">Asignado a</th>
                  <th className="px-2 py-3 text-center">V1</th>
                  <th className="px-2 py-3 text-center">SG1</th>
                  <th className="px-2 py-3 text-center">V2</th>
                  <th className="px-2 py-3 text-center">SG2</th>
                  <th className="px-2 py-3 text-center">V3</th>
                  <th className="px-2 py-3 text-center">SG3</th>
                  <th className="px-3 py-3 text-right">Valor Día</th>
                  <th className="px-3 py-3 text-right">Adicional</th>
                  <th className="px-3 py-3 text-right">Bono</th>
                  <th className="px-3 py-3 text-right font-bold text-emerald-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={18} className="text-center py-12 text-slate-500">
                      Cargando servicios en tiempo real...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="text-center py-12 text-slate-500">
                      No hay servicios que coincidan con las categorías o filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const isSelected = selectedRowIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleToggleRow(row.id)}
                        className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isSelected ? 'bg-brand-500/[0.04]' : 'opacity-60'}`}
                      >
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(row.id)}
                            className="rounded border-white/20 text-brand-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {row.categoria === 'coordinacion' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                              Supermercado
                            </span>
                          ) : row.categoria === 'paqueteria' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              Paquetería
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                              DHL
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-200">
                          {row.patente || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {formatDate(row.fecha) || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {row.horaInicio && row.horaTermino ? `${row.horaInicio} - ${row.horaTermino}` : (row.horaInicio || "—")}
                        </td>
                        <td className="px-3 py-2 text-slate-200 max-w-[130px] truncate" title={row.local}>
                          {row.local || "—"}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-slate-100">
                          {row.puntos || "0"}
                        </td>
                        <td className="px-3 py-2 text-slate-200 max-w-[140px] truncate" title={row.asignadoA}>
                          {row.asignadoA || "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.v1 || "—"}</td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.sg1 || "—"}</td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.v2 || "—"}</td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.sg2 || "—"}</td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.v3 || "—"}</td>
                        <td className="px-2 py-2 text-center text-slate-400">{row.sg3 || "—"}</td>
                        <td className="px-3 py-2 text-right text-slate-300">
                          {row.valorDia ? `$ ${parseMoneyValue(row.valorDia).toLocaleString("es-CL")}` : "$ 0"}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400">
                          {row.adicional ? `$ ${parseMoneyValue(row.adicional).toLocaleString("es-CL")}` : "$ 0"}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400">
                          {row.vueltas ? `$ ${parseMoneyValue(row.vueltas).toLocaleString("es-CL")}` : "$ 0"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-400">
                          {formatCLP(row.totalCalculado)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen / Totales Flotantes en Modo Gestión */}
          <div className="mt-4 p-4 rounded-xl border border-white/10 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
              <span>Servicios: <strong className="text-slate-100">{prefacturaRows.length}</strong></span>
              <span>Subtotal Neto: <strong className="text-slate-100">{formatCLP(subtotalNeto)}</strong></span>
              {descuentoMonto > 0 && (
                <span>Descuento ({descuentoPct}%): <strong className="text-red-400">-{formatCLP(descuentoMonto)}</strong></span>
              )}
              <span>Neto: <strong className="text-slate-100">{formatCLP(neto)}</strong></span>
              <span>IVA (19%): <strong className="text-slate-100">{formatCLP(iva)}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total a Pagar:</span>
              <span className="text-xl font-extrabold text-emerald-400">{formatCLP(totalPagar)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── VISTA DOCUMENTO: FORMATO EXACTO PLANTILLA DASAI ──────────────── */}
      {(vistaModo === 'documento' || true) && (
        <div className={`p-6 ${vistaModo === 'gestion' ? 'hidden' : 'block'}`}>
          <div
            id="prefactura-print-area"
            className="max-w-6xl mx-auto p-8 rounded-2xl bg-white text-slate-900 shadow-2xl font-sans"
            style={{ color: "#0f172a" }}
          >
            {/* Header Documento */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{emisor.nombre}</h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{emisor.subtitulo}</p>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>RUT empresa: <strong className="text-slate-900">{emisor.rut}</strong></p>
                  <p>Dirección: {emisor.direccion}</p>
                  <p>Tel: {emisor.telefono} · {emisor.correo}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest mb-3">
                  PREFACTURA
                </div>
                <table className="text-xs text-right ml-auto border-collapse">
                  <tbody>
                    <tr>
                      <td className="pr-3 font-semibold text-slate-600">N° prefactura:</td>
                      <td className="font-bold text-slate-900">{numPrefactura}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 font-semibold text-slate-600">Fecha emisión:</td>
                      <td className="font-semibold text-slate-900">{formatDate(fechaEmision)}</td>
                    </tr>
                    <tr>
                      <td className="pr-3 font-semibold text-slate-600">Plazo de pago:</td>
                      <td className="text-slate-900">{plazoDias} días</td>
                    </tr>
                    <tr>
                      <td className="pr-3 font-semibold text-slate-600">Fecha vencimiento:</td>
                      <td className="font-bold text-red-600">{formatDate(fechaVencimiento)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="py-4 border-b border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">DATOS DEL CLIENTE</div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p><span className="font-semibold text-slate-600">Razón social:</span> <strong className="text-slate-900">{cliente.razonSocial}</strong></p>
                  <p className="mt-1"><span className="font-semibold text-slate-600">RUT:</span> <strong className="text-slate-900">{cliente.rut}</strong></p>
                  <p className="mt-1"><span className="font-semibold text-slate-600">Giro:</span> {cliente.giro}</p>
                </div>
                <div>
                  <p><span className="font-semibold text-slate-600">Dirección:</span> {cliente.direccion}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-600">Contacto:</span> {cliente.contacto}</p>
                </div>
              </div>
            </div>

            {/* Detalle del Servicio */}
            <div className="py-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">DETALLE DEL SERVICIO</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                    <tr>
                      <th className="p-1 border-r border-slate-300">PPU</th>
                      <th className="p-1 border-r border-slate-300">Fecha</th>
                      <th className="p-1 border-r border-slate-300">H. Inicio</th>
                      <th className="p-1 border-r border-slate-300">H. Término</th>
                      <th className="p-1 border-r border-slate-300">Local</th>
                      <th className="p-1 border-r border-slate-300">Puntos</th>
                      <th className="p-1 border-r border-slate-300">Asignado a</th>
                      <th className="p-1 border-r border-slate-300">V1</th>
                      <th className="p-1 border-r border-slate-300">SG1</th>
                      <th className="p-1 border-r border-slate-300">V2</th>
                      <th className="p-1 border-r border-slate-300">SG2</th>
                      <th className="p-1 border-r border-slate-300">V3</th>
                      <th className="p-1 border-r border-slate-300">SG3</th>
                      <th className="p-1 border-r border-slate-300">V4</th>
                      <th className="p-1 border-r border-slate-300">SG4</th>
                      <th className="p-1 border-r border-slate-300">V5</th>
                      <th className="p-1 border-r border-slate-300">SG5</th>
                      <th className="p-1 border-r border-slate-300">Valor Día</th>
                      <th className="p-1 border-r border-slate-300">Adicional</th>
                      <th className="p-1 border-r border-slate-300">Bono</th>
                      <th className="p-1 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {prefacturaRows.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="p-1 border-r border-slate-200 font-mono font-bold text-center">{r.patente || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{formatDate(r.fecha)}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.horaInicio || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.horaTermino || "—"}</td>
                        <td className="p-1 border-r border-slate-200">{r.local || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center font-bold">{r.puntos || "0"}</td>
                        <td className="p-1 border-r border-slate-200">{r.asignadoA || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.v1 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.sg1 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.v2 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.sg2 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.v3 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.sg3 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.v4 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.sg4 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.v5 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-center">{r.sg5 || "—"}</td>
                        <td className="p-1 border-r border-slate-200 text-right">{r.valorDia ? `$ ${parseMoneyValue(r.valorDia).toLocaleString("es-CL")}` : "$ 0"}</td>
                        <td className="p-1 border-r border-slate-200 text-right">{r.adicional ? `$ ${parseMoneyValue(r.adicional).toLocaleString("es-CL")}` : "$ 0"}</td>
                        <td className="p-1 border-r border-slate-200 text-right">{r.vueltas ? `$ ${parseMoneyValue(r.vueltas).toLocaleString("es-CL")}` : "$ 0"}</td>
                        <td className="p-1 text-right font-bold text-slate-900">{formatCLP(r.totalCalculado)}</td>
                      </tr>
                    ))}
                    {/* Fila Total Detalle */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td colSpan={20} className="p-1 text-right border-r border-slate-300 uppercase">TOTAL DETALLE</td>
                      <td className="p-1 text-right text-slate-900">{formatCLP(subtotalNeto)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales y Liquidación */}
            <div className="py-4 border-t border-slate-200 flex justify-between items-start gap-8">
              <div className="w-1/2 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Observaciones:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 italic">
                  {observaciones || "Sin observaciones adicionales."}
                </p>
              </div>

              <div className="w-1/2">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">Subtotal neto:</td>
                      <td className="py-1 text-right font-semibold text-slate-900">{formatCLP(subtotalNeto)}</td>
                    </tr>
                    {descuentoMonto > 0 && (
                      <tr>
                        <td className="py-1 text-red-600 font-semibold">Descuento ({descuentoPct}%):</td>
                        <td className="py-1 text-right font-semibold text-red-600">-{formatCLP(descuentoMonto)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">Neto imponible:</td>
                      <td className="py-1 text-right font-semibold text-slate-900">{formatCLP(neto)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">IVA (19%):</td>
                      <td className="py-1 text-right font-semibold text-slate-900">{formatCLP(iva)}</td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 text-sm">
                      <td className="py-2 font-extrabold text-slate-950 uppercase tracking-wider">TOTAL A PAGAR:</td>
                      <td className="py-2 text-right font-extrabold text-emerald-600">{formatCLP(totalPagar)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Datos de Transferencia */}
            <div className="py-4 border-t border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">DATOS DE TRANSFERENCIA</div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block">Banco:</span>
                  <strong className="text-slate-900">{transferencia.banco}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipo de cuenta:</span>
                  <strong className="text-slate-900">{transferencia.tipoCuenta}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">N° de cuenta:</span>
                  <strong className="text-slate-900 font-mono">{transferencia.numCuenta}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Titular / RUT:</span>
                  <strong className="text-slate-900">{transferencia.titular} · {transferencia.rut}</strong>
                </div>
              </div>
            </div>

            {/* Aviso Legal */}
            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 italic">
              Documento informativo, no válido como documento tributario. Los valores se facturarán electrónicamente según lo acordado.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
