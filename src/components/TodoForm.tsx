import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Todo, TodoInput } from '../types/todo';

interface TodoFormProps {
  open: boolean;
  initial?: Todo | null;
  onClose: () => void;
  onSubmit: (input: TodoInput) => Promise<void>;
}

// NOTE: the parent (Dashboard.tsx) remounts this component with a fresh
// `key` every time it opens for a new/different todo, so the form's local
// state can simply be initialized once from props here — no `useEffect`
// needed to "reset on open", which avoids the cascading-render anti-pattern
// of calling setState synchronously inside an effect.
export default function TodoForm({ open, initial, onClose, onSubmit }: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const validate = () => {
    const next: { title?: string } = {};
    if (!title.trim()) next.title = 'Title is required';
    else if (title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {initial ? 'Edit Todo' : 'Create Todo'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish project report"
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                errors.title
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add more details..."
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition"
            >
              {submitting ? 'Saving...' : initial ? 'Save Changes' : 'Create Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
