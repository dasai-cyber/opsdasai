import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function check() {
  // Get all auth users
  const { data: { users }, error } = await supabase.auth.admin?.listUsers() 
    ? await (supabase.auth as any).admin.listUsers()
    : { data: { users: [] }, error: null };
  
  if (error) {
    console.log("Admin API not available with anon key, trying profiles directly...");
  }
  
  // Check existing profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log("Profiles:", JSON.stringify(profiles, null, 2));
  
  // Get all auth users via admin (need service key)
  console.log("\nNeed service role key to list users...");
}
check();
