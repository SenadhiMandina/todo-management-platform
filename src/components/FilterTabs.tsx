export type FilterValue = 'all' | 'pending' | 'completed';

interface FilterTabsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts: { all: number; pending: number; completed: number };
}

const TABS: { key: FilterValue; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

export default function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-700 bg-slate-900 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === tab.key
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {tab.label}
          <span
            className={`rounded-full px-1.5 text-xs ${
              value === tab.key ? 'bg-white/20' : 'bg-slate-800'
            }`}
          >
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
