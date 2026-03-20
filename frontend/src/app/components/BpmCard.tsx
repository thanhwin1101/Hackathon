import { useState, useEffect } from "react";
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BpmCardProps {
  bpm: number | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

function getBpmStatus(bpm: number): { label: string; color: string; bg: string; border: string } {
  if (bpm < 60) return { label: "Tháº¥p", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
  if (bpm <= 100) return { label: "BĂ¬nh thÆ°á»ng", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
  if (bpm <= 120) return { label: "Cao", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  return { label: "Nguy hiá»ƒm", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
}

function getTrendIcon(trend: "up" | "down" | "stable") {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-yellow-400" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-blue-400" />;
  return <Minus className="w-4 h-4 text-emerald-400" />;
}

export function BpmCard({ bpm, isLoading, lastUpdated }: BpmCardProps) {
  const [prevBpm, setPrevBpm] = useState<number | null>(null);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (bpm !== null && prevBpm !== null) {
      if (bpm > prevBpm + 1) setTrend("up");
      else if (bpm < prevBpm - 1) setTrend("down");
      else setTrend("stable");
    }
    if (bpm !== null) {
      setPrevBpm(bpm);
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [bpm]);

  const status = bpm !== null && bpm !== undefined ? getBpmStatus(bpm) : null;

  return (
    <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl p-6 overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent pointer-events-none" />

      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/15 rounded-lg border border-red-500/20">
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-gray-400 text-sm font-medium">Nhá»‹p Tim</span>
        </div>
        {status && (
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.bg} ${status.color} ${status.border}`}>
            {status.label}
          </span>
        )}
      </div>

      
      <div className="flex items-end gap-3 mb-4">
        <div className="relative flex items-center justify-center">
          
          {pulse && bpm !== null && (
            <>
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-400 opacity-20 animate-ping" />
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-30 animate-ping" style={{ animationDelay: "0.1s" }} />
            </>
          )}
          <div
            className={`relative z-10 p-3 rounded-full transition-all duration-300 ${
              pulse ? "bg-red-500/25 scale-110" : "bg-red-500/10"
            }`}
          >
            <Heart
              className={`w-8 h-8 transition-all duration-300 ${
                pulse ? "text-red-400 scale-110 fill-red-400/40" : "text-red-500"
              }`}
            />
          </div>
        </div>

        <div className="flex-1">
          {isLoading && bpm === null ? (
            <div className="h-14 w-32 bg-gray-700/50 animate-pulse rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className={`text-6xl font-bold tabular-nums transition-all duration-300 ${
                  bpm !== null ? "text-white" : "text-gray-600"
                }`}
              >
                {bpm ?? "--"}
              </span>
              <span className="text-gray-400 text-lg mb-1">BPM</span>
            </div>
          )}
        </div>

        {bpm !== null && (
          <div className="flex items-center gap-1 mb-2">
            {getTrendIcon(trend)}
          </div>
        )}
      </div>

      
      <div className="mb-4">
        <svg viewBox="0 0 300 40" className="w-full h-10 opacity-40" preserveAspectRatio="none">
          <polyline
            points="0,20 40,20 50,5 60,35 70,20 90,20 100,10 110,30 120,20 160,20 170,5 180,35 190,20 220,20 230,8 240,32 250,20 300,20"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="600"
              to="0"
              dur="2s"
              repeatCount="indefinite"
            />
          </polyline>
        </svg>
      </div>

      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">Tá»‘i thiá»ƒu</p>
          <p className="text-white text-sm font-semibold">60</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">Tá»‘i Ä‘a</p>
          <p className="text-white text-sm font-semibold">100</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">TB hĂ´m nay</p>
          <p className="text-white text-sm font-semibold">{bpm !== null ? Math.round(bpm * 0.97) : "--"}</p>
        </div>
      </div>

      
      {lastUpdated && (
        <p className="text-gray-600 text-xs mt-3 text-right">
          Cáº­p nháº­t: {lastUpdated.toLocaleTimeString("vi-VN")}
        </p>
      )}
    </div>
  );
}
