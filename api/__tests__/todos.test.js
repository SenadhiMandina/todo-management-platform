import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the shared service-role client used for JWT verification
// (equivalent to mocking Laravel's Auth::guard() resolution in a unit test).
const getUserMock = vi.fn();
vi.mock('../db-client.js', () => ({
  default: { auth: { getUser: (...args) => getUserMock(...args) } },
}));

// Mock the request-scoped client created inside the handler for the actual
// data operations against the `todos` table.
let fakeFrom;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (...args) => fakeFrom(...args) }),
}));

import handler from '../todos.js';

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((body) => { res.body = body; return res; });
  res.setHeader = vi.fn();
  res.end = vi.fn();
  return res;
}

function chainable(result) {
  const chain = {};
  ['select', 'insert', 'eq', 'or', 'order'].forEach((m) => { chain[m] = () => chain; });
  chain.single = () => Promise.resolve(result);
  chain.then = (resolve) => Promise.resolve(result).then(resolve);
  return chain;
}

describe('GET/POST /api/todos', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    fakeFrom = vi.fn();
  });

  it('rejects requests with no Authorization header (401)', async () => {
    const req = { method: 'GET', headers: {}, query: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects requests with an invalid/expired token (401)', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
    const req = { method: 'GET', headers: { authorization: 'Bearer bad-token' }, query: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns only the authenticated user\'s todos on GET', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const todos = [{ id: 't1', user_id: 'user-1', title: 'Test todo', status: 'pending' }];
    fakeFrom = vi.fn(() => chainable({ data: todos, error: null }));

    const req = { method: 'GET', headers: { authorization: 'Bearer good-token' }, query: {} };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual(todos);
  });

  it('rejects an invalid status filter with 400', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer good-token' },
      query: { status: 'archived' },
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects creating a todo with a title shorter than 3 characters (400)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { title: 'ab' },
      query: {},
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.errors.title).toBeDefined();
  });

  it('rejects creating a todo with a missing title (400)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: {},
      query: {},
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates a todo scoped to the authenticated user (201)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const created = { id: 'new-id', user_id: 'user-1', title: 'Buy milk', status: 'pending' };
    fakeFrom = vi.fn(() => chainable({ data: created, error: null }));

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer good-token' },
      body: { title: 'Buy milk', description: '' },
      query: {},
    };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.user_id).toBe('user-1');
    expect(res.body.status).toBe('pending');
  });

  it('rejects unsupported HTTP methods with 405', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = { method: 'PATCH', headers: { authorization: 'Bearer good-token' }, query: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
