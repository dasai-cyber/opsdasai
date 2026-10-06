const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log("Obteniendo tecnicos...");
  const { data: tecnicos, error } = await supabase.from('tecnicos').select('*').eq('data->>status', 'disponible');
  
  if (error) {
    console.error("Error obteniendo tecnicos:", error);
    return;
  }

  console.log(`Migrando ${tecnicos.length} choferes...`);

  // Primero migrar las patentes
  const patentes = [...new Set(tecnicos.map(t => t.data?.patente).filter(p => p && p.trim() !== ''))];
  
  for (const patente of patentes) {
    // Check si existe
    const { data: exist } = await supabase.from('control_vehiculos').select('id').eq('patente', patente.trim().toUpperCase()).single();
    if (!exist) {
      await supabase.from('control_vehiculos').insert({ patente: patente.trim().toUpperCase(), descripcion: 'Vehículo importado' });
    }
  }

  // Ahora migrar choferes
  for (const tech of tecnicos) {
    const data = tech.data || {};
    const num = tech.tech_number || Math.floor(Math.random() * 1000);
    const codigo = `CH-${String(num).padStart(3, '0')}`;
    
    // Sacar primeros 4 digitos del rut
    let rutClean = (data.rut || "").replace(/[^0-9]/g, '');
    let pin = rutClean.substring(0, 4);
    if (pin.length < 4) pin = "123456"; 
    // Supabase needs minimum 6 chars for password!
    pin = pin.padEnd(6, '0');

    const email = `${codigo.toLowerCase()}@choferes.app`;
    
    console.log(`Procesando ${data.name} -> Codigo: ${codigo}, PIN: ${pin}, Patente: ${data.patente}`);

    // Auth
    let userId = null;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: pin,
      email_confirm: true
    });

    if (authErr && authErr.message.includes('already registered')) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const u = usersData.users.find(x => x.email === email);
      if (u) userId = u.id;
    } else if (authData?.user) {
      userId = authData.user.id;
    }

    if (userId) {
      const { error: insertErr } = await supabase.from('control_choferes').upsert({
        id: userId,
        codigo: codigo,
        nombre: data.name,
        activo: true,
        patente: data.patente ? data.patente.trim().toUpperCase() : null
      });
      if (insertErr) console.error("Error insertando control_choferes:", insertErr);
    }
  }

  console.log("¡Migración completa!");
}

migrate();
