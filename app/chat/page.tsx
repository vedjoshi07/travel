'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { generateItineraryWithGemini } from '@/lib/itinerary/gemini-itinerary';
import type { ItineraryResponse } from '@/lib/itinerary/mock-itinerary';
import { TimelinePlanner } from '@/components/timeline-planner/TimelinePlanner';

let messageCounter = 1;

const QUICK_PROMPTS = [
  'Plan a peaceful evening with ₹500 budget for 2 hours',
  'Suggest a quick cultural visit this afternoon',
  'Find a romantic dinner spot, up to ₹2000, quiet atmosphere',
  'A budget-friendly morning walk with free activities',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  itinerary?: ItineraryResponse;
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }}
        />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '👋 Tell me your plans — budget, mood, time available — and I\'ll craft a smart itinerary for you.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function handleSend(text: string) {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = { id: `msg-${messageCounter++}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const itinerary = await generateItineraryWithGemini(text);
      const aiMsg: Message = {
        id: `msg-${messageCounter++}`,
        role: 'assistant',
        text: itinerary.summary,
        itinerary,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback: show a friendly error
      const aiMsg: Message = {
        id: `msg-${messageCounter++}`,
        role: 'assistant',
        text: "I couldn't generate a plan right now. Make sure you've set your Gemini API key in `.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
    setIsThinking(false);
  }

  function handleReset() {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: '👋 Tell me your plans — budget, mood, time available — and I\'ll craft a smart itinerary for you.',
    }]);
    setInput('');
    setIsThinking(false);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 16px 12px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-accent), #6A4CE8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="white" aria-hidden="true" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Command Center</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Powered by NEXUS AI</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          aria-label="Reset conversation"
          id="chat-reset-btn"
        >
          <RefreshCw size={12} aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <AnimatePresence initial={false}>
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
                  background: 'linear-gradient(135deg, var(--color-accent), #6A4CE8)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: '0.85rem',
                  maxWidth: '80%',
                  lineHeight: 1.5,
                  boxShadow: '0 4px 16px rgba(123,92,250,0.3)',
                }}>
                  {msg.text}
                </div>
              ) : (
                <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* AI text bubble */}
                  {msg.text && (
                    <div className="glass-card" style={{
                      padding: '10px 14px',
                      borderRadius: '4px 18px 18px 18px',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}>
                      <Sparkles size={13} color="var(--color-accent-glow)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      {msg.text}
                    </div>
                  )}
                  {/* Itinerary */}
                  {msg.itinerary && (
                    <div className="glass-card" style={{ padding: 14 }}>
                      <TimelinePlanner
                        steps={msg.itinerary.steps}
                        totalCostInr={msg.itinerary.totalCostInr}
                        matchedPreferences={msg.itinerary.matchedPreferences}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card"
            style={{ padding: '4px 8px', borderRadius: '4px 18px 18px 18px', alignSelf: 'flex-start' }}
            aria-label="AI is thinking"
            role="status"
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: 100,
                padding: '6px 12px',
                fontSize: '0.72rem',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(var(--nav-height) + 12px)',
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-surface-border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 18,
          padding: '8px 8px 8px 14px',
          alignItems: 'flex-end',
        }}>
          <MessageSquare size={16} color="var(--color-text-muted)" style={{ marginBottom: 6, flexShrink: 0 }} aria-hidden="true" />
          <textarea
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
            id="chat-input"
            aria-label="Message NEXUS AI"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: 100,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isThinking}
            id="chat-send-btn"
            aria-label="Send message"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: input.trim() && !isThinking
                ? 'linear-gradient(135deg, var(--color-accent), #6A4CE8)'
                : 'var(--color-surface-border)',
              border: 'none',
              cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s ease',
            }}
          >
            <Send size={14} color="white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
