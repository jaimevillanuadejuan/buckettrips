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
import type { TripContext } from "@/types/trip-context";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

type StepId =
  | "destination"
  | "duration"
  | "companions"
  | "budget"
  | "season"
  | "pace"
  | "interests"
  | "exclusions"
  | "accommodation"
  | "contextual"
  | "confirm";

const STEPS: StepId[] = [
  "destination",
  "duration",
  "companions",
  "budget",
  "season",
  "pace",
  "interests",
  "exclusions",
  "accommodation",
  "contextual",
  "confirm",
];

const SEASON_OPTIONS = ["spring", "summer", "autumn", "winter", "shoulder"];
const SEASON_MOODS = ["heat", "snow", "rain", "quiet", "low-crowds"];

const FALLBACK_STYLE_OPTIONS = [
  { code: "design_hotel", label: "Design Hotel" },
  { code: "jungle_lodge", label: "Jungle Lodge" },
  { code: "heritage_riad", label: "Heritage Riad" },
  { code: "beach_bungalow", label: "Beach Bungalow" },
  { code: "city_boutique", label: "City Boutique" },
  { code: "village_homestay", label: "Village Homestay" },
];

function labelize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ApiErrorResponse {
  error?: string;
  message?: string | string[];
}

interface ConversationResponse {
  agentReply?: string;
  nextStep?: StepId;
  tripContextUpdates?: Partial<TripContext>;
}

function getApiErrorMessage(
  payload: ApiErrorResponse,
  fallback: string,
): string {
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }

  if (
    typeof payload.message === "string" &&
    payload.message.trim().length > 0
  ) {
    return payload.message;
  }

  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message.join(", ");
  }

  return fallback;
}

export default function VoiceTripBuilder() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [destinationRaw, setDestinationRaw] = useState("");
  const [resolvedRegion, setResolvedRegion] = useState("");
  const [destinationConfidence, setDestinationConfidence] = useState(0.55);

  const [durationMin, setDurationMin] = useState(10);
  const [durationMax, setDurationMax] = useState(12);

  const [companions, setCompanions] = useState("couple");
  const [budgetTier, setBudgetTier] = useState("comfortable");
  const [season, setSeason] = useState("shoulder");
  const [seasonMoods, setSeasonMoods] = useState<string[]>(["low-crowds"]);

  const [activityLevel, setActivityLevel] = useState(0.4);
  const [spontaneity, setSpontaneity] = useState(0.35);
  const [interests, setInterests] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([
    "instagram_crowds",
    "tourist_traps",
  ]);

  const [styleOptions, setStyleOptions] = useState(FALLBACK_STYLE_OPTIONS);
  const [accommodationStyle, setAccommodationStyle] = useState("city_boutique");

  const [contextualAnswers, setContextualAnswers] = useState<
    Record<string, string>
  >({});

  const [exactStartDate, setExactStartDate] = useState("");
  const [exactEndDate, setExactEndDate] = useState("");
  const exactStartRef = useRef<string>("");

  const [lastAgentText, setLastAgentText] = useState("");
  const [lastUserText, setLastUserText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [transcript, setTranscript] = useState<
    Array<{ role: "agent" | "user"; text: string }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const processingTimerRef = useRef<number | null>(null);
  const micBlockedRef = useRef(false);
  const autoListenRef = useRef(true);
  const destinationCapturedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const requestInFlightRef = useRef(false);
  const queuedUtteranceRef = useRef<string | null>(null);

  const currentStep = STEPS[stepIndex];

  const companionCount = useMemo(() => {
    if (companions === "solo") return 1;
    if (companions === "couple") return 2;
    if (companions === "friends_small") return 4;
    if (companions === "friends_group") return 7;
    if (companions === "family_with_kids") return 4;
    return 2;
  }, [companions]);

  function buildTripContext(confirmed: boolean): TripContext {
    const selectedStyle =
      styleOptions.find((option) => option.code === accommodationStyle)
        ?.label ?? labelize(accommodationStyle);

    return {
      destination: {
        raw_input: destinationRaw,
        resolved_region: resolvedRegion || destinationRaw,
        confidence: destinationConfidence,
      },
      duration: {
        min: durationMin,
        max: durationMax,
      },
      travel_dates: {
        season: [season, ...seasonMoods].join(", "),
        exact_start: exactStartDate || null,
        exact_end: exactEndDate || null,
      },
      companions: {
        type: companions,
        count: companionCount,
        children: companions === "family_with_kids",
      },
      budget: {
        tier: budgetTier,
      },
      pace: {
        activity_level: Number(activityLevel.toFixed(2)),
        spontaneity: Number(spontaneity.toFixed(2)),
      },
      interests,
      exclusions,
      accommodation: {
        style: selectedStyle,
        tier: budgetTier,
      },
      contextual_answers: contextualAnswers,
      confirmed,
    };
  }

  const applyTripContextUpdates = (updates?: Partial<TripContext>) => {
    if (!updates) return;

    if (updates.destination) {
      const hasDestination =
        typeof updates.destination.raw_input === "string" ||
        typeof updates.destination.resolved_region === "string";
      if (typeof updates.destination.raw_input === "string") {
        setDestinationRaw(updates.destination.raw_input);
      }
      if (typeof updates.destination.resolved_region === "string") {
        setResolvedRegion(updates.destination.resolved_region);
      }
      if (typeof updates.destination.confidence === "number") {
        setDestinationConfidence(updates.destination.confidence);
      }
      if (hasDestination && !destinationCapturedRef.current) {
        destinationCapturedRef.current = true;
        autoListenRef.current = false;
        setMicEnabled(false);
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }

    if (updates.duration) {
      if (typeof updates.duration.min === "number") {
        setDurationMin(updates.duration.min);
      }
      if (typeof updates.duration.max === "number") {
        setDurationMax(updates.duration.max);
      }
    }

    if (updates.companions) {
      if (typeof updates.companions.type === "string") {
        setCompanions(updates.companions.type);
      }
    }

    if (updates.budget) {
      if (typeof updates.budget.tier === "string") {
        setBudgetTier(updates.budget.tier);
      }
    }

    if (updates.travel_dates) {
      if (typeof updates.travel_dates.season === "string") {
        const parts = updates.travel_dates.season
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
        const primary = parts[0];
        if (primary && SEASON_OPTIONS.includes(primary)) {
          setSeason(primary);
        }
        const moods = parts.slice(1).filter((entry) => SEASON_MOODS.includes(entry));
        if (moods.length > 0) {
          setSeasonMoods(moods);
        }
      }
      if (typeof updates.travel_dates.exact_start === "string") {
        setExactStartDate(updates.travel_dates.exact_start);
        exactStartRef.current = updates.travel_dates.exact_start;
      }
      if (typeof updates.travel_dates.exact_end === "string") {
        setExactEndDate(updates.travel_dates.exact_end);
      }
    }

    if (updates.pace) {
      if (typeof updates.pace.activity_level === "number") {
        setActivityLevel(updates.pace.activity_level);
      }
      if (typeof updates.pace.spontaneity === "number") {
        setSpontaneity(updates.pace.spontaneity);
      }
    }

    if (Array.isArray(updates.interests) && updates.interests.length > 0) {
      setInterests(updates.interests);
    }

    if (Array.isArray(updates.exclusions) && updates.exclusions.length > 0) {
      setExclusions(updates.exclusions);
    }

    if (updates.accommodation) {
      if (typeof updates.accommodation.style === "string") {
        setAccommodationStyle(updates.accommodation.style);
      }
      if (typeof updates.accommodation.tier === "string") {
        setBudgetTier(updates.accommodation.tier);
      }
    }

    if (updates.contextual_answers) {
      setContextualAnswers((prev) => ({
        ...prev,
        ...updates.contextual_answers,
      }));
    }
  };

  const addTranscript = (role: "agent" | "user", text: string) => {
    if (!text.trim()) return;
    setTranscript((prev) => [...prev.slice(-5), { role, text }]);
  };

  const speak = useCallback(
    (text: string) => {
      if (!text) return;
      setLastAgentText(text);
      setError(null);
      setIsProcessing(false);
      addTranscript("agent", text);

      if (typeof window === "undefined" || !window.speechSynthesis) {
        setError("Speech synthesis is not available in this browser.");
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();
      recognitionRef.current?.stop();
      setIsListening(false);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      const voices = synth.getVoices();
      const preferred = voices.find((voice) => voice.lang.startsWith("en"));
      if (preferred) {
        utterance.voice = preferred;
      }
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        if (micEnabled && autoListenRef.current && !micBlockedRef.current) {
          recognitionRef.current?.start();
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError("Speech synthesis failed. Check browser audio settings.");
      };
      synth.speak(utterance);
    },
    [addTranscript, micEnabled],
  );

  const askNext = useCallback(
    (text: string) => {
      speak(text);
    },
    [speak],
  );

  const handleUserUtterance = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;
      if (requestInFlightRef.current) {
        queuedUtteranceRef.current = text;
        return;
      }
      requestInFlightRef.current = true;
      setLastUserText(text);
      setInterimText("");
      addTranscript("user", text);

      try {
        const res = await fetch(`${BACKEND_BASE_URL}/trips/conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripContext: buildTripContext(false),
            currentStep,
            lastUserUtterance: text,
          }),
        });

        const data = (await res.json()) as ConversationResponse | ApiErrorResponse;

        if (!res.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiErrorResponse,
              "Failed to generate a conversational response.",
            ),
          );
        }

        const reply =
          "agentReply" in data && typeof data.agentReply === "string"
            ? data.agentReply
            : "Could you say that again?";

        const updates =
          "tripContextUpdates" in data ? data.tripContextUpdates : undefined;
        applyTripContextUpdates(updates);

        const nextStep =
          "nextStep" in data && data.nextStep ? data.nextStep : currentStep;
        if (nextStep && STEPS.includes(nextStep)) {
          setStepIndex(STEPS.indexOf(nextStep));
        }

        const updatedStart =
          updates?.travel_dates?.exact_start ??
          exactStartRef.current ??
          exactStartDate;
        const updatedEnd = updates?.travel_dates?.exact_end ?? exactEndDate;

        if (nextStep === "confirm" && updatedStart && updatedEnd) {
          exactStartRef.current = updatedStart;
          setExactStartDate(updatedStart);
          setExactEndDate(updatedEnd);
          const context = buildTripContext(true);
          context.travel_dates.exact_start = updatedStart;
          context.travel_dates.exact_end = updatedEnd;
          sessionStorage.setItem("tripContext", JSON.stringify(context));
          router.push("/new-trip/loading");
          return;
        }

        addTranscript("agent", reply);
        askNext(reply);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong. Try again.",
        );
        askNext("I hit a snag. Could you try that again?");
      } finally {
        requestInFlightRef.current = false;
        const queued = queuedUtteranceRef.current;
        if (queued) {
          queuedUtteranceRef.current = null;
          setTimeout(() => {
            void handleUserUtterance(queued);
          }, 0);
        }
      }
    },
    [
      currentStep,
      exactStartDate,
      askNext,
      addTranscript,
      router,
      buildTripContext,
      applyTripContextUpdates,
      exactEndDate,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }
      setInterimText(interim);
      if (isSpeaking && (interim.length > 8 || finalText.length > 0)) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }

      const finalize = (utterance: string) => {
        if (processingTimerRef.current !== null) {
          window.clearTimeout(processingTimerRef.current);
        }
        if (silenceTimerRef.current !== null) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        recognition.stop();
        setIsListening(false);
        setIsProcessing(true);
        processingTimerRef.current = window.setTimeout(() => {
          setIsProcessing(false);
          void handleUserUtterance(utterance);
        }, 450);
      };

      if (finalText) {
        finalize(finalText);
        return;
      }

      if (interim) {
        if (silenceTimerRef.current !== null) {
          window.clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          finalize(interim);
        }, 900);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      const code = event?.error;
      if (code === "aborted") {
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        micBlockedRef.current = true;
        setError(
          "Microphone access is blocked. Please allow mic permissions and press Unmute.",
        );
      } else if (code === "no-speech") {
        setError("No speech detected. Try again.");
      } else if (code) {
        setError(`Speech recognition error: ${code}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (
        micEnabled &&
        autoListenRef.current &&
        !isSpeaking &&
        !isProcessing &&
        !micBlockedRef.current
      ) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;
    if (micEnabled) {
      try {
        recognition.start();
      } catch {
        setError(
          "Microphone could not start. Please press Unmute to try again.",
        );
      }
    }

    return () => {
      recognition.stop();
      if (processingTimerRef.current !== null) {
        window.clearTimeout(processingTimerRef.current);
      }
      if (silenceTimerRef.current !== null) {
        window.clearTimeout(silenceTimerRef.current);
      }
    };
  }, [handleUserUtterance, micEnabled, isSpeaking]);

  useEffect(() => {
    const stopMeter = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setAudioLevel(0);
    };

    const startMeter = async () => {
      if (!micEnabled || micBlockedRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        mediaStreamRef.current = stream;
        audioContextRef.current = context;
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setAudioLevel(rms);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError(
          "Microphone meter failed to start. Please check permissions."
        );
      }
    };

    if (micEnabled) {
      void startMeter();
    } else {
      stopMeter();
    }

    return () => {
      stopMeter();
    };
  }, [micEnabled]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem(
      "voiceText",
    ) as HTMLInputElement | null;
    const value = input?.value.trim() ?? "";
    if (!value) return;
    void handleUserUtterance(value);
    if (input) input.value = "";
  };

  const handleToggleMic = () => {
    setMicEnabled((prev) => {
      const next = !prev;
      autoListenRef.current = next;
      if (next) {
        micBlockedRef.current = false;
        try {
          recognitionRef.current?.start();
        } catch {
          setError(
            "Microphone could not start. Please allow mic permissions in the browser.",
          );
        }
      } else {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      return next;
    });
  };

  return (
    <section className="min-h-[calc(100vh-130px)] w-full flex items-center justify-center  rounded-[32px] p-8 md:p-10">
      <div className="flex flex-col items-center gap-3 text-center max-w-[560px]">
        <div className="w-[180px] h-[180px] rounded-full flex items-center justify-center bg-white/60 shadow-[0_18px_40px_rgba(12,45,72,0.15)]">
          <div
            className="relative w-[120px] h-[120px] rounded-full overflow-hidden transition-transform duration-75"
            style={{
              background: "var(--color-background-first)",
              transform: `scale(${1 + Math.min(audioLevel * 1.6, 0.35)})`,
            }}
          >
            {isSpeaking && (
              <div
                className="absolute rounded-full mix-blend-screen animate-[spin_6s_linear_infinite]"
                style={{
                  inset: "-40%",
                  background:
                    "conic-gradient(from 90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08), rgba(255,255,255,0.45), rgba(255,255,255,0.1))",
                }}
              />
            )}
          </div>
        </div>

        <p className="text-[0.85rem] tracking-[0.18em] uppercase text-[var(--foreground)]">
          {isSpeaking
            ? "Speaking"
            : isProcessing
              ? "Processing"
              : isListening
                ? "Listening"
                : micEnabled
                  ? "Listening..."
                  : "Mic off"}
        </p>

        {lastAgentText && (
          <p className="text-base text-[var(--foreground)] max-w-[520px]">
            {lastAgentText}
          </p>
        )}
        {(interimText || lastUserText) && (
          <p className="text-[0.95rem] text-[rgba(12,45,72,0.7)]">
            {interimText ? `“${interimText}”` : `“${lastUserText}”`}
          </p>
        )}

        {error && <p className="text-[0.9rem] text-[#b45309]">{error}</p>}

        {transcript.length > 0 && (
          <div className="mt-4 w-full max-w-[520px] rounded-2xl border border-white/50 bg-white/70 p-3 text-left text-[0.75rem] text-slate-700">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Transcript
            </p>
            <div className="mt-2 space-y-1">
              {transcript.map((entry, index) => (
                <div key={`${entry.role}-${index}`}>
                  <span className="font-semibold">
                    {entry.role === "agent" ? "Agent" : "You"}:
                  </span>{" "}
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            className="border border-[rgba(12,45,72,0.2)] bg-white text-[var(--foreground)] px-5 py-2 rounded-full text-[0.75rem] uppercase tracking-[0.12em] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(12,45,72,0.12)]"
            onClick={handleToggleMic}
          >
            {micEnabled ? "Mute" : "Unmute"}
          </button>
        </div>

        {!hasSpeechSupport && (
          <form
            className="mt-3 flex gap-2 w-full justify-center"
            onSubmit={handleManualSubmit}
          >
            <input
              type="text"
              name="voiceText"
              placeholder="Type your response..."
              className="w-[min(420px,70vw)] rounded-full border border-[rgba(12,45,72,0.25)] px-4 py-2 text-[0.95rem] bg-white"
            />
            <button
              type="submit"
              className="border border-[rgba(12,45,72,0.2)] bg-white text-[var(--foreground)] px-5 py-2 rounded-full text-[0.75rem] uppercase tracking-[0.12em] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(12,45,72,0.12)]"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
