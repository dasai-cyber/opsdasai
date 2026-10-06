const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixMigration() {
  console.log("Limpiando auth.users antiguos...");
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  for (const u of users) {
    if (u.email.endsWith('@choferes.app')) {
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  console.log("Limpiando control_choferes...");
  await supabase.from('control_choferes').delete().neq('codigo', 'dummy');

  console.log("Ejecutando migración de nuevo...");
  const { data: tecnicos } = await supabase.from('tecnicos').select('*').eq('data->>status', 'disponible');

  for (const tech of tecnicos) {
    const data = tech.data || {};
    const num = tech.tech_number || Math.floor(Math.random() * 1000);
    const codigo = `CH-${String(num).padStart(3, '0')}`;
    
    let rutClean = (data.rut || "").replace(/[^0-9]/g, '');
    let pin = rutClean.substring(0, 4);
    if (pin.length < 4) pin = "123456"; 
    pin = pin.padEnd(6, '0');

    const email = `${codigo.toLowerCase()}@choferes.app`;
    
    console.log(`Creando ${codigo}...`);
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: pin,
      email_confirm: true
    });

    if (authData?.user) {
      await supabase.from('control_choferes').insert({
        id: authData.user.id,
        codigo: codigo,
        nombre: data.name,
        activo: true,
        patente: data.patente ? data.patente.trim().toUpperCase() : null
      });
    } else {
      console.error("Error Auth:", authErr);
    }
  }

  console.log("¡Migración reparada exitosamente!");
}

fixMigration();
