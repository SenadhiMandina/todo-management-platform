import { Check, Pencil, Trash2, RotateCcw, Clock } from 'lucide-react';
import type { Todo } from '../types/todo';

interface TodoCardProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: TodoCardProps) {
  const isCompleted = todo.status === 'completed';

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border p-4 transition ${
        isCompleted
          ? 'border-slate-800 bg-slate-900/50'
          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
      }`}
    >
      <button
        onClick={() => onToggle(todo)}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          isCompleted
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-600 hover:border-indigo-500'
        }`}
        title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
      >
        {isCompleted ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3 w-3 opacity-0" />}
      </button>

      <div className="min-w-0 flex-1">
        <h3
          className={`break-words text-sm font-medium ${
            isCompleted ? 'text-slate-500 line-through' : 'text-white'
          }`}
        >
          {todo.title}
        </h3>
        {todo.description && (
          <p className={`mt-1 break-words text-sm ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
            {todo.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {new Date(todo.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {todo.status}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(todo)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(todo)}
          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
