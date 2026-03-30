"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { normalizeTripItinerary, type TripItinerary } from "@/types/itinerary";
import { apiFetch } from "@/lib/api";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

interface ChatMessage {
  role: "agent" | "user";
  text: string;
}

interface TripRefinementChatProps {
  itinerary: TripItinerary;
  onItineraryUpdate: (updated: TripItinerary) => void;
  /** When provided, the updated itinerary is persisted to the DB after each refine */
  tripId?: string;
}

export default function TripRefinementChat({ itinerary, onItineraryUpdate, tripId }: TripRefinementChatProps) {
  const { data: session } = useSession();
  const profileId = session?.user?.profileId;

  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [introSent, setIntroSent]       = useState(false);

  const historyRef   = useRef<ChatMessage[]>([]);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const itineraryRef = useRef<TripItinerary>(itinerary);

  useEffect(() => { itineraryRef.current = itinerary; }, [itinerary]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (introSent) return;
    setIntroSent(true);

    const fetchIntro = async () => {
      setIsProcessing(true);
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/trips/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Reply to the user to start a conversation with enthusiastic and encouraging feedback about their planned itinerary to ${itinerary.tripOverview.destination} (${itinerary.tripOverview.travelWindow}). Mention 1-2 highlights from the plan. Then invite them to ask for any changes.`,
            history: [],
          }),
        });
        const data = await res.json() as { reply?: string };
        const intro = data.reply ?? `Your trip to ${itinerary.tripOverview.destination} looks amazing! Want to tweak anything?`;
        const msg: ChatMessage = { role: "agent", text: intro };
        historyRef.current = [msg];
        setMessages([msg]);
      } catch {
        const fallback: ChatMessage = { role: "agent", text: `Your trip to ${itinerary.tripOverview.destination} is all set! Ask me to change anything — days, activities, budget, whatever.` };
        historyRef.current = [fallback];
        setMessages([fallback]);
      } finally {
        setIsProcessing(false);
      }
    };

    void fetchIntro();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    historyRef.current = [...historyRef.current, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/trips/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary: itineraryRef.current,
          message: trimmed,
          history: historyRef.current.slice(0, -1),
        }),
      });

      const data = await res.json() as { itinerary?: unknown; reply?: string };
      if (!res.ok) throw new Error("Refine request failed");

      const updated = normalizeTripItinerary(data.itinerary) ?? itineraryRef.current;
      onItineraryUpdate(updated);
      itineraryRef.current = updated;

      // Persist to DB if we have a tripId (saved trip context)
      if (tripId && profileId) {
        try {
          await apiFetch(`/trips/${tripId}`, {
            method: "PATCH",
            body: JSON.stringify({ itinerary: updated }),
          }, profileId);
        } catch {
          // Non-fatal — UI already updated, just log silently
          console.warn("[refine] Failed to persist itinerary update to DB");
        }
      }

      const replyText = data.reply ?? "Done! Your itinerary has been updated. Anything else you'd like to adjust?";
      const agentMsg: ChatMessage = { role: "agent", text: replyText };
      historyRef.current = [...historyRef.current, agentMsg];
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      const errMsg: ChatMessage = { role: "agent", text: "Hmm, something went wrong. Try again?" };
      historyRef.current = [...historyRef.current, errMsg];
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onItineraryUpdate, tripId, profileId]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim() ?? "";
    if (!val) return;
    void sendMessage(val);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "rgba(12,45,72,0.06)",
        border: "1px solid rgba(12,45,72,0.14)",
        height: "420px",
      }}
    >
      <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(12,45,72,0.1)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--foreground)", opacity: 0.6 }}>
          Refine your trip
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 itinerary-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={["max-w-[82%] rounded-2xl px-4 py-3 text-[0.88rem] leading-relaxed", msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"].join(" ")}
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

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(12,45,72,0.1)" }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask for changes — swap a day, add an activity..."
            disabled={isProcessing}
            className="flex-1 rounded-full px-4 py-2.5 text-[0.88rem] outline-none"
            style={{ background: "rgba(12,45,72,0.06)", border: "1px solid rgba(12,45,72,0.14)", color: "var(--foreground)" }}
          />
          <button type="submit" disabled={isProcessing} aria-label="Send"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{ background: "var(--color-background-third)", color: "#fff" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
