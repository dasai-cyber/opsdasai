import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para informes (puede apuntar a la misma BD unificada o a una separada)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_INFORME_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_INFORME_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseInforme = createClient(supabaseUrl, supabaseAnonKey);

