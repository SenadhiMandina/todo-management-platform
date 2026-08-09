import { createClient } from '@supabase/supabase-js';
import supabase from '../db-client.js';

// Same auth resolution as api/todos.js — duplicated intentionally (no shared
// module state across serverless functions) rather than imported, since each
// Vercel function is bundled and deployed independently.
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
  if (!title || typeof title !== 'string' || !title.trim()) return 'Title is required';
  if (title.trim().length < 3) return 'Title must be at least 3 characters';
  if (title.trim().length > 150) return 'Title must be under 150 characters';
  return null;
}

// Single-resource endpoint: GET /api/todos/:id, PUT /api/todos/:id,
// DELETE /api/todos/:id — the direct equivalent of Laravel's
// show()/update()/destroy() resource controller methods.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: 'Todo id is required in the URL' });

  const { user, client, error: authError } = await getAuthedContext(req);
  if (authError) return res.status(401).json({ success: false, message: authError });

  try {
    if (req.method === 'GET') {
      // .eq('user_id', user.id) is a defense-in-depth check on top of RLS:
      // a request for another user's todo id returns 404, never someone
      // else's data — whether or not RLS is misconfigured.
      const { data, error } = await client
        .from('todos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: 'Todo not found' });
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const { title, description, status } = req.body || {};

      if (status !== undefined && !['pending', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      if (title !== undefined) {
        const titleError = validateTitle(title);
        if (titleError) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: { title: titleError },
          });
        }
      }

      const updates = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description ? String(description).trim() : null;
      if (status !== undefined) updates.status = status;

      const { data, error } = await client
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: 'Todo not found' });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { data, error } = await client
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: 'Todo not found' });
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    console.error('API error (/api/todos/[id]):', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}

export { getAuthedContext, validateTitle };
