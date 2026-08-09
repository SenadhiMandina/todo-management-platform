import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserMock = vi.fn();
vi.mock('../db-client.js', () => ({
  default: { auth: { getUser: (...args) => getUserMock(...args) } },
}));

let fakeFrom;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (...args) => fakeFrom(...args) }),
}));

import handler from '../todos/[id].js';

function mockRes() {
  const res = {};
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((body) => { res.body = body; return res; });
  res.setHeader = vi.fn();
  res.end = vi.fn();
  return res;
}

function chainable(result) {
  const chain = {};
  ['select', 'update', 'delete', 'eq'].forEach((m) => { chain[m] = () => chain; });
  chain.maybeSingle = () => Promise.resolve(result);
  chain.then = (resolve) => Promise.resolve(result).then(resolve);
  return chain;
}

describe('GET/PUT/DELETE /api/todos/:id', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    fakeFrom = vi.fn();
  });

  it('requires an id in the URL', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = { method: 'GET', headers: { authorization: 'Bearer t' }, query: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects unauthenticated requests with 401 before hitting the database', async () => {
    const req = { method: 'GET', headers: {}, query: { id: 'todo-1' } };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(fakeFrom).not.toHaveBeenCalled();
  });

  it("returns 404 when trying to access another user's todo (RLS-equivalent isolation)", async () => {
    // Simulate: todo exists but belongs to a different user_id, so the
    // `.eq('user_id', user.id)` filter (mirroring the RLS policy) finds nothing.
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    fakeFrom = vi.fn(() => chainable({ data: null, error: null }));

    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer good-token' },
      query: { id: 'someone-elses-todo' },
    };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates a todo the user owns (200)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const updated = { id: 'todo-1', user_id: 'user-1', title: 'Updated', status: 'completed' };
    fakeFrom = vi.fn(() => chainable({ data: updated, error: null }));

    const req = {
      method: 'PUT',
      headers: { authorization: 'Bearer good-token' },
      query: { id: 'todo-1' },
      body: { status: 'completed' },
    };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.status).toBe('completed');
  });

  it('rejects an invalid status value on update (400)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = {
      method: 'PUT',
      headers: { authorization: 'Bearer good-token' },
      query: { id: 'todo-1' },
      body: { status: 'archived' },
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deletes a todo the user owns (200)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    fakeFrom = vi.fn(() => chainable({ data: { id: 'todo-1' }, error: null }));

    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer good-token' },
      query: { id: 'todo-1' },
    };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 deleting a todo that doesn't belong to the user", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    fakeFrom = vi.fn(() => chainable({ data: null, error: null }));

    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer good-token' },
      query: { id: 'not-mine' },
    };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
