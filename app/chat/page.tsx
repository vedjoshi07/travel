'use client';
/**
 * AI Command Center — structured, parse-confirm, then plan.
 *
 * Why this isn't a chat-bubble UI: a generic chatbot interface hides what the
 * AI actually understood. NEXUS shows the parsed constraints as chips
 * (budget, mood, time, walking) *before* generating the itinerary, so the
 * user can see the model understood their request. The brief calls this out
 * as the strongest existing pattern — keep it distinct, not chat-bubbly.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RefreshCw, Wand2, Check } from 'lucide-react';
import { generateItineraryWithGemini } from '@/lib/itinerary/gemini-itinerary';
import { generateItinerary as generateMockItinerary } from '@/lib/itinerary/mock-itinerary';
import { parsePrompt } from '@/lib/itinerary/parse-prompt';
import { formatCurrency } from '@/lib/locale';
import type { ItineraryResponse } from '@/lib/itinerary/mock-itinerary';
import { TimelinePlanner } from '@/components/timeline-planner/TimelinePlanner';
import { NexusRing } from '@/components/nexus-ring/NexusRing';
import { useAppStore } from '@/lib/store/app-store';

let messageCounter = 1;

const QUICK_PROMPTS = [
  { icon: '🌅', text: 'Peaceful evening under ₹500' },
  { icon: '🏛️', text: 'Quick cultural visit, 1 hour' },
  { icon: '🌹', text: 'Romantic dinner, ₹2000 budget' },
  { icon: '🌊', text: 'Free morning walk outdoors' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  parsed?: ReturnType<typeof parsePrompt>;
  itinerary?: ItineraryResponse;
  /** Set to true if generation succeeded. */
  ok?: boolean;
}

function ChipList({ parsed, locale, currency, hour12 }: {
  parsed: ReturnType<typeof parsePrompt>;
  locale: string;
  currency: string;
  hour12: boolean;
}) {
  const chips: { id: string; label: string }[] = [];
  if (parsed.budgetInr != null) {
    chips.push({ id: 'budget', label: formatCurrency(parsed.budgetInr, { locale: locale as never, currency: currency as never, distanceUnit: 'km', hour12 }) });
  }
  if (parsed.durationHours != null) {
    chips.push({ id: 'time', label: parsed.durationHours < 1 ? `${Math.round(parsed.durationHours * 60)} min` : `${parsed.durationHours}h` });
  }
  if (parsed.timeOfDay) {
    chips.push({ id: 'tod', label: parsed.timeOfDay });
  }
  for (const m of parsed.mood) chips.push({ id: `mood-${m}`, label: m });
  if (chips.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      {chips.map((c) => (
        <span key={c.id} className="chip" data-tone="beacon">
          <Check size={10} aria-hidden="true" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      style={{ display: 'flex', gap: 4, padding: '10px 14px' }}
      aria-label="AI is thinking"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--beacon)',
          }}
        />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputId = 'chat-input';
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const showColdStart = messages.length === 0;

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const parsed = parsePrompt(trimmed);
    const userMsg: Message = { id: `msg-${messageCounter++}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      let itinerary: ItineraryResponse;
      try {
        itinerary = await generateItineraryWithGemini(trimmed);
      } catch {
        // Fall back to deterministic mock so the demo never hits a dead end.
        itinerary = generateMockItinerary(parsed);
      }
      const aiMsg: Message = {
        id: `msg-${messageCounter++}`,
        role: 'assistant',
        parsed,
        itinerary,
        ok: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `msg-${messageCounter++}`,
        role: 'assistant',
        parsed,
        text: "I couldn't generate a plan right now. Try a shorter request, or check that NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local.",
        ok: false,
      }]);
    }
    setIsThinking(false);
  }

  function handleReset() {
    setMessages([]);
    setInput('');
    setIsThinking(false);
  }

  const localeSettings = locale;
  const hasUserText = input.trim().length > 0;
  const inputTokens = useMemo(() => parsePrompt(input), [input]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: 720,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div
        style={{
          padding: '52px 16px 12px',
          background: 'var(--ink)',
          backgroundImage: 'linear-gradient(to bottom, var(--ink) 80%, transparent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'var(--beacon)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(242, 184, 75, 0.35)',
          }}>
            <Sparkles size={16} color="#1A1300" aria-hidden="true" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Command Center</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Powered by NEXUS AI</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: 44 }}
          aria-label="Reset conversation"
          id="chat-reset-btn"
        >
          <RefreshCw size={12} aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Messages / empty state */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <AnimatePresence initial={false}>
          {showColdStart && (
            <motion.div
              key="cold-start"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '1rem 0',
              }}
              aria-label="AI Command Center — cold start"
            >
              <span className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>
                <Wand2 size={10} aria-hidden="true" />
                Try one
              </span>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}>
                Tell me your plans.<br />
                <span style={{ color: 'var(--beacon)' }}>I&apos;ll plan the rest.</span>
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Mention budget, mood, time available, or the vibe — I&apos;ll parse it, confirm it back as chips,
                then build a live itinerary using the city&apos;s real crowd, weather, and traffic data.
              </p>
              <div role="list" aria-label="Example prompts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <motion.button
                    key={p.text}
                    role="listitem"
                    onClick={() => handleSend(p.text)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="card"
                    style={{
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      minHeight: 64,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                    aria-label={`Use example prompt: ${p.text}`}
                  >
                    <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{p.icon}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.3, fontWeight: 500 }}>
                      {p.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'user' ? (
                <div style={{
                  background: 'var(--beacon)',
                  color: '#1A1300',
                  padding: '10px 14px',
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: '0.85rem',
                  maxWidth: '85%',
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}>
                  {msg.text}
                </div>
              ) : (
                <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  {/* AI parses the request — chips confirm what we understood */}
                  {msg.parsed && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--surface)',
                      border: '1px solid var(--beacon-border)',
                      borderRadius: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Check size={12} color="var(--beacon)" aria-hidden="true" />
                        <span className="text-label" style={{ color: 'var(--beacon)' }}>
                          Got it — building your plan around
                        </span>
                      </div>
                      <ChipList
                        parsed={msg.parsed}
                        locale={localeSettings.locale}
                        currency={localeSettings.currency}
                        hour12={localeSettings.hour12}
                      />
                    </div>
                  )}
                  {/* AI text bubble (only when there's a message AND no itinerary) */}
                  {msg.text && !msg.itinerary && (
                    <div className="card" style={{
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                  )}
                  {msg.itinerary && (
                    <div className="card" style={{ padding: 14 }}>
                      <TimelinePlanner
                        steps={msg.itinerary.steps}
                        totalCostInr={msg.itinerary.totalCostInr}
                        matchedPreferences={msg.itinerary.matchedPreferences}
                        summary={msg.itinerary.summary}
                      />
                      {/* Per-step rings — one of the brief's signature asks */}
                      {msg.itinerary.steps.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 10,
                            marginTop: 12,
                            padding: '12px 14px',
                            background: 'var(--surface-2)',
                            borderRadius: 12,
                            flexWrap: 'wrap',
                          }}
                          aria-label="Step scores"
                        >
                          {msg.itinerary.steps.slice(0, 4).map((s, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <NexusRing
                                value={Math.min(100, Math.max(0, 100 - (s.costInr ?? 0) / 20))}
                                tone="beacon"
                                size="sm"
                                ariaLabel={`Step ${i + 1} score`}
                              />
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                Stop {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card"
            style={{ padding: '4px 8px', alignSelf: 'flex-start' }}
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar — always visible so users know they can type */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(var(--nav-height) + 12px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--ink)',
        backgroundImage: 'linear-gradient(to top, var(--ink) 80%, transparent)',
        borderTop: '1px solid var(--hairline)',
        flexShrink: 0,
      }}>
        {/* Live parsed chips while the user types */}
        {hasUserText && (inputTokens.budgetInr != null || inputTokens.durationHours != null || inputTokens.mood.length > 0) && (
          <div style={{ marginBottom: 8 }}>
            <ChipList
              parsed={inputTokens}
              locale={localeSettings.locale}
              currency={localeSettings.currency}
              hour12={localeSettings.hour12}
            />
          </div>
        )}
        <div className="card" style={{
          display: 'flex',
          gap: 10,
          padding: '8px 8px 8px 14px',
          alignItems: 'flex-end',
        }}>
          <label htmlFor={inputId} className="sr-only">
            Message NEXUS AI
          </label>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="I have 2 hours and ₹800, want something peaceful…"
            rows={1}
            aria-label="Describe your plans — budget, mood, time"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: 100,
              overflowY: 'auto',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!hasUserText || isThinking}
            id="chat-send-btn"
            aria-label="Send message"
            className="btn-primary"
            style={{ padding: '0.5rem 0.75rem', minHeight: 44 }}
          >
            <Send size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}