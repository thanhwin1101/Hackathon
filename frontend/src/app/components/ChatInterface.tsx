import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Bot, User, Loader2, Sparkles, ChevronDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  currentBpm: number | null;
  apiBaseUrl: string;
}

const QUICK_QUESTIONS = [
  "Nhá»‹p tim cá»§a tĂ´i cĂ³ bĂ¬nh thÆ°á»ng khĂ´ng?",
  "TĂ´i cáº§n lĂ m gĂ¬ khi nhá»‹p tim cao?",
  "Nhá»‹p tim bĂ¬nh thÆ°á»ng lĂ  bao nhiĂªu?",
  "Khi nĂ o cáº§n gáº·p bĂ¡c sÄ©?",
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Xin chĂ o! TĂ´i lĂ  AI Trá»£ lĂ½ Sá»©c khá»e cá»§a báº¡n đŸ©º\n\nTĂ´i cĂ³ thá»ƒ giĂºp báº¡n:\nâ€¢ PhĂ¢n tĂ­ch chá»‰ sá»‘ nhá»‹p tim\nâ€¢ TÆ° váº¥n vá» sá»©c khá»e tim máº¡ch\nâ€¢ Giáº£i Ä‘Ă¡p tháº¯c máº¯c vá» dá»¯ liá»‡u AIoT\n\nBáº¡n muá»‘n há»i gĂ¬ hĂ´m nay?",
  timestamp: new Date(),
};

export function ChatInterface({ currentBpm, apiBaseUrl }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            current_bpm: currentBpm,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response ?? data.message ?? "Xin lá»—i, tĂ´i khĂ´ng nháº­n Ä‘Æ°á»£c pháº£n há»“i há»£p lá»‡.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      
      const mockReply = getMockReply(trimmed, currentBpm);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: mockReply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden overflow-x-hidden">
      
      <div className="flex items-center gap-3 p-4 border-b border-gray-700/50 bg-gray-800/50">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-800" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">AI Trá»£ lĂ½ Sá»©c khá»e</p>
          <p className="text-emerald-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Äang hoáº¡t Ä‘á»™ng
          </p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg px-2.5 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-300 text-xs font-medium">RAG + LLM</span>
          </div>
        </div>
      </div>

      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth overflow-x-hidden"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            
            <div className="flex-shrink-0 mt-1">
              {msg.role === "assistant" ? (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            
            <div
              className={`max-w-[78%] max-w-full ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 border border-gray-700/50 rounded-tl-sm"
                }`}
                style={{ overflowWrap: "anywhere" }}
              >
                {msg.content}
              </div>
              <span className="text-gray-600 text-xs px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-800 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              <span className="text-gray-400 text-sm">AI Ä‘ang phĂ¢n tĂ­ch...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-8 h-8 bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors shadow-lg"
        >
          <ChevronDown className="w-4 h-4 text-gray-300" />
        </button>
      )}

      
      <div className="px-4 py-2 border-t border-gray-700/30">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/50 text-gray-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-end gap-2 bg-gray-800 border border-gray-700/50 rounded-xl px-4 py-3 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Há»i AI vá» sá»©c khá»e cá»§a báº¡n..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2 text-center">
          Enter Ä‘á»ƒ gá»­i â€¢ Shift+Enter xuá»‘ng dĂ²ng
        </p>
      </div>
    </div>
  );
}


function getMockReply(message: string, bpm: number | null): string {
  const msg = message.toLowerCase();

  if (bpm && (msg.includes("bĂ¬nh thÆ°á»ng") || msg.includes("bpm") || msg.includes("nhá»‹p tim"))) {
    if (bpm < 60)
      return `Nhá»‹p tim hiá»‡n táº¡i cá»§a báº¡n lĂ  ${bpm} BPM, tháº¥p hÆ¡n má»©c bĂ¬nh thÆ°á»ng (60-100 BPM). ÄĂ¢y cĂ³ thá»ƒ do:\nâ€¢ Báº¡n Ä‘ang nghá»‰ ngÆ¡i hoáº·c ngá»§\nâ€¢ Váº­n Ä‘á»™ng thá»ƒ thao thÆ°á»ng xuyĂªn\n\nNáº¿u báº¡n cáº£m tháº¥y chĂ³ng máº·t, khĂ³ thá»Ÿ, hĂ£y gáº·p bĂ¡c sÄ© ngay.`;
    if (bpm <= 100)
      return `Nhá»‹p tim hiá»‡n táº¡i cá»§a báº¡n lĂ  ${bpm} BPM â€” hoĂ n toĂ n bĂ¬nh thÆ°á»ng! âœ…\n\nMá»©c nhá»‹p tim lĂ½ tÆ°á»Ÿng cho ngÆ°á»i trÆ°á»Ÿng thĂ nh lĂ  60-100 BPM khi nghá»‰ ngÆ¡i. HĂ£y duy trĂ¬ lá»‘i sá»‘ng lĂ nh máº¡nh vĂ  tiáº¿p tá»¥c theo dĂµi!`;
    return `Nhá»‹p tim hiá»‡n táº¡i cá»§a báº¡n lĂ  ${bpm} BPM, cao hÆ¡n bĂ¬nh thÆ°á»ng. â ï¸\n\nMá»™t sá»‘ nguyĂªn nhĂ¢n cĂ³ thá»ƒ:\nâ€¢ CÄƒng tháº³ng, lo Ă¢u\nâ€¢ Táº­p thá»ƒ dá»¥c gáº§n Ä‘Ă¢y\nâ€¢ Caffeine hoáº·c thuá»‘c\n\nNáº¿u kĂ©o dĂ i, hĂ£y tham kháº£o Ă½ kiáº¿n bĂ¡c sÄ©.`;
  }

  if (msg.includes("lĂ m gĂ¬") || msg.includes("cao") || msg.includes("nguy hiá»ƒm")) {
    return `Khi nhá»‹p tim cao báº¥t thÆ°á»ng, báº¡n nĂªn:\n\n1. đŸ§˜ Thá»Ÿ sĂ¢u vĂ  thÆ° giĂ£n\n2. đŸ’§ Uá»‘ng Ä‘á»§ nÆ°á»›c\n3. âŒ TrĂ¡nh caffeine vĂ  thuá»‘c lĂ¡\n4. đŸƒ Dá»«ng hoáº¡t Ä‘á»™ng gáº¯ng sá»©c\n5. đŸ©º Náº¿u >120 BPM kĂ©o dĂ i, liĂªn há»‡ bĂ¡c sÄ© ngay`;
  }

  if (msg.includes("bĂ¬nh thÆ°á»ng") && !bpm) {
    return `Nhá»‹p tim bĂ¬nh thÆ°á»ng cá»§a ngÆ°á»i trÆ°á»Ÿng thĂ nh:\n\nâ€¢ Khi nghá»‰ ngÆ¡i: 60â€“100 BPM\nâ€¢ Váº­n Ä‘á»™ng viĂªn: 40â€“60 BPM\nâ€¢ Tráº» em: 70â€“120 BPM\n\nMá»©c dÆ°á»›i 60 hoáº·c trĂªn 100 khi nghá»‰ cáº§n Ä‘Æ°á»£c theo dĂµi thĂªm.`;
  }

  if (msg.includes("bĂ¡c sÄ©") || msg.includes("khi nĂ o")) {
    return `Báº¡n nĂªn gáº·p bĂ¡c sÄ© ngay khi:\n\nđŸ¨ Nhá»‹p tim >150 BPM khĂ´ng rĂµ nguyĂªn nhĂ¢n\nđŸ¨ Nhá»‹p tim <40 BPM kĂ¨m chĂ³ng máº·t\nđŸ¨ Äau ngá»±c hoáº·c khĂ³ thá»Ÿ\nđŸ¨ Ngáº¥t xá»‰u hoáº·c gáº§n ngáº¥t\n\nKhĂ¡m Ä‘á»‹nh ká»³ 6 thĂ¡ng/láº§n cÅ©ng Ä‘Æ°á»£c khuyáº¿n nghá»‹!`;
  }

  return `Cáº£m Æ¡n cĂ¢u há»i cá»§a báº¡n! TĂ´i Ä‘ang káº¿t ná»‘i vá»›i há»‡ thá»‘ng RAG Ä‘á»ƒ phĂ¢n tĂ­ch dá»¯ liá»‡u sá»©c khá»e cá»§a báº¡n.\n\n${
    bpm ? `Nhá»‹p tim hiá»‡n táº¡i: **${bpm} BPM**\n\n` : ""
  }Báº¡n cĂ³ thá»ƒ há»i tĂ´i vá»:\nâ€¢ PhĂ¢n tĂ­ch chá»‰ sá»‘ BPM\nâ€¢ Lá»i khuyĂªn sá»©c khá»e tim máº¡ch\nâ€¢ CĂ¡c triá»‡u chá»©ng cáº§n lÆ°u Ă½`;
}
