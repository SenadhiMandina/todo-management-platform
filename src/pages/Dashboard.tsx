import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ClipboardList, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import FilterTabs, { type FilterValue } from '../components/FilterTabs';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import type { Todo, TodoInput } from '../types/todo';

export default function Dashboard() {
  const { session } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const token = session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [session]);

  const fetchTodos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/todos?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load todos');
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [session, search, filter, authHeaders]);

  useEffect(() => {
    const timeout = setTimeout(fetchTodos, 250);
    return () => clearTimeout(timeout);
  }, [fetchTodos]);

  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  useEffect(() => {
    if (!session) return;
    fetch('/api/todos', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAllTodos(data))
      .catch(() => {});
  }, [session, authHeaders, todos]);

  const counts = useMemo(
    () => ({
      all: allTodos.length,
      pending: allTodos.filter((t) => t.status === 'pending').length,
      completed: allTodos.filter((t) => t.status === 'completed').length,
    }),
    [allTodos]
  );

  const handleCreate = async (input: TodoInput) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create todo');
    await fetchTodos();
  };

  const handleUpdate = async (input: TodoInput) => {
    if (!editingTodo) return;
    const res = await fetch(`/api/todos/${editingTodo.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to update todo');
    await fetchTodos();
  };

  const handleToggle = async (todo: Todo) => {
    const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t)));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchTodos();
    } catch {
      setError('Failed to update todo status');
      fetchTodos();
    }
  };

  const handleDelete = async () => {
    if (!deletingTodo) return;
    try {
      const res = await fetch(`/api/todos/${deletingTodo.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete todo');
      setDeletingTodo(null);
      await fetchTodos();
    } catch {
      setError('Failed to delete todo');
      setDeletingTodo(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Todos</h1>
            <p className="mt-1 text-sm text-slate-400">
              {counts.pending} pending &middot; {counts.completed} completed
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTodo(null);
              setFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            New Todo
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} />
          <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <LoadingSpinner label="Loading your todos..." />
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <ClipboardList className="h-10 w-10 text-slate-600" />
              <p className="text-slate-400">
                {search || filter !== 'all' ? 'No todos match your search/filter.' : 'No todos yet. Create your first one!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={(t) => {
                    setEditingTodo(t);
                    setFormOpen(true);
                  }}
                  onDelete={(t) => setDeletingTodo(t)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <TodoForm
        key={formOpen ? editingTodo?.id ?? 'new' : 'closed'}
        open={formOpen}
        initial={editingTodo}
        onClose={() => setFormOpen(false)}
        onSubmit={editingTodo ? handleUpdate : handleCreate}
      />

      <ConfirmModal
        open={!!deletingTodo}
        title="Delete Todo"
        message={`Are you sure you want to delete "${deletingTodo?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingTodo(null)}
      />
    </div>
  );
}
