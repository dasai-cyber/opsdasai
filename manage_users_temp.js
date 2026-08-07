const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const emails = [
  'jorgefernando.urra@atmservicios.cl',
  'alberto.retamal@atmservicios.cl',
  'matias.urra@atmservicios.cl'
];

async function check() {
  console.log("Checking profiles table...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, correo, rol');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("All profiles:", data);
  }
}

check();
