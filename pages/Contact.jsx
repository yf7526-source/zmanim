import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

export default function Contact() {
  const { lang } = useLanguage();
  const he = lang === 'he';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);
    setError('');
    try {
      await base44.functions.invoke('submitContactMessage', { name, email, message });
      setSent(true);
      setName(''); setEmail(''); setMessage('');
    } catch {
      setError(he ? 'השליחה נכשלה. נסה שוב מאוחר יותר.' : 'Could not send. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main id="main-content" dir={he ? 'rtl' : 'ltr'} className="min-h-screen px-5 py-10 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-yellow-300/70 hover:text-yellow-300 mb-8 transition-colors">
        ← {he ? 'חזרה לזמנים' : 'Back to Zmanim'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6 glow-text">{he ? 'צור קשר' : 'Contact Us'}</h1>

      <p className="text-white/60 leading-relaxed mb-8">
        {he
          ? 'יש לכם שאלה, משוב או בקשת תכונה? נשמח לשמוע מכם. פנו אלינו בטופס או במייל ישירות.'
          : "Have a question, feedback, or a feature request? We'd love to hear from you. Reach out using the form below or email us directly."}
      </p>

      <div className="rounded-2xl bg-white/4 border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-3 text-white/80">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-400/25 flex items-center justify-center">
            <Mail className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <p className="text-sm font-semibold">{he ? 'שלחו לנו הודעה' : 'Send us a message'}</p>
            <p className="text-xs text-white/40">{he ? 'בדרך כלל עונים תוך 48 שעות' : 'We typically respond within 48 hours'}</p>
          </div>
        </div>
      </div>

      {sent ? (
        <div className="rounded-2xl bg-green-500/10 border border-green-400/30 p-5 text-center">
          <p className="text-green-300 font-semibold">{he ? '✓ ההודעה נשלחה! נחזור אליך בקרוב.' : "✓ Message sent! We'll get back to you soon."}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">{he ? 'שם' : 'Name'}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">{he ? 'אימייל' : 'Email'}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">{he ? 'הודעה' : 'Message'}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-yellow-500/20 border border-yellow-400/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-semibold text-yellow-200">
              {sending ? (he ? 'שולח…' : 'Sending…') : (he ? 'שלח הודעה' : 'Send Message')}
            </span>
          </button>
        </form>
      )}
    </main>
  );
}