"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, KeyRound, Loader2 } from "lucide-react";

export default function ChoferLoginPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !pin) {
      setError("Por favor ingresa tu código y PIN.");
      return;
    }

    setLoading(true);
    setError("");

    // Usamos el email sintético acordado en la estructura
    const emailSintetico = `${codigo.toLowerCase().trim()}@choferes.app`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailSintetico,
      password: pin,
    });

    if (authError) {
      console.error(authError);
      setError("Código o PIN incorrecto. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    // Verificar si ya aceptó el GPS (redireccionar según eso)
    const { data: choferData } = await supabase
      .from("control_choferes")
      .select("aviso_gps_aceptado_en")
      .eq("codigo", codigo.toLowerCase().trim())
      .single();

    if (choferData && !choferData.aviso_gps_aceptado_en) {
      router.push("/aviso-gps"); // Crearemos esta página pronto
    } else {
      router.push("/inicio");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-500/10 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 w-full">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center">
            <MapPin size={32} strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Control de Vueltas</h1>
          <p className="text-slate-400 text-sm">Ingresa con tu código asignado</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Código de Chofer
            </label>
            <input
              type="text"
              className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Ej: CH-001"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              PIN (Contraseña)
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full bg-[#1b1e24] border border-slate-800 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-brand-500 transition-colors tracking-widest"
                placeholder="••••"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
              <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl transition-colors text-lg mt-4 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={24} />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
