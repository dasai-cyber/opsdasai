"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, MapPin, Package, Car, CheckCircle2 } from "lucide-react";

export default function VueltaActivaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [vuelta, setVuelta] = useState<any>(null);
  const [observacion, setObservacion] = useState("");
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState("");

  useEffect(() => {
    loadActiveRoute();
  }, []);

  // Cronómetro
  useEffect(() => {
    if (!vuelta?.hora_partida) return;
    
    const interval = setInterval(() => {
      const start = new Date(vuelta.hora_partida).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTiempoTranscurrido(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [vuelta]);

  const loadActiveRoute = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/chofer/login");
      return;
    }

    // Buscar vuelta activa (estado = en_ruta)
    const { data, error } = await supabase
      .from("control_vueltas")
      .select(`
        *,
        tipo_carga:control_tipos_carga(nombre),
        vehiculo:control_vehiculos(patente, descripcion),
        punto_entrega:control_puntos_entrega(nombre, direccion)
      `)
      .eq("chofer_id", session.user.id)
      .eq("estado", "en_ruta")
      .single();

    if (error || !data) {
      // Si no hay ruta activa, lo devolvemos al inicio
      router.push("/chofer/inicio");
      return;
    }

    setVuelta(data);
    setLoading(false);
  };

  const handleTerminarRuta = async () => {
    if (!vuelta) return;
    setFinishing(true);

    try {
      // 1. Obtener GPS final
      let lat = null;
      let lng = null;
      let precision = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        precision = pos.coords.accuracy;
      } catch (err) {
        console.warn("GPS falló al terminar ruta", err);
      }

      // 2. Guardar
      const { error } = await supabase
        .from("control_vueltas")
        .update({
          estado: 'entregada',
          hora_entrega: new Date().toISOString(),
          entrega_lat: lat,
          entrega_lng: lng,
          entrega_precision_m: precision,
          observacion: observacion
        })
        .eq('id', vuelta.id);

      if (error) throw error;

      alert("¡Ruta finalizada con éxito!");
      router.push("/chofer/inicio");

    } catch (err: any) {
      console.error(err);
      alert("Error al finalizar: " + err.message);
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-500" size={32} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex flex-col items-center justify-center py-6 bg-brand-500/10 border border-brand-500/20 rounded-2xl mb-6">
        <p className="text-brand-400 font-bold text-sm tracking-widest uppercase mb-1">Tiempo en ruta</p>
        <h1 className="text-5xl font-mono text-white font-bold tracking-tight">
          {tiempoTranscurrido || "00:00:00"}
        </h1>
      </div>

      <div className="space-y-4 flex-1">
        
        {/* Detalles */}
        <div className="bg-[#1b1e24] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Vuelta Actual</p>
              <p className="text-white font-bold text-lg">#{vuelta?.numero_vuelta}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cantidad</p>
              <p className="text-white font-bold text-lg">{vuelta?.cantidad} un.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Package size={20} className="text-brand-400 flex-shrink-0" />
            <span className="font-medium">{vuelta?.tipo_carga?.nombre}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Car size={20} className="text-brand-400 flex-shrink-0" />
            <span className="font-medium font-mono">{vuelta?.vehiculo?.patente}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <MapPin size={20} className="text-brand-400 flex-shrink-0" />
            <span className="font-medium">{vuelta?.punto_entrega?.nombre}</span>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Observaciones (Opcional)</label>
          <textarea 
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: Cliente ausente, calle cerrada..."
            rows={3}
            className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

      </div>

      <button 
        onClick={handleTerminarRuta}
        disabled={finishing}
        className="w-full mt-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-5 rounded-2xl transition-transform active:scale-95 flex items-center justify-center text-xl shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)] disabled:opacity-70 disabled:scale-100"
      >
        {finishing ? (
          <Loader2 className="animate-spin" size={28} />
        ) : (
          <>
            <CheckCircle2 className="mr-2" size={26} />
            ENTREGUÉ
          </>
        )}
      </button>

    </div>
  );
}
