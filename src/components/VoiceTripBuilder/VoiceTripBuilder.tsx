"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";
import type { TripContext } from "@/types/trip-context";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

// 3 seconds of silence before we commit the transcript
const SILENCE_MS = 3000;

type StepId =
  | "destination" | "duration" | "companions" | "budget" | "season"
  | "pace" | "interests" | "exclusions" | "accommodation" | "contextual" | "confirm";

const STEPS: StepId[] = [
  "destination", "duration", "companions", "budget", "season",
  "pace", "interests", "exclusions", "accommodation", "contextual", "confirm",
];

const SEASON_OPTIONS = ["spring", "summer", "autumn", "winter", "shoulder"];
const SEASON_MOODS   = ["heat", "snow", "rain", "quiet", "low-crowds"];

const STYLE_OPTIONS = [
  { code: "design_hotel",     label: "Design Hotel" },
  { code: "jungle_lodge",     label: "Jungle Lodge" },
  { code: "heritage_riad",    label: "Heritage Riad" },
  { code: "beach_bungalow",   label: "Beach Bungalow" },
  { code: "city_boutique",    label: "City Boutique" },
  { code: "village_homestay", label: "Village Homestay" },
];

function labelize(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ApiErrorResponse { error?: string; message?: string | string[]; }
interface ConversationResponse {
  agentReply?: string;
  nextStep?: StepId;
  tripContextUpdates?: Partial<TripContext>;
}

function apiError(p: ApiErrorResponse, fallback: string): string {
  if (typeof p.error   === "string" && p.error.trim())   return p.error;
  if (typeof p.message === "string" && p.message.trim()) return p.message;
  if (Array.isArray(p.message) && p.message.length)      return p.message.join(", ");
  return fallback;
}

// ── phase machine ─────────────────────────────────────────────────────────────
type Phase = "idle" | "listening" | "processing" | "speaking";

export default function VoiceTripBuilder() {
  const router = useRouter();

  // ── trip context ──────────────────────────────────────────────────────────
  const [stepIndex,             setStepIndex]             = useState(0);
  const [destinationRaw,        setDestinationRaw]        = useState("");
  const [resolvedRegion,        setResolvedRegion]        = useState("");
  const [destinationConfidence, setDestinationConfidence] = useState(0.55);
  const [durationMin,           setDurationMin]           = useState(10);
  const [durationMax,           setDurationMax]           = useState(12);
  const [companions,            setCompanions]            = useState("couple");
  const [budgetTier,            setBudgetTier]            = useState("comfortable");
  const [season,                setSeason]                = useState("shoulder");
  const [seasonMoods,           setSeasonMoods]           = useState<string[]>(["low-crowds"]);
  const [activityLevel,         setActivityLevel]         = useState(0.4);
  const [spontaneity,           setSpontaneity]           = useState(0.35);
  const [interests,             setInterests]             = useState<string[]>([]);
  const [exclusions,            setExclusions]            = useState<string[]>(["instagram_crowds", "tourist_traps"]);
  const [accommodationStyle,    setAccommodationStyle]    = useState("city_boutique");
  const [contextualAnswers,     setContextualAnswers]     = useState<Record<string, string>>({});
  const [exactStartDate,        setExactStartDate]        = useState("");
  const [exactEndDate,          setExactEndDate]          = useState("");
  const exactStartRef = useRef("");

  // ── UI ────────────────────────────────────────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>("idle");
  const [micOn,          setMicOn]          = useState(true);
  const [agentText,      setAgentText]      = useState("");
  const [audioLevel,     setAudioLevel]     = useState(0);
  const [error,          setError]          = useState<string | null>(null);
  const [hasSpeechAPI,   setHasSpeechAPI]   = useState(true);
  const [transcript,     setTranscript]     = useState<Array<{ role: "agent" | "user"; text: string }>>([]);
  const [showTranscript, setShowTranscript] = useState(false);

  // ── refs ──────────────────────────────────────────────────────────────────
  const phaseRef       = useRef<Phase>("idle");
  const micOnRef       = useRef(true);
  const micBlockedRef  = useRef(false);
  const recognitionRef = useRef<any>(null);
  const voicesRef      = useRef<SpeechSynthesisVoice[]>([]);
  const silenceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef    = useRef(false);
  const queuedRef      = useRef<string | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const rafRef         = useRef<number | null>(null);
  // accumulate transcript text across multiple onresult events
  const accTextRef     = useRef("");

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const currentStep = STEPS[stepIndex];

  const companionCount = useMemo(() => {
    if (companions === "solo")             return 1;
    if (companions === "couple")           return 2;
    if (companions === "friends_small")    return 4;
    if (companions === "friends_group")    return 7;
    if (companions === "family_with_kids") return 4;
    return 2;
  }, [companions]);

  // ── voice loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) voicesRef.current = v;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── build context snapshot ────────────────────────────────────────────────
  const buildContext = useCallback((confirmed: boolean): TripContext => {
    const label = STYLE_OPTIONS.find(o => o.code === accommodationStyle)?.label
      ?? labelize(accommodationStyle);
    return {
      destination: {
        raw_input: destinationRaw,
        resolved_region: resolvedRegion || destinationRaw,
        confidence: destinationConfidence,
      },
      duration: { min: durationMin, max: durationMax },
      travel_dates: {
        season: [season, ...seasonMoods].join(", "),
        exact_start: exactStartDate || null,
        exact_end:   exactEndDate   || null,
      },
      companions: { type: companions, count: companionCount, children: companions === "family_with_kids" },
      budget: { tier: budgetTier },
      pace: { activity_level: +activityLevel.toFixed(2), spontaneity: +spontaneity.toFixed(2) },
      interests,
      exclusions,
      accommodation: { style: label, tier: budgetTier },
      contextual_answers: contextualAnswers,
      confirmed,
    };
  }, [
    destinationRaw, resolvedRegion, destinationConfidence,
    durationMin, durationMax, season, seasonMoods,
    exactStartDate, exactEndDate, companions, companionCount,
    budgetTier, activityLevel, spontaneity,
    interests, exclusions, accommodationStyle, contextualAnswers,
  ]);

  // ── apply backend updates ─────────────────────────────────────────────────
  const applyUpdates = useCallback((u?: Partial<TripContext>) => {
    if (!u) return;
    if (u.destination) {
      if (typeof u.destination.raw_input       === "string") setDestinationRaw(u.destination.raw_input);
      if (typeof u.destination.resolved_region === "string") setResolvedRegion(u.destination.resolved_region);
      if (typeof u.destination.confidence      === "number") setDestinationConfidence(u.destination.confidence);
    }
    if (u.duration) {
      if (typeof u.duration.min === "number") setDurationMin(u.duration.min);
      if (typeof u.duration.max === "number") setDurationMax(u.duration.max);
    }
    if (u.companions?.type) setCompanions(u.companions.type);
    if (u.budget?.tier)     setBudgetTier(u.budget.tier);
    if (u.travel_dates) {
      if (typeof u.travel_dates.season === "string") {
        const parts = u.travel_dates.season.split(",").map(p => p.trim()).filter(Boolean);
        if (parts[0] && SEASON_OPTIONS.includes(parts[0])) setSeason(parts[0]);
        const moods = parts.slice(1).filter(e => SEASON_MOODS.includes(e));
        if (moods.length) setSeasonMoods(moods);
      }
      if (typeof u.travel_dates.exact_start === "string") {
        setExactStartDate(u.travel_dates.exact_start);
        exactStartRef.current = u.travel_dates.exact_start;
      }
      if (typeof u.travel_dates.exact_end === "string") setExactEndDate(u.travel_dates.exact_end);
    }
    if (u.pace) {
      if (typeof u.pace.activity_level === "number") setActivityLevel(u.pace.activity_level);
      if (typeof u.pace.spontaneity    === "number") setSpontaneity(u.pace.spontaneity);
    }
    if (Array.isArray(u.interests)  && u.interests.length)  setInterests(u.interests);
    if (Array.isArray(u.exclusions) && u.exclusions.length) setExclusions(u.exclusions);
    if (u.accommodation) {
      if (typeof u.accommodation.style === "string") setAccommodationStyle(u.accommodation.style);
      if (typeof u.accommodation.tier  === "string") setBudgetTier(u.accommodation.tier);
    }
    if (u.contextual_answers) setContextualAnswers(prev => ({ ...prev, ...u.contextual_answers }));
  }, []);

  // Full history kept in a ref so handleUtterance always reads the latest
  // without needing it in the dependency array.
  const historyRef = useRef<Array<{ role: "agent" | "user"; text: string }>>([]);

  const addLine = useCallback((role: "agent" | "user", text: string) => {
    if (!text.trim()) return;
    historyRef.current = [...historyRef.current, { role, text }];
    setTranscript(prev => [...prev.slice(-9), { role, text }]);
  }, []);

  // ── forward declaration so speak ↔ startListening can reference each other ─
  const startListeningRef = useRef<() => void>(() => {});

  // ── speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!text) return;
    setAgentText(text);
    setError(null);
    addLine("agent", text);
    setPhaseSync("speaking");

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPhaseSync("idle");
      startListeningRef.current();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = "en-US";
    utt.rate  = 1.0;
    utt.pitch = 1.0;

    const voices = voicesRef.current;
    const voice  =
      voices.find(v => v.lang === "en-US" && !v.localService) ??
      voices.find(v => v.lang.startsWith("en")) ??
      voices[0];
    if (voice) utt.voice = voice;

    utt.onend = () => {
      setPhaseSync("idle");
      startListeningRef.current();
    };
    utt.onerror = (e) => {
      if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
      setPhaseSync("idle");
      startListeningRef.current();
    };

    synth.speak(utt);
  }, [addLine, setPhaseSync]);

  // ── main conversation handler ─────────────────────────────────────────────
  const handleUtterance = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) {
      setPhaseSync("idle");
      startListeningRef.current();
      return;
    }

    // If a request is already in-flight, queue this one
    if (inFlightRef.current) {
      queuedRef.current = text;
      return;
    }
    inFlightRef.current = true;

    addLine("user", text);
    setPhaseSync("processing");

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/trips/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripContext: buildContext(false),
          currentStep,
          lastUserUtterance: text,
          conversationHistory: historyRef.current,
        }),
      });

      // If mic was turned off while waiting, still process the reply
      const data = (await res.json()) as ConversationResponse | ApiErrorResponse;

      if (!res.ok) {
        throw new Error(apiError(data as ApiErrorResponse, "Conversation request failed."));
      }

      const reply = ("agentReply" in data && typeof data.agentReply === "string")
        ? data.agentReply
        : "Could you say that again?";

      const updates = "tripContextUpdates" in data ? data.tripContextUpdates : undefined;
      applyUpdates(updates);

      const nextStep = ("nextStep" in data && data.nextStep) ? data.nextStep : currentStep;
      if (nextStep && STEPS.includes(nextStep)) setStepIndex(STEPS.indexOf(nextStep));

      const updStart = updates?.travel_dates?.exact_start ?? exactStartRef.current ?? exactStartDate;
      const updEnd   = updates?.travel_dates?.exact_end   ?? exactEndDate;

      if (nextStep === "confirm" && updStart && updEnd) {
        exactStartRef.current = updStart;
        setExactStartDate(updStart);
        setExactEndDate(updEnd);
        const ctx = buildContext(true);
        ctx.travel_dates.exact_start = updStart;
        ctx.travel_dates.exact_end   = updEnd;
        sessionStorage.setItem("tripContext", JSON.stringify(ctx));
        router.push("/new-trip/loading");
        return;
      }

      // speak() will restart listening when done
      speak(reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      // Don't speak a robotic error — just go back to listening so user can retry
      setPhaseSync("idle");
      startListeningRef.current();
    } finally {
      inFlightRef.current = false;
      const queued = queuedRef.current;
      if (queued) {
        queuedRef.current = null;
        setTimeout(() => void handleUtterance(queued), 0);
      }
    }
  }, [
    currentStep, exactStartDate, exactEndDate,
    buildContext, applyUpdates, speak, addLine, setPhaseSync, router,
  ]);

  // ── start listening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!micOnRef.current || micBlockedRef.current) return;
    if (phaseRef.current !== "idle") return;
    accTextRef.current = "";
    setPhaseSync("listening");
    try { recognitionRef.current?.start(); } catch { /* already running */ }
  }, [setPhaseSync]);

  // keep the ref in sync so speak() can call it without a stale closure
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── speech recognition ────────────────────────────────────────────────────
  // Recreated only when handleUtterance changes (step/context change).
  // continuous:true so the session stays open; we commit after SILENCE_MS of no new text.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setHasSpeechAPI(false);
      setError("Voice input not supported in this browser.");
      return;
    }

    const rec = new SR();
    rec.lang           = "en-US";
    rec.continuous     = true;   // keep session open until we explicitly stop
    rec.interimResults = true;

    rec.onstart = () => {
      setPhaseSync("listening");
      setError(null);
      accTextRef.current = "";
    };

    rec.onresult = (event: any) => {
      // Don't process results while agent is speaking or we're already processing
      if (phaseRef.current === "speaking" || phaseRef.current === "processing") return;

      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinal += " " + (event.results[i][0]?.transcript ?? "");
        }
      }
      newFinal = newFinal.trim();

      if (newFinal) {
        // Append to accumulated text
        accTextRef.current = (accTextRef.current + " " + newFinal).trim();
      }

      // Reset the silence timer on every result (final or interim)
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        silenceRef.current = null;
        const committed = accTextRef.current.trim();
        accTextRef.current = "";
        if (!committed) return;

        // Stop recognition, transition to processing
        try { rec.stop(); } catch { /* ignore */ }
        setPhaseSync("processing");
        void handleUtterance(committed);
      }, SILENCE_MS);
    };

    rec.onerror = (e: any) => {
      const code = e?.error;
      if (code === "aborted") return;
      if (code === "no-speech") {
        // no-speech just means silence — stay in listening, reset accumulator
        accTextRef.current = "";
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        micBlockedRef.current = true;
        setError("Microphone blocked — allow mic access and click the mic button.");
        setPhaseSync("idle");
        return;
      }
      setError(`Recognition error: ${code}`);
      setPhaseSync("idle");
    };

    rec.onend = () => {
      // Only auto-restart if we're still in listening phase
      // (processing/speaking manage their own restart via speak → startListening)
      if (phaseRef.current === "listening" && micOnRef.current && !micBlockedRef.current) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = rec;

    // Auto-start on mount
    if (micOnRef.current && !micBlockedRef.current) {
      setTimeout(() => startListening(), 300);
    }

    return () => {
      if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
      rec.onstart  = null;
      rec.onresult = null;
      rec.onerror  = null;
      rec.onend    = null;
      try { rec.abort(); } catch { /* ignore */ }
    };
  }, [handleUtterance, setPhaseSync, startListening]);

  // ── audio level meter ─────────────────────────────────────────────────────
  useEffect(() => {
    const stop = () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      setAudioLevel(0);
    };
    const start = async () => {
      if (!micOn || micBlockedRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx    = new AudioContext();
        const src    = ctx.createMediaStreamSource(stream);
        const an     = ctx.createAnalyser();
        an.fftSize   = 512;
        src.connect(an);
        streamRef.current   = stream;
        audioCtxRef.current = ctx;
        analyserRef.current = an;
        const buf = new Uint8Array(an.fftSize);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          setAudioLevel(Math.sqrt(sum / buf.length));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch { /* permissions denied */ }
    };
    if (micOn) void start(); else stop();
    return stop;
  }, [micOn]);

  // ── mic toggle ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const next = !micOn;
    micOnRef.current = next;
    setMicOn(next);
    if (!next) {
      if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
      accTextRef.current = "";
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      window.speechSynthesis?.cancel();
      setPhaseSync("idle");
    } else {
      micBlockedRef.current = false;
      setTimeout(() => startListening(), 150);
    }
  };

  // ── manual text fallback ──────────────────────────────────────────────────
  const handleManualSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("voiceText") as HTMLInputElement | null;
    const val = input?.value.trim() ?? "";
    if (!val) return;
    void handleUtterance(val);
    if (input) input.value = "";
  };

  // ── derived UI ────────────────────────────────────────────────────────────
  const statusLabel =
    phase === "speaking"   ? "Speaking..."   :
    phase === "processing" ? "Loading..."    :
    phase === "listening"  ? "Listening..."  :
    micOn                  ? "Ready"         : "Mic off";

  const orbScale = 1 + Math.min(audioLevel * 1.8, 0.4);

  return (
    <section className="min-h-[calc(100vh-130px)] w-full flex flex-col items-center justify-between py-10 px-6">

      {/* ── centre: orb + status + agent text ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center max-w-[520px] w-full">

        {/* Orb */}
        <div className="w-[200px] h-[200px] rounded-full flex items-center justify-center bg-white/60 shadow-[0_20px_48px_rgba(12,45,72,0.14)]">
          <div
            className="relative w-[130px] h-[130px] rounded-full overflow-hidden transition-transform duration-75"
            style={{
              background: "var(--color-background-first)",
              transform: `scale(${orbScale})`,
            }}
          >
            {phase === "speaking" && (
              <div
                className="absolute rounded-full mix-blend-screen animate-[spin_5s_linear_infinite]"
                style={{
                  inset: "-40%",
                  background: "conic-gradient(from 90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06), rgba(255,255,255,0.5), rgba(255,255,255,0.08))",
                }}
              />
            )}
            {phase === "processing" && (
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.22)" }} />
            )}
          </div>
        </div>

        {/* Status label */}
        <p className="text-[0.8rem] tracking-[0.2em] uppercase text-[var(--foreground)] opacity-70">
          {statusLabel}
        </p>

        {/* Agent reply */}
        {agentText && (
          <p className="text-[1.05rem] text-[var(--foreground)] leading-relaxed max-w-[460px]">
            {agentText}
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-[0.82rem] text-[#b45309] bg-orange-50/80 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Mic button */}
        <button
          type="button"
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
          onClick={toggleMic}
          className={[
            "mt-2 w-14 h-14 rounded-full flex items-center justify-center",
            "transition-all duration-200 shadow-[0_8px_24px_rgba(12,45,72,0.16)]",
            "hover:scale-105 active:scale-95",
            micOn
              ? "bg-[var(--color-background-first)] text-white"
              : "bg-white/80 text-[rgba(12,45,72,0.35)] border border-[rgba(12,45,72,0.12)]",
          ].join(" ")}
        >
          {micOn ? <BsMicFill size={22} /> : <BsMicMuteFill size={22} />}
        </button>

        {/* Text fallback when no speech API */}
        {!hasSpeechAPI && (
          <form className="flex gap-2 w-full justify-center mt-2" onSubmit={handleManualSubmit}>
            <input
              type="text"
              name="voiceText"
              placeholder="Type your response..."
              className="flex-1 max-w-[340px] rounded-full border border-[rgba(12,45,72,0.22)] px-4 py-2 text-[0.95rem] bg-white"
            />
            <button
              type="submit"
              className="border border-[rgba(12,45,72,0.18)] bg-white text-[var(--foreground)] px-5 py-2 rounded-full text-[0.75rem] uppercase tracking-[0.12em] transition hover:-translate-y-0.5"
            >
              Send
            </button>
          </form>
        )}
      </div>

      {/* ── bottom: collapsible transcript ── */}
      {transcript.length > 0 && (
        <div className="w-full max-w-[560px] mt-6">
          <button
            type="button"
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-[rgba(12,45,72,0.45)] hover:text-[rgba(12,45,72,0.7)] transition-colors"
          >
            <span>{showTranscript ? "Hide" : "Show"} transcript</span>
            <span className="text-[0.65rem]">{showTranscript ? "▲" : "▼"}</span>
          </button>

          {showTranscript && (
            <div className="mt-2 rounded-2xl border border-white/50 bg-white/65 p-4 text-left text-[0.75rem] text-slate-700 max-h-[220px] overflow-y-auto">
              <div className="space-y-1.5">
                {transcript.map((e, i) => (
                  <div key={i} className={e.role === "agent" ? "text-slate-800" : "text-slate-500"}>
                    <span className="font-semibold">{e.role === "agent" ? "Agent" : "You"}:</span>{" "}{e.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
