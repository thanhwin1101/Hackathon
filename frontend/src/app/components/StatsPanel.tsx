import { Zap, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatsPanelProps {
  history: { time: string; bpm: number }[];
}

export function StatsPanel({ history }: StatsPanelProps) {
  const bpms = history.map((d) => d.bpm);
  const avg = bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : 0;
  const min = bpms.length ? Math.min(...bpms) : 0;
  const max = bpms.length ? Math.max(...bpms) : 0;

  const abnormal = bpms.filter((b) => b < 60 || b > 100).length;
  const abnormalPct = bpms.length ? Math.round((abnormal / bpms.length) * 100) : 0;

  const healthScore = Math.max(0, 100 - abnormalPct * 1.5);

  const stats = [
    {
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      label: "Trung bình",
      value: avg ? `${avg} BPM` : "--",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      label: "Sức khỏe",
      value: healthScore ? `${Math.round(healthScore)}%` : "--",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
      label: "Bất thường",
      value: bpms.length ? `${abnormalPct}%` : "--",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
      label: "Biên độ",
      value: bpms.length ? `${min}–${max}` : "--",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`${s.bg} border ${s.border} rounded-xl p-4 flex flex-col gap-2`}
        >
          <div className="flex items-center gap-2">
            {s.icon}
            <span className="text-gray-400 text-xs">{s.label}</span>
          </div>
          <span className="text-white font-semibold">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
