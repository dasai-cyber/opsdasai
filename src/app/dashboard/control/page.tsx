"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, Package, Car, MapPin, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function ControlVueltasAdminPage() {
  const [stats, setStats] = useState({ choferes: 0, vueltas: 0, vehiculos: 0, puntos: 0 });
  const [vueltas, setVueltas] = useState<any[]>([]);
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Obtener estadísticas
    const [
      { count: cChoferes },
      { count: cVueltas },
      { count: cVehiculos },
      { count: cPuntos }
    ] = await Promise.all([
      supabase.from("control_choferes").select("*", { count: 'exact', head: true }),
      supabase.from("control_vueltas").select("*", { count: 'exact', head: true }),
      supabase.from("control_vehiculos").select("*", { count: 'exact', head: true }),
      supabase.from("control_puntos_entrega").select("*", { count: 'exact', head: true })
    ]);

    setStats({
      choferes: cChoferes || 0,
      vueltas: cVueltas || 0,
      vehiculos: cVehiculos || 0,
      puntos: cPuntos || 0
    });

    // Obtener tabla de vueltas del día de hoy (o recientes)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data: rutas } = await supabase
      .from("control_vueltas")
      .select(`
        *,
        chofer:control_choferes(nombre, codigo),
        vehiculo:control_vehiculos(patente),
        tipo_carga:control_tipos_carga(nombre),
        punto_entrega:control_puntos_entrega(nombre)
      `)
      .gte("hora_partida", hoy.toISOString())
      .order("hora_partida", { ascending: true });

    if (rutas) {
      setVueltas(rutas);
      
      // Agrupar por Chofer y Vehículo para el día de hoy
      const grouped = rutas.reduce((acc: any, curr: any) => {
        const key = `${curr.chofer_id}-${curr.vehiculo_id}`;
        if (!acc[key]) {
          acc[key] = {
            chofer: curr.chofer,
            vehiculo: curr.vehiculo,
            fecha: curr.hora_partida,
            vueltas: [],
            totalPuntos: 0
          };
        }
        acc[key].vueltas.push(curr);
        acc[key].totalPuntos += curr.cantidad || 0;
        return acc;
      }, {});

      setGroupedData(Object.values(grouped));
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    if (vueltas.length === 0) return alert("No hay datos para exportar");

    const exportData = vueltas.map(v => {
      const horaPartida = new Date(v.hora_partida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const horaEntrega = v.hora_entrega ? new Date(v.hora_entrega).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "En ruta";
      
      let tiempoRuta = "";
      if (v.hora_entrega) {
        const diffMins = Math.floor((new Date(v.hora_entrega).getTime() - new Date(v.hora_partida).getTime()) / 60000);
        tiempoRuta = `${diffMins} min`;
      }

      return {
        "Fecha": new Date(v.hora_partida).toLocaleDateString(),
        "Chofer": v.chofer?.nombre,
        "Código": v.chofer?.codigo,
        "Vehículo": v.vehiculo?.patente,
        "Vuelta #": v.numero_vuelta,
        "Tipo Carga": v.tipo_carga?.nombre,
        "Cantidad": v.cantidad,
        "Punto Entrega": v.punto_entrega?.nombre,
        "Estado": v.estado === 'en_ruta' ? 'En ruta' : 'Entregada',
        "Hora Inicio": horaPartida,
        "Hora Fin": horaEntrega,
        "Tiempo": tiempoRuta,
        "Observaciones": v.observacion || "",
        "Distancia GPS (Km)": v.distancia_calculada_km ? v.distancia_calculada_km.toFixed(2) : ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rutas");
    XLSX.writeFile(workbook, `Reporte_Control_Vueltas_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Control de Vueltas</h1>
          <p className="text-slate-400">Monitoreo en tiempo real de salidas y entregas PWA</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-lg transition-colors"
        >
          <Download size={18} />
          Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1b1e24] p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
            <Users size={20} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{stats.choferes}</h2>
          <p className="text-slate-400 text-sm">Choferes Registrados</p>
        </div>
        <div className="bg-[#1b1e24] p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-400">
            <Package size={20} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{stats.vueltas}</h2>
          <p className="text-slate-400 text-sm">Vueltas Totales</p>
        </div>
        <div className="bg-[#1b1e24] p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-orange-400">
            <Car size={20} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{stats.vehiculos}</h2>
          <p className="text-slate-400 text-sm">Vehículos</p>
        </div>
        <div className="bg-[#1b1e24] p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
            <MapPin size={20} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{stats.puntos}</h2>
          <p className="text-slate-400 text-sm">Puntos de Entrega</p>
        </div>
      </div>

      <div className="bg-[#1b1e24] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Rutas de Hoy</h3>
          <button onClick={loadData} className="text-sm text-brand-400 hover:text-brand-300">
            Actualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#21242c] text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800">
                <th className="p-4 whitespace-nowrap">PPU</th>
                <th className="p-4 whitespace-nowrap">Fecha / Hora</th>
                <th className="p-4 whitespace-nowrap">Local / Destino</th>
                <th className="p-4 whitespace-nowrap">Puntos</th>
                <th className="p-4 whitespace-nowrap">Asignado A</th>
                <th className="p-4 whitespace-nowrap text-right">Vueltas Extras</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No hay rutas registradas el día de hoy.</td>
                </tr>
              ) : (
                groupedData.map((row, idx) => {
                  const localesUnicos = Array.from(new Set(row.vueltas.map((v: any) => v.punto_entrega?.nombre))).join(", ");

                  return (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-white font-bold font-mono">{row.vehiculo?.patente || "-"}</td>
                      <td className="p-4 text-slate-300">
                        {new Date(row.fecha).toLocaleDateString()}<br/>
                        <span className="text-xs text-slate-500">
                          {new Date(row.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">{localesUnicos || "-"}</td>
                      <td className="p-4 text-slate-300 font-mono text-center">{row.totalPuntos}</td>
                      <td className="p-4 text-white font-bold uppercase text-xs">{row.chofer?.nombre}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5 max-w-[300px] ml-auto">
                          {row.vueltas.map((v: any, vIdx: number) => {
                            const isEnRuta = v.estado === 'en_ruta';
                            return (
                              <span 
                                key={v.id} 
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                  isEnRuta 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                                    : 'bg-green-500/10 text-[#00ff00] border-green-500/30'
                                }`}
                              >
                                V{v.numero_vuelta}: {isEnRuta ? 'EN RUTA' : 'OK'} ({v.tipo_carga?.nombre?.substring(0,2) || 'SG'}: {v.cantidad})
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
