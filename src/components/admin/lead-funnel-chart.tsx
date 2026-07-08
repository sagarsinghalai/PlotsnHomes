export function LeadFunnelChart({
  stages,
}: {
  stages: { label: string; count: number; color: string }[];
}) {
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-2 max-w-2xl mx-auto py-8">
      {stages.map((s, i) => {
        const width = Math.max(20, (s.count / max) * 100);
        return (
          <div key={s.label} className="flex items-center gap-4">
            <div className="w-40 text-sm text-right text-slate-600 shrink-0">{s.label}</div>
            <div
              className={`h-14 rounded-lg flex items-center justify-center text-white font-bold text-lg ${s.color}`}
              style={{ width: `${width}%`, minWidth: "80px" }}
            >
              {s.count}
            </div>
            {i < stages.length - 1 && stages[i].count > 0 && stages[i + 1].count > 0 && (
              <span className="text-xs text-slate-400 shrink-0">
                {Math.round((stages[i + 1].count / stages[i].count) * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
