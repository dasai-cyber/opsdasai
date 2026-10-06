"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AvisoGpsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const aceptarAviso = async () => {
    setLoading(true);
    
    // Obtener usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/chofer/login");
      return;
    }

    // Actualizar registro del chofer
    const { error } = await supabase
      .from("control_choferes")
      .update({ aviso_gps_aceptado_en: new Date().toISOString() })
      .eq("id", session.user.id);

    if (error) {
      console.error(error);
      alert("Hubo un error al guardar tu preferencia. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Continuar a inicio
    router.push("/chofer/inicio");
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center">
        
        <div className="w-24 h-24 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-500/20">
          <MapPin size={48} className="text-brand-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Uso de Ubicación</h1>
        
        <p className="text-slate-400 text-lg mb-6 leading-relaxed text-left">
          Para registrar correctamente tus vueltas, la aplicación necesita 
          saber tu ubicación GPS <strong className="text-white">solo en dos momentos exactos:</strong>
        </p>

        <ul className="text-left space-y-4 mb-10">
          <li className="flex items-start">
            <span className="bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 shrink-0 mt-0.5">1</span>
            <span className="text-slate-300">Al presionar el botón de <strong className="text-white">Iniciar Partida</strong>.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 shrink-0 mt-0.5">2</span>
            <span className="text-slate-300">Al presionar el botón de <strong className="text-white">Entregué</strong>.</span>
          </li>
        </ul>

        <div className="bg-[#1b1e24] border border-white/5 p-4 rounded-xl flex items-start text-left mb-8">
          <ShieldCheck className="text-green-500 mr-3 shrink-0 mt-0.5" size={24} />
          <p className="text-sm text-slate-400">
            No te rastrearemos en segundo plano ni mientras conduces. Esto ayuda a ahorrar la batería de tu celular.
          </p>
        </div>

      </div>

      <div className="pt-4 pb-8">
        <button
          onClick={aceptarAviso}
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl transition-colors text-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            "Entendido, Acepto"
          )}
        </button>
      </div>
    </div>
  );
}
