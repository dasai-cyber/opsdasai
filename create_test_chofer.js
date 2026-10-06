const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestChofer() {
  const codigo = "CH-001";
  const pin = "123456";
  const email = `${codigo.toLowerCase()}@choferes.app`;

  console.log(`Creando usuario en auth con email: ${email} ...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: pin,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      console.log("El usuario auth ya existe. Ignorando...");
    } else {
      console.error("Error Auth:", authError);
      return;
    }
  }

  // Get user ID
  let userId = authData?.user?.id;
  if (!userId) {
    // try to find it
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData.users.find(u => u.email === email);
    if (user) userId = user.id;
  }

  if (!userId) {
    console.error("No se pudo obtener el ID del usuario.");
    return;
  }

  console.log("Insertando en control_choferes...");
  const { error: profileError } = await supabase.from('control_choferes').insert({
    id: userId,
    codigo: codigo,
    nombre: 'Chofer de Prueba',
    activo: true
  });

  if (profileError) {
    if (profileError.code === '23505') { // unique violation
       console.log("El chofer ya existe en control_choferes.");
    } else {
       console.error("Error al insertar en control_choferes:", profileError);
    }
  } else {
    console.log(`¡Chofer de prueba creado con éxito! Código: ${codigo} | PIN: ${pin}`);
  }
}

createTestChofer();
