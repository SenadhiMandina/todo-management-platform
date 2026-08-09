// Shared helper used by the API route tests to fake the Supabase
// query-builder's fluent/chainable interface (.from().select().eq()...)
// while still being awaitable, exactly like the real supabase-js client.
export function createChainableResult(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'eq', 'or', 'order', 'limit',
  ];
  for (const m of methods) {
    chain[m] = () => chain;
  }
  chain.single = () => Promise.resolve(result);
  chain.maybeSingle = () => Promise.resolve(result);
  // Make the chain itself awaitable (mirrors supabase-js's PostgrestBuilder,
  // which resolves when you `await` a chain without `.single()`).
  (chain as { then: unknown }).then = (
    resolve: (v: typeof result) => void,
    reject: (e: unknown) => void
  ) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

export function createFakeSupabaseClient(result: { data: unknown; error: unknown }) {
  return {
    from: () => createChainableResult(result),
  };
}
