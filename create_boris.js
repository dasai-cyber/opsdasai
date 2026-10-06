const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  console.log("Creando usuario auth...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'boris.perez@dasai.cl',
    password: 'Boris2026!.',
    email_confirm: true
  });

  if (authError) {
    console.error("Error Auth:", authError);
    return;
  }

  console.log("Usuario auth creado:", authData.user.id);

  console.log("Insertando en profiles...");
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    correo: 'boris.perez@dasai.cl',
    nombre: 'Boris Perez',
    rol: 'administrador'
  });

  if (profileError) {
    console.error("Error Profiles:", profileError);
  } else {
    console.log("Perfil administrador creado con éxito.");
  }
}

createUser();
