import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Moon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getMoonPhase, getMoonTimes } from '../../lib/sunCalc';
import { getMoladForDate, formatMoladDisplay, kiddushStatus } from '../../lib/molad';
import { formatTimeInTz } from '../../lib/timezone';

function fmtTime(date, hour12, tz) {
  return formatTimeInTz(date, tz, hour12);
}

export default function MoonChatPanel({ open, onClose, date, location, lang = 'both', hour12 = true, locationTz }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    setLoading(false);
    if (open) {
      setMessages([]);
      setInput('');
    }
  }, [open]);

  const cancelChatRequest = () => {
    requestIdRef.current += 1;
    setLoading(false);
  };

  const handleClose = () => {
    cancelChatRequest();
    onClose();
  };

  if (!open) return null;

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const moon = getMoonPhase(date);
  const moladInfo = getMoladForDate(date);
  const molad = moladInfo?.molad;
  const moladDisplay = molad ? formatMoladDisplay(molad, hour12) : null;
  const moonTimes = location ? getMoonTimes(date, location.lat, location.lng, locationTz) : null;
  const now = new Date();
  const status7 = molad ? kiddushStatus(now, molad, 7) : null;
  const status3 = molad ? kiddushStatus(now, molad, 3) : null;

  const buildContext = () => {
    const moonriseStr = moonTimes?.moonrise ? fmtTime(moonTimes.moonrise, hour12, locationTz) : 'unknown';
    const moonsetStr = moonTimes?.moonset ? fmtTime(moonTimes.moonset, hour12, locationTz) : 'unknown';
    let visibleDuration = null;
    if (moonTimes?.moonrise && moonTimes?.moonset && moonTimes.moonset > moonTimes.moonrise) {
      visibleDuration = Math.round((moonTimes.moonset.getTime() - moonTimes.moonrise.getTime()) / 3600000 * 10) / 10;
    }
    return `You are a helpful assistant specializing in the moon, lunar phases, and Jewish moon-related traditions (Kiddush Levana, molad, Rosh Chodesh). Today is ${date?.toDateString()}.

Current moon data:
- Moon phase: ${moon.phaseName.en} (${moon.phaseName.he})
- Illumination: ${moon.illumination}%
- Moon age: ${moon.age} days
- Hebrew date: ${moladInfo?.hebrewDate?.formatted || 'unknown'}
- Molad (Jerusalem time): ${moladDisplay ? `${moladDisplay.dayName}, ${moladDisplay.dateStr} at ${moladDisplay.timeStr}` : 'unknown'}
- Kiddush Levana 7-day status: ${status7?.status || 'unknown'}
- Kiddush Levana 3-day status: ${status3?.status || 'unknown'}
- Moonrise: ${moonriseStr}
- Moonset: ${moonsetStr}
- Moon visible duration: ${visibleDuration ? `${visibleDuration} hours` : 'unknown'}

Answer questions about the moon today, its phase, visibility, the molad, Kiddush Levana timing, and related topics. Be friendly, clear, and accurate. If asked about halachic decisions, suggest consulting a rabbi.`;
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const requestId = ++requestIdRef.current;
    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${buildContext()}\n\nConversation so far:\n${history}\n\nAssistant:`,
      });
      if (requestId !== requestIdRef.current) return;
      const content = typeof response === 'string' ? response.trim() : '';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: content || 'I could not generate an answer just now. Please try again.',
      }]);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The assistant is temporarily unavailable. Please try again.',
      }]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-md" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#0a111c] border-t border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 shrink-0 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
              <Moon className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {showHe && <span dir="rtl">שאל על הירח</span>}
                {lang === 'both' && ' · '}
                {showEn && <span>Ask About the Moon</span>}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">{date?.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={handleClose} aria-label="Close moon chat" className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Chat messages */}
        <div className="overflow-y-auto flex-1 px-6 pb-4 pt-4 space-y-3 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center text-white/25 text-sm py-8">
              {showEn && <p>Ask about the moon phase, visibility, molad, Kiddush Levana…</p>}
              {lang === 'both' && <br />}
              {showHe && <p dir="rtl">שאל על שלב הירח, המולד, קידוש לבנה…</p>}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-500/20 border border-blue-400/30 text-blue-100 rounded-br-md'
                  : 'bg-white/8 border border-white/8 text-white/80 rounded-bl-md'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/8 border border-white/8 px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-sm text-white/40">
                  {showEn && 'Thinking…'}
                  {lang === 'both' && ' · '}
                  {showHe && <span dir="rtl">חושב…</span>}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-white/8">
          <div className="flex gap-2">
            <input
              value={input}
              aria-label="Ask about the moon"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={lang === 'he' ? 'שאל על הירח היום…' : "Ask about today's moon…"}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-400/50 transition-all"
            />
            {loading ? (
              <button
                type="button"
                onClick={cancelChatRequest}
                aria-label="Cancel pending assistant response"
                className="px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white/60 hover:bg-white/15 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim()}
                aria-label="Send message"
                className="px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 disabled:opacity-30 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
