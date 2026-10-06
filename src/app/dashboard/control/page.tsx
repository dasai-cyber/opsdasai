"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Truck, Package, MapPin, Loader2 } from "lucide-react";

export default function ControlDashboardPage() {
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    choferesActivos: 0,
    vueltasHoy: 0,
    vehiculos: 0,
    puntos: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    // Para simplificar esta primera versión, solo contamos totales
    const [
      { count: choferesCount },
      { count: vehiculosCount },
      { count: puntosCount },
      { count: vueltasCount }
    ] = await Promise.all([
      supabase.from("control_choferes").select("*", { count: "exact", head: true }),
      supabase.from("control_vehiculos").select("*", { count: "exact", head: true }),
      supabase.from("control_puntos_entrega").select("*", { count: "exact", head: true }),
      supabase.from("control_vueltas").select("*", { count: "exact", head: true })
    ]);

    setStats({
      choferesActivos: choferesCount || 0,
      vehiculos: vehiculosCount || 0,
      puntos: puntosCount || 0,
      vueltasHoy: vueltasCount || 0
    });
    setLoading(false);
  };

  return (
    <div className="p-8 pb-32 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Control de Vueltas</h1>
          <p className="text-slate-400">Monitoreo de entregas PWA</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1b1e24] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.choferesActivos}</h3>
              <p className="text-slate-400 text-sm">Choferes Registrados</p>
            </div>

            <div className="bg-[#1b1e24] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Package size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.vueltasHoy}</h3>
              <p className="text-slate-400 text-sm">Vueltas Totales</p>
            </div>

            <div className="bg-[#1b1e24] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Truck size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.vehiculos}</h3>
              <p className="text-slate-400 text-sm">Vehículos</p>
            </div>

            <div className="bg-[#1b1e24] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.puntos}</h3>
              <p className="text-slate-400 text-sm">Puntos de Entrega</p>
            </div>
          </div>

          <div className="bg-[#1b1e24] border border-white/5 rounded-2xl p-8 text-center mt-8">
            <h2 className="text-xl font-bold text-white mb-2">Módulo en Construcción</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              El panel de administración para ver la tabla de registros, el mapa en tiempo real y 
              administrar los catálogos está siendo programado.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
