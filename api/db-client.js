import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE URL:", supabaseUrl);
console.log(
  "SUPABASE KEY:",
  supabaseKey ? "FOUND" : "MISSING"
);

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    global: {
      fetch: async (url, options) => {
        const res = await fetch(url, options);

        if (!res.ok && res.status >= 500) {
          triggerRestore();
        }

        return res;
      },
    },
  }
);

export default supabase;