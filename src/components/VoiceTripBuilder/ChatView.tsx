"use client";

import { useCallback, useRef, useState, useEffect, type FormEvent } from "react";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

const SILENCE_MS = 2500;

interface ChatMessage {
  role: "agent" | "user";
  text: string;
}

const QUICK_ACTIONS = [
  { label: "🏖️  Beach getaway",         value: "I want a beach getaway" },
  { label: "🏔️  Mountain adventure",    value: "I'm thinking a mountain adventure" },
  { label: "🏛️  Cultural city trip",    value: "I'd love a cultural city trip" },
  { label: "🌿  Off-grid nature escape", value: "Something off-grid in nature" },
  { label: "👫  Trip with friends",      value: "I want to plan a trip with friends" },
  { label: "✈️  Surprise me",           value: "Surprise me with a destination" },
];

// ── Audio wave icon (5 animated bars) ────────────────────────────────────────
function AudioWaveIcon({ active, color = "#fff" }: { active: boolean; color?: string }) {
  return (
    <span className="flex items-end gap-[2px] h-4">
      {[0.6, 1, 0.75, 1, 0.6].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h * 14}px`,
            background: color,
            animation: active ? `chatBarPulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` : "none",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </span>
  );
}

interface ChatViewProps {
  lastTripDestination?: string | null;
}

export default function ChatView({ lastTripDestination }: ChatViewProps) {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const historyRef    = useRef<ChatMessage[]>([]);
  const bottomRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accTextRef    = useRef("");

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // ── send message to /trips/chat ───────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    const prevHistory = [...historyRef.current];
    historyRef.current = [...historyRef.current, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/trips/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: prevHistory }),
      });

      const data = await res.json() as { reply?: string; message?: string };
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Request failed");

      const reply = data.reply ?? "Hmm, didn't catch that — try again?";
      const agentMsg: ChatMessage = { role: "agent", text: reply };
      historyRef.current = [...historyRef.current, agentMsg];
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // ── stop voice input ──────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
    const committed = accTextRef.current.trim();
    accTextRef.current = "";
    if (committed) void sendMessage(committed);
  }, [sendMessage]);

  // ── start voice input ─────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListening || isProcessing) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Voice input not supported in this browser."); return; }

    const rec = new SR();
    rec.lang           = "en-US";
    rec.continuous     = true;
    rec.interimResults = true;
    accTextRef.current = "";

    rec.onstart = () => setIsListening(true);

    rec.onresult = (event: any) => {
      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) newFinal += " " + (event.results[i][0]?.transcript ?? "");
      }
      newFinal = newFinal.trim();
      if (newFinal) accTextRef.current = (accTextRef.current + " " + newFinal).trim();

      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        silenceRef.current = null;
        stopListening();
      }, SILENCE_MS);
    };

    rec.onerror = (e: any) => {
      if (e?.error === "aborted" || e?.error === "no-speech") return;
      setError(`Voice error: ${e?.error}`);
      setIsListening(false);
    };

    rec.onend = () => {
      // only auto-commit if we didn't already stop manually
      if (accTextRef.current.trim()) stopListening();
      else setIsListening(false);
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setError("Could not start voice input."); }
  }, [isListening, isProcessing, stopListening]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
  }, []);

  // ── text submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim() ?? "";
    if (!val) return;
    void sendMessage(val);
    if (inputRef.current) inputRef.current.value = "";
  };

  const showIntro   = messages.length === 0;
  const showActions = messages.length === 0 && !isProcessing;

  const introText = lastTripDestination
    ? `Hey, welcome back! Last time we planned something in ${lastTripDestination} — ready to start a new one, or still thinking about where to go next?`
    : "Hey! Planning a trip? Tell me where you're thinking — or just describe the vibe and we'll figure out the rest.";

  return (
    <>
      {/* Keyframes for bar animation */}
      <style>{`
        @keyframes chatBarPulse {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>

      <section
        className="flex flex-col w-full max-w-[680px] mx-auto flex-1 overflow-hidden"
      >
        {/* ── messages ── */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2 space-y-3">

          {showIntro && (
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-[0.95rem] leading-relaxed"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
              >
                {introText}
              </div>
            </div>
          )}

          {showActions && (
            <div className="pt-2">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] mb-2 pl-1"
                 style={{ color: "rgba(255,255,255,0.45)" }}>
                What are you thinking?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => void sendMessage(a.value)}
                    className="text-left rounded-xl px-3 py-3 text-[0.82rem] leading-snug transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[82%] rounded-2xl px-4 py-3 text-[0.92rem] leading-relaxed",
                  msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm",
                ].join(" ")}
                style={
                  msg.role === "user"
                    ? { background: "var(--color-background-third)", color: "#fff" }
                    : { background: "rgba(12,45,72,0.08)", color: "var(--foreground)" }
                }
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(12,45,72,0.08)" }}>
                <span className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--color-background-third)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-[0.8rem]" style={{ color: "rgba(255,255,255,0.5)" }}>
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── input bar ── */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(12,45,72,0.1)" }}>
          {isListening ? (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(12,45,72,0.06)", border: "1px solid rgba(12,45,72,0.14)" }}
            >
              <AudioWaveIcon active color="var(--color-background-third)" />
              <span className="flex-1 text-[0.92rem] select-none" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                Listening...
              </span>
              <button
                type="button"
                onClick={stopListening}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-medium transition-all hover:opacity-80 active:scale-95"
                style={{ background: "var(--color-background-third)", color: "#fff" }}
              >
                <AudioWaveIcon active color="#fff" />
                Stop
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Start voice input"
                onClick={startListening}
                disabled={isProcessing}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: "var(--color-background-third)" }}
              >
                <AudioWaveIcon active={false} color="#fff" />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask me anything about travel..."
                disabled={isProcessing}
                className="flex-1 rounded-full px-4 py-2.5 text-[0.92rem] outline-none"
                style={{
                  background: "rgba(12,45,72,0.06)",
                  border: "1px solid rgba(12,45,72,0.14)",
                  color: "var(--foreground)",
                }}
              />

              <button
                type="submit"
                disabled={isProcessing}
                aria-label="Send"
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: "var(--color-background-third)", color: "#fff" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
