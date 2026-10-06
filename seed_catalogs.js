const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCatalogs() {
  console.log("Insertando catálogos de prueba...");
  
  await supabase.from('control_tipos_carga').upsert([
    { id: 1, nombre: 'SG (PAQUETES)', activo: true },
    { id: 2, nombre: 'CARGA GENERAL', activo: true }
  ]);

  await supabase.from('control_vehiculos').upsert([
    { id: 1, patente: 'AB-CD-12', descripcion: 'Furgón Blanco', activo: true },
    { id: 2, patente: 'ZY-XW-98', descripcion: 'Camión Cerrado', activo: true }
  ]);

  await supabase.from('control_puntos_entrega').upsert([
    { id: 1, nombre: 'Bodega Central', direccion: 'Avenida Siempre Viva 123', lat: -33.4372, lng: -70.6506, activo: true },
    { id: 2, nombre: 'Sucursal Norte', direccion: 'Calle Falsa 456', lat: -33.4000, lng: -70.6000, activo: true }
  ]);

  console.log("¡Catálogos insertados!");
}

seedCatalogs();
