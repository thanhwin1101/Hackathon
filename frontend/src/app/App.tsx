import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Settings, X, Wifi, MessageSquare } from "lucide-react";
import { BpmCard } from "./components/BpmCard";
import { HeartRateChart } from "./components/HeartRateChart";
import { ChatInterface } from "./components/ChatInterface";
import { StatsPanel } from "./components/StatsPanel";
import { StatusBar } from "./components/StatusBar";


const DEFAULT_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  (import.meta.env.DEV ? "" : "http://localhost:8000");
const FETCH_INTERVAL = 3000;
const MAX_HISTORY = 40;

interface DataPoint {
  time: string;
  bpm: number;
}

function generateMockBpm(prev: number | null): number {
  const base = prev ?? 75;
  const delta = (Math.random() - 0.5) * 8;
  return Math.round(Math.max(50, Math.min(130, base + delta)));
}

export default function App() {
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [apiInput, setApiInput] = useState(DEFAULT_API_URL);
  const [chatOpen, setChatOpen] = useState(false);
  const bpmRef = useRef<number | null>(null);

  const apiPrefix = apiBaseUrl.replace(/\/$/, "");

  const fetchBpm = useCallback(async () => {
    try {
      const healthUrl = `${apiPrefix}/health`;
      const bpmUrl = `${apiPrefix}/bpm`;
      const [healthRes, bpmRes] = await Promise.all([
        fetch(healthUrl, { signal: AbortSignal.timeout(2500) }),
        fetch(bpmUrl, { signal: AbortSignal.timeout(2500) }),
      ]);

      if (!healthRes.ok) throw new Error(`health HTTP ${healthRes.status}`);
      setIsConnected(true);

      if (!bpmRes.ok) throw new Error(`bpm HTTP ${bpmRes.status}`);
      const data = await bpmRes.json();
      const raw = typeof data === "number" ? data : data.bpm ?? data.value;
      const hasBpm = typeof raw === "number" && !isNaN(raw);

      if (hasBpm) {
        const bpm = raw as number;
        bpmRef.current = bpm;
        setCurrentBpm(bpm);
        setLastUpdated(new Date());
        setHistory((prev) => {
          const point: DataPoint = {
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            bpm,
          };
          return [...prev.slice(-MAX_HISTORY + 1), point];
        });
      } else {
        setCurrentBpm(null);
      }
    } catch {
      setIsConnected(false);
      const mockBpm = generateMockBpm(bpmRef.current);
      bpmRef.current = mockBpm;
      setCurrentBpm(mockBpm);
      setLastUpdated(new Date());
      setHistory((prev) => {
        const point: DataPoint = {
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          bpm: mockBpm,
        };
        return [...prev.slice(-MAX_HISTORY + 1), point];
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchBpm();
    const id = setInterval(fetchBpm, FETCH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchBpm]);

  const applyApiUrl = () => {
    setApiBaseUrl(apiInput.trim().replace(/\/$/, ""));
    setShowSettings(false);
  };

  const openSettings = () => {
    setApiInput(apiBaseUrl);
    setShowSettings(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/15 rounded-xl border border-red-500/20">
            <Heart className="w-5 h-5 text-red-400 fill-red-400/20" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight">AIoT Health Monitor</h1>
            <p className="text-gray-500 text-xs">Há»‡ thá»‘ng theo dĂµi sá»©c khá»e thĂ´ng minh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              isConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-orange-500/10 border-orange-500/30 text-orange-400"
            }`}
          >
            <Wifi className="w-3 h-3" />
            {isConnected ? "ÄĂ£ ná»‘i backend" : "Cháº¿ Ä‘á»™ demo (máº¥t káº¿t ná»‘i)"}
          </div>

          
          <button
            onClick={openSettings}
            className="p-2 rounded-xl border border-gray-700/50 bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      
      <StatusBar
        isConnected={isConnected}
        apiBaseUrl={apiBaseUrl}
        fetchInterval={FETCH_INTERVAL}
        dataPointCount={history.length}
      />

      
      <div className="flex flex-1 overflow-hidden">
        
        <main className={`flex-1 p-5 overflow-y-auto transition-all duration-300 ${chatOpen ? "lg:mr-[420px]" : ""}`}>
          <div className="max-w-4xl mx-auto space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <BpmCard
                  bpm={currentBpm}
                  isLoading={isLoading}
                  lastUpdated={lastUpdated}
                />
              </div>

              
              <div className="md:col-span-2 flex flex-col gap-5">
                <StatsPanel history={history} />

                
                <div className="flex-1 bg-gray-900 border border-gray-700/50 rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    ThĂ´ng tin Thiáº¿t bá»‹ AIoT
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Cáº£m biáº¿n", "MAX30102"],
                      ["Giao thá»©c", "MQTT / HTTP"],
                      ["Vi Ä‘iá»u khiá»ƒn", "ESP32"],
                      ["Backend", "FastAPI"],
                      ["AI Model", "LLM + RAG"],
                      ["Táº§n sá»‘ láº¥y máº«u", `${(1000 / FETCH_INTERVAL).toFixed(1)} Hz`],
                    ].map(([key, val]) => (
                      <div key={key} className="bg-gray-800/50 rounded-lg px-3 py-2">
                        <span className="text-gray-500 block text-xs">{key}</span>
                        <span className="text-gray-200 font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            
            <HeartRateChart data={history} />

            
            {currentBpm && currentBpm > 110 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">Cáº£nh bĂ¡o nhá»‹p tim cao!</p>
                  <p className="text-red-400/70 text-xs mt-0.5">
                    Nhá»‹p tim hiá»‡n táº¡i {currentBpm} BPM vÆ°á»£t ngÆ°á»¡ng khuyáº¿n cĂ¡o. HĂ£y há»i AI trá»£ lĂ½ Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n.
                  </p>
                </div>
                <button
                  onClick={() => setChatOpen(true)}
                  className="ml-auto flex-shrink-0 text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors"
                >
                  Há»i AI
                </button>
              </div>
            )}

            {currentBpm && currentBpm < 55 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-semibold text-sm">Nhá»‹p tim tháº¥p</p>
                  <p className="text-blue-400/70 text-xs mt-0.5">
                    Nhá»‹p tim hiá»‡n táº¡i {currentBpm} BPM tháº¥p hÆ¡n bĂ¬nh thÆ°á»ng. Tiáº¿p tá»¥c theo dĂµi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        
        <aside
          className={`hidden lg:flex flex-col fixed right-0 top-0 bottom-0 w-[420px] pt-[73px] transition-transform duration-300 z-30 ${
            chatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <ChatInterface currentBpm={currentBpm} apiBaseUrl={apiBaseUrl} />
          </div>
        </aside>
      </div>

      
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative mt-auto h-[85vh] bg-gray-950 rounded-t-2xl border-t border-gray-700/50 overflow-hidden flex flex-col">
            <div className="p-3 flex justify-end border-b border-gray-700/30">
              <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <ChatInterface currentBpm={currentBpm} apiBaseUrl={apiBaseUrl} />
            </div>
          </div>
        </div>
      )}

      
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
          chatOpen
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600"
        }`}
      >
        {chatOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        )}
        {!chatOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse" />
        )}
      </button>

      
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                CĂ i Ä‘áº·t API
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">URL FastAPI (Ä‘á»ƒ trá»‘ng khi cháº¡y Vite dev + proxy)</label>
                <input
                  type="text"
                  value={apiInput}
                  onChange={(e) => setApiInput(e.target.value)}
                  placeholder="http://localhost:8000 hoáº·c Ä‘á»ƒ trá»‘ng"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/60 transition-colors font-mono"
                />
                <p className="text-gray-600 text-xs mt-2">
                  Gá»i <span className="font-mono text-gray-500">GET /health</span>, <span className="font-mono text-gray-500">GET /bpm</span>,{" "}
                  <span className="font-mono text-gray-500">POST /chat</span> trĂªn URL nĂ y (CORS Ä‘Ă£ báº­t cho localhost:5173).
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 text-xs space-y-2">
                <p className="text-gray-400 font-medium mb-2">API backend (Heart Monitor):</p>
                <div className="font-mono text-gray-500 space-y-1">
                  <p><span className="text-emerald-400">GET</span> /health â†’ tráº¡ng thĂ¡i MongoDB + RAG</p>
                  <p><span className="text-emerald-400">GET</span> /bpm â†’ <span className="text-yellow-300">{"{ bpm, device_id, received_at }"}</span> (bpm null náº¿u chÆ°a cĂ³ dá»¯ liá»‡u)</p>
                  <p><span className="text-blue-400">POST</span> /chat â†’ <span className="text-yellow-300">{"{ response, sources_used }"}</span></p>
                </div>
              </div>

              <button
                onClick={applyApiUrl}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition-colors text-sm"
              >
                LÆ°u & Káº¿t ná»‘i
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}