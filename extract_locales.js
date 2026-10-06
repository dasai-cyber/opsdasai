const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function extractLocales() {
  console.log("Obteniendo registros de servicios...");
  const { data: servicios, error } = await supabase.from('servicios').select('data');
  if (error) {
    console.error(error);
    return;
  }

  const uniqueLocales = new Set();
  
  servicios.forEach(r => {
    const local = r.data?.local;
    if (local && typeof local === 'string' && local.trim() !== '') {
      // Clean up local names to avoid duplicates like "L45", "L45 Maipu", "l45"
      const upperLocal = local.trim().toUpperCase();
      if (upperLocal.includes("MAIPU")) uniqueLocales.add("L45 MAIPU");
      else if (upperLocal.includes("HUECHU")) uniqueLocales.add("L41 HUECHURABA");
      else if (upperLocal.includes("REINA")) uniqueLocales.add("L95 LA REINA");
      else if (upperLocal.includes("WALMART")) uniqueLocales.add("WALMART PAQUETERIA");
      else uniqueLocales.add(upperLocal);
    }
  });

  const localesArr = Array.from(uniqueLocales);
  console.log("Locales únicos encontrados:", localesArr);

  console.log("Borrando puntos antiguos de prueba...");
  await supabase.from('control_puntos_entrega').delete().neq('id', -1);

  console.log("Insertando locales en control_puntos_entrega...");
  const toInsert = localesArr.map((nombre, idx) => ({
    id: idx + 1,
    nombre: nombre,
    direccion: 'Extraído del sistema',
    activo: true
  }));

  const { error: insertErr } = await supabase.from('control_puntos_entrega').upsert(toInsert);
  
  if (insertErr) {
    console.error("Error al insertar:", insertErr);
  } else {
    console.log("¡Locales migrados exitosamente al catálogo PWA!");
  }
}

extractLocales();
