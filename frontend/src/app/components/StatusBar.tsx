import { Wifi, WifiOff, Server, Clock } from "lucide-react";

interface StatusBarProps {
  isConnected: boolean;
  apiBaseUrl: string;
  fetchInterval: number;
  dataPointCount: number;
}

export function StatusBar({ isConnected, apiBaseUrl, fetchInterval, dataPointCount }: StatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-2.5 bg-gray-900/80 border-b border-gray-700/30 text-xs">
      <div className={`flex items-center gap-1.5 ${isConnected ? "text-emerald-400" : "text-red-400"}`}>
        {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span>{isConnected ? "Đã kết nối" : "Mất kết nối"}</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-500">
        <Server className="w-3.5 h-3.5" />
        <span className="font-mono">{apiBaseUrl || "(proxy / cùng origin)"}</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-500">
        <Clock className="w-3.5 h-3.5" />
        <span>Cập nhật mỗi {fetchInterval / 1000}s</span>
      </div>
      <div className="ml-auto text-gray-600">
        {dataPointCount} điểm dữ liệu
      </div>
    </div>
  );
}
