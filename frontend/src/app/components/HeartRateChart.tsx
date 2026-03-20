import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

interface DataPoint {
  time: string;
  bpm: number;
}

interface HeartRateChartProps {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const bpm = payload[0].value;
    let statusColor = "#10b981";
    let statusText = "BĂ¬nh thÆ°á»ng";
    if (bpm < 60) { statusColor = "#60a5fa"; statusText = "Tháº¥p"; }
    else if (bpm > 100) { statusColor = "#f59e0b"; statusText = "Cao"; }
    if (bpm > 120) { statusColor = "#ef4444"; statusText = "Nguy hiá»ƒm"; }

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-lg">
          {bpm} <span className="text-gray-400 text-sm font-normal">BPM</span>
        </p>
        <span className="text-xs font-medium" style={{ color: statusColor }}>
          â— {statusText}
        </span>
      </div>
    );
  }
  return null;
};

export function HeartRateChart({ data }: HeartRateChartProps) {
  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">Lá»‹ch Sá»­ Nhá»‹p Tim</h3>
          <p className="text-gray-500 text-sm mt-0.5">Dá»¯ liá»‡u real-time tá»« cáº£m biáº¿n</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-gray-400">Tháº¥p (&lt;60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-gray-400">BĂ¬nh thÆ°á»ng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-gray-400">Cao (&gt;100)</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Äang chá» dá»¯ liá»‡u...</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[40, 160]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="bpm"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#bpmGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
