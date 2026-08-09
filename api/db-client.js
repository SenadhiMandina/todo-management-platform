import { createClient } from '@supabase/supabase-js';

console.log(
  "SUPABASE URL:",
  process.env.VITE_SUPABASE_URL
);

console.log(
  "SERVICE KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Exists" : "Missing"
);


const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;