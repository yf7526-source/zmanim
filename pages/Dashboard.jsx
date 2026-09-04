import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Clock, CheckCircle2, TrendingUp, ArrowLeft, Trash2, Eye, Reply, X, Send, Loader2, BarChart3, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AnalyticsTab from '@/components/AnalyticsTab';
import LocationsTab from '@/components/LocationsTab';
import { useLanguage } from '@/lib/LanguageContext';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [tab, setTab] = useState('messages');
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { lang } = useLanguage();
  const he = lang === 'he';

  useEffect(() => {
    base44.auth.me()
      .then(user => setIsAdmin(user?.role === 'admin'))
      .catch(() => setIsAdmin(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const loadMessages = useCallback(() => {
    setLoading(true);
    base44.entities.ContactMessage.list('-created_date', 100)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAdmin) loadMessages();
  }, [loadMessages, isAdmin]);

  const total = messages.length;
  const newCount = messages.filter(m => m.status === 'new').length;
  const readCount = messages.filter(m => m.status === 'read').length;
  const repliedCount = messages.filter(m => m.status === 'replied').length;

  const stats = [
    { label: 'Total Messages', labelHe: 'סה״כ הודעות', value: total, icon: Mail, color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-400/30' },
    { label: 'New', labelHe: 'חדשות', value: newCount, icon: Clock, color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-400/30' },
    { label: 'Read', labelHe: 'נקראו', value: readCount, icon: MessageSquare, color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-400/30' },
    { label: 'Replied', labelHe: 'נענו', value: repliedCount, icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-400/30' },
  ];

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.ContactMessage.update(id, { status });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch {}
  };

  const deleteMessage = async (id) => {
    try {
      await base44.entities.ContactMessage.delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {}
  };

  const openMessage = (msg) => {
    setSelected(msg);
    setReplyMode(false);
    setReplyText('');
    setSendError('');
    if (msg.status === 'new') updateStatus(msg.id, 'read');
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await base44.functions.invoke('sendEmailReply', {
        to: selected.email,
        subject: `Re: Your message to Zmanim`,
        body: replyText,
        recipientName: selected.name,
      });
      await updateStatus(selected.id, 'replied');
      setReplyMode(false);
      setReplyText('');
    } catch (e) {
      setSendError(e?.response?.data?.error || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filtered = filter === 'all' ? messages : messages.filter(m => m.status === filter);

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString(he ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen px-5 py-8 max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-400/30 flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-300" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{he ? 'אין הרשאה' : 'Access Denied'}</h1>
        <p className="text-sm text-white/50 mb-6">{he ? 'אין לך הרשאה לצפות בדף זה.' : "You don't have permission to view this page."}</p>
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-sm font-bold hover:bg-yellow-500/30 transition-all">
          <ArrowLeft className="w-4 h-4" /> {he ? 'חזרה לזמנים' : 'Back to Zmanim'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-yellow-300/70 hover:text-yellow-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {he ? 'חזרה לזמנים' : 'Back to Zmanim'}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-400/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-yellow-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white glow-text">{he ? 'לוח בקרה למנהל' : 'Admin Dashboard'}</h1>
          <p className="text-xs text-white/40">{he ? 'נהל הודעות טופס יצירת קשר' : 'Manage contact form submissions'}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab('messages')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'messages' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
        >
          <Mail className="w-3.5 h-3.5" /> {he ? 'הודעות' : 'Messages'}
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'analytics' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> {he ? 'ניתוח' : 'Analytics'}
        </button>
        <button
          onClick={() => setTab('locations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'locations' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
        >
          <MapPin className="w-3.5 h-3.5" /> {he ? 'מיקומים' : 'Locations'}
        </button>
      </div>

      {tab === 'analytics' && <AnalyticsTab lang={lang} />}

      {tab === 'locations' && <LocationsTab lang={lang} />}

      {tab === 'messages' && (
      <>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.label.toLowerCase() ? 'all' : s.label.toLowerCase())}
            className={`rounded-2xl border p-4 text-left transition-all card-hover ${s.border} ${s.bg} ${filter === s.label.toLowerCase() ? 'ring-2 ring-yellow-400/50' : ''}`}
          >
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{loading ? '–' : s.value}</p>
            <p className="text-xs text-white/50 mt-0.5">{he ? s.labelHe : s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'new', 'read', 'replied'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
          >
            {he ? ({ all: 'הכל', new: 'חדשות', read: 'נקראו', replied: 'נענו' })[f] : f}
          </button>
        ))}
      </div>

      {/* Messages list */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">{he ? 'לא נמצאו הודעות' : 'No messages found'}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div
                key={m.id}
                onClick={() => openMessage(m)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/8 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white/90 truncate">{m.name}</p>
                    {m.status === 'new' && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/40 truncate">{m.message}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{fmtDate(m.created_date)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  m.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                  m.status === 'read' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full md:max-w-lg rounded-t-3xl md:rounded-3xl border border-white/15 bg-[#0f2035] p-5 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{he ? 'הודעה' : 'Message'}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{he ? 'מאת' : 'From'}</p>
                <p className="text-sm font-semibold text-white">{selected.name}</p>
                <a href={`mailto:${selected.email}`} className="text-xs text-yellow-300/80 hover:text-yellow-300">{selected.email}</a>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{he ? 'התקבל' : 'Received'}</p>
                <p className="text-xs text-white/60">{fmtDate(selected.created_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{he ? 'הודעה' : 'Message'}</p>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
            </div>

            {/* Reply composer */}
            {replyMode && (
              <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-yellow-200">{he ? 'השב אל' : 'Reply to'} {selected.email}</p>
                  <button onClick={() => { setReplyMode(false); setReplyText(''); setSendError(''); }} className="p-1 rounded-lg bg-white/8 hover:bg-white/15 transition-all">
                    <X className="w-3.5 h-3.5 text-white/50" />
                  </button>
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder={he ? 'הקלד את תגובתך...' : 'Type your reply...'}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/50 transition-all resize-none mb-2"
                />
                {sendError && <p className="text-xs text-red-400 mb-2">{sendError}</p>}
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-yellow-500/25 border border-yellow-400/50 text-yellow-100 text-xs font-bold hover:bg-yellow-500/35 transition-all disabled:opacity-40"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sending ? (he ? 'שולח...' : 'Sending...') : (he ? 'שלח תגובה באימייל' : 'Send Email Reply')}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setReplyMode(!replyMode); setSendError(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-xs font-bold hover:bg-yellow-500/30 transition-all"
              >
                <Reply className="w-3.5 h-3.5" /> {replyMode ? (he ? 'בטל תגובה' : 'Cancel Reply') : (he ? 'השב באימייל' : 'Reply by Email')}
              </button>
              {selected.status !== 'read' && (
                <button
                  onClick={() => updateStatus(selected.id, 'read')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-200 text-xs font-bold hover:bg-purple-500/25 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> {he ? 'סמן כנקרא' : 'Mark Read'}
                </button>
              )}
              {selected.status !== 'replied' && (
                <button
                  onClick={() => updateStatus(selected.id, 'replied')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {he ? 'סמן כנענה' : 'Mark Replied'}
                </button>
              )}
              <button
                onClick={() => deleteMessage(selected.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs font-bold hover:bg-red-500/25 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> {he ? 'מחק' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}