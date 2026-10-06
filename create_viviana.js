require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdmin() {
  const email = 'viviana.silva@dasai.cl';
  const password = 'Viviana2026!.';
  const name = 'Viviana Silva';
  const role = 'administrador';

  console.log(`Creating user ${email}...`);
  
  // 1. Auth create user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (userError) {
    console.error('Error creating user auth:', userError);
    return;
  }
  
  console.log('User created in auth:', user.user.id);

  // 2. Add role in profiles table
  const { error: dbError } = await supabase
    .from('profiles')
    .insert({
      id: user.user.id,
      nombre: name,
      correo: email,
      rol: role
    });

  if (dbError) {
    console.error('Error adding user to public.profiles table:', dbError);
    return;
  }

  console.log('User added to profiles table successfully.');
}

createAdmin();
