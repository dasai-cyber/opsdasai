"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Play, Loader2 } from "lucide-react";

export default function InicioChoferPage() {
  const router = useRouter();
  const [chofer, setChofer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Catálogos
  const [tiposCarga, setTiposCarga] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [puntos, setPuntos] = useState<any[]>([]);

  // Formulario
  const [numeroVuelta, setNumeroVuelta] = useState<number>(1);
  const [tipoCargaId, setTipoCargaId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [puntoId, setPuntoId] = useState("");

  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        router.push("/chofer/login");
        return;
      }

      // Datos del chofer
      const { data: choferData, error: choferError } = await supabase
        .from("control_choferes")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (choferError) {
        console.error("Error cargando chofer:", choferError);
        setErrorMsg("Error cargando perfil: " + choferError.message);
      }

      if (choferData) {
        setChofer(choferData);
      } else {
        setErrorMsg("Perfil no encontrado para este usuario.");
      }

      // Obtener catálogos
      const [ { data: tc }, { data: vh }, { data: pt }, { data: activa } ] = await Promise.all([
        supabase.from("control_tipos_carga").select("*").eq("activo", true),
        supabase.from("control_vehiculos").select("*").eq("activo", true),
        supabase.from("control_puntos_entrega").select("*").eq("activo", true),
        supabase.from("control_vueltas").select("id").eq("chofer_id", session.user.id).eq("estado", "en_ruta").maybeSingle()
      ]);

      if (activa) {
        router.push("/chofer/vuelta-activa");
        return;
      }

      if (tc) setTiposCarga(tc);
      if (vh) {
        setVehiculos(vh);
        if (choferData?.patente) {
          const found = vh.find(v => v.patente === choferData.patente);
          if (found) setVehiculoId(found.id.toString());
        }
      }
      if (pt) setPuntos(pt);

      const hoy = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("control_vueltas")
        .select("*", { count: 'exact', head: true })
        .eq("chofer_id", session.user.id)
        .gte("hora_partida", `${hoy}T00:00:00Z`);
      
      setNumeroVuelta((count || 0) + 1);
    } catch (err: any) {
      setErrorMsg("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/chofer/login");
  };

  const handleIniciarPartida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoCargaId || !cantidad || !vehiculoId || !puntoId) {
      alert("Por favor completa todos los campos del formulario.");
      return;
    }

    setSaving(true);

    try {
      // 1. Obtener coordenadas
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
        console.warn("No se pudo obtener el GPS", err);
        // La especificación dice: Si el GPS falla, permitir continuar con null (no bloquear)
      }

      // 2. Crear UUID en el cliente
      const newId = crypto.randomUUID();

      // 3. Guardar en Supabase
      const { error } = await supabase.from("control_vueltas").insert({
        id: newId,
        chofer_id: chofer.id,
        vehiculo_id: parseInt(vehiculoId),
        numero_vuelta: numeroVuelta,
        tipo_carga_id: parseInt(tipoCargaId),
        cantidad: parseInt(cantidad),
        punto_entrega_id: parseInt(puntoId),
        estado: 'en_ruta',
        hora_partida: new Date().toISOString(),
        partida_lat: lat,
        partida_lng: lng,
        partida_precision_m: precision,
        creado_offline: false
      });

      if (error) throw error;

      router.push("/chofer/vuelta-activa");
    } catch (err: any) {
      console.error(err);
      alert("Error al iniciar partida: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!chofer && !errorMsg)) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-500" size={32} />
    </div>
  );

  if (errorMsg) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400">
        {errorMsg}
      </div>
      <button onClick={handleLogout} className="text-slate-400 hover:text-white underline">
        Cerrar sesión y volver a intentar
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-slate-400 text-sm">Chofer Activo,</p>
          <h1 className="text-xl font-bold text-white truncate max-w-[200px]">{chofer.nombre}</h1>
        </div>
        <button onClick={handleLogout} className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white">
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 mb-6">
        <h2 className="text-brand-400 font-bold text-sm uppercase tracking-wider mb-1">Nueva Ruta</h2>
        <p className="text-white text-2xl font-bold">Vuelta #{numeroVuelta}</p>
      </div>

      <form onSubmit={handleIniciarPartida} className="flex-1 flex flex-col space-y-5">
        
        {/* Tipo de Carga */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Tipo de Carga</label>
          <select 
            value={tipoCargaId} onChange={(e) => setTipoCargaId(e.target.value)} required
            className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-500 appearance-none"
          >
            <option value="">Selecciona...</option>
            {tiposCarga.map(tc => (
              <option key={tc.id} value={tc.id}>{tc.nombre}</option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Cantidad</label>
          <input 
            type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required
            placeholder="Ej: 4"
            className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Vehículo */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Vehículo (Patente)</label>
          <select 
            value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} required
            disabled={!!chofer?.patente}
            className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-500 appearance-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona...</option>
            {vehiculos.map(v => (
              <option key={v.id} value={v.id}>{v.patente} {v.descripcion ? `(${v.descripcion})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Punto de Entrega */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Punto de Entrega</label>
          <select 
            value={puntoId} onChange={(e) => setPuntoId(e.target.value)} required
            className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-500 appearance-none"
          >
            <option value="">Selecciona...</option>
            {puntos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-h-[2rem]"></div>

        {/* Botón de envío */}
        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-5 rounded-2xl transition-transform active:scale-95 flex items-center justify-center text-xl shadow-[0_0_30px_-10px_rgba(34,197,94,0.4)] disabled:opacity-70 disabled:scale-100"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={28} />
          ) : (
            <>
              <Play className="mr-2" size={24} fill="currentColor" />
              INICIAR PARTIDA
            </>
          )}
        </button>
        
      </form>
    </div>
  );
}
