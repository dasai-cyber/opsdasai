import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string") {
    const trimmed = date.trim();
    if (!trimmed) return "";
    
    // YYYY-MM-DD or YYYY/MM/DD
    const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, "0");
      const day = ymd[3].padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
    
    // DD-MM-YYYY or DD/MM/YYYY
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      return `${day}/${month}/${year}`;
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    return trimmed;
  }
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return "";
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return typeof date === "string" ? date : "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    operativo: "text-brand-400",
    falla: "text-red-400",
    mantencion: "text-amber-400",
    traslado: "text-brand-400",
    creada: "text-slate-400",
    asignada: "text-brand-400",
    "en ruta": "text-brand-400",
    "en proceso": "text-amber-400",
    pausada: "text-orange-400",
    finalizada: "text-brand-400",
    reprogramada: "text-purple-400",
    cancelada: "text-red-400",
    disponible: "text-brand-400",
    offline: "text-slate-500",
    trabajando: "text-amber-400",
  };
  return colors[status.toLowerCase()] ?? "text-slate-400";
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    operativo: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    falla: "bg-red-500/10 text-red-400 border-red-500/20",
    mantencion: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    traslado: "bg-brand-400/10 text-brand-400 border-brand-400/20",
    creada: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    asignada: "bg-brand-400/10 text-brand-400 border-brand-400/20",
    "en ruta": "bg-brand-400/10 text-brand-400 border-brand-400/20",
    "en proceso": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    pausada: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    finalizada: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    reprogramada: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cancelada: "bg-red-500/10 text-red-400 border-red-500/20",
    disponible: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    offline: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    trabajando: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "en ruta (tec)": "bg-brand-400/10 text-brand-400 border-brand-400/20",
    alta: "bg-red-500/10 text-red-400 border-red-500/20",
    media: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    baja: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    critica: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return colors[status.toLowerCase()] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}
