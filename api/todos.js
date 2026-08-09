import { createClient } from '@supabase/supabase-js';
import supabase from './db-client.js';

// ---------------------------------------------------------------------------
// Auth "middleware" — resolves the caller's identity from the Bearer JWT and
// returns a request-scoped Supabase client (anon key + the caller's own JWT)
// so every query below runs *as that user* in Postgres. Combined with the
// Row Level Security policies on `todos` (auth.uid() = user_id), this is the
// direct equivalent of Laravel's `auth:sanctum` middleware: unauthenticated
// or invalid-token requests never reach the handler logic below.
// ---------------------------------------------------------------------------
async function getAuthedContext(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized: missing bearer token' };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Unauthorized: invalid or expired token' };

  const scopedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  return { user, client: scopedClient };
}

function validateTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return 'Title is required';
  }
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters';
  }
  if (title.trim().length > 150) {
    return 'Title must be under 150 characters';
  }
  return null;
}

// Collection endpoint: GET /api/todos (list, search, filter) and
// POST /api/todos (create). Single-resource operations (GET/PUT/DELETE by id)
// live in ./todos/[id].js to mirror Laravel's `apiResource` route split
// between index()/store() and show()/update()/destroy().
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, client, error: authError } = await getAuthedContext(req);
  if (authError) return res.status(401).json({ success: false, message: authError });

  try {
    if (req.method === 'GET') {
      const { q, status } = req.query;

      if (status && !['pending', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }

      let query = client.from('todos').select('*').eq('user_id', user.id);
      if (status) query = query.eq('status', status);
      if (q && q.trim()) {
        const term = q.trim().replace(/[%_]/g, '\\$&');
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description } = req.body || {};
      const titleError = validateTitle(title);
      if (titleError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: { title: titleError },
        });
      }

      const { data, error } = await client
        .from('todos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description ? String(description).trim() : null,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    console.error('API error (/api/todos):', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}

export { getAuthedContext, validateTitle };
