import React, { useState, useEffect } from 'react';
import { X, Trash2, Repeat, Bell, MapPin, FileText } from 'lucide-react';
import { EVENT_TEMPLATES, getTemplateLabel } from './EventTemplates';
import { RECURRENCE_LABELS, REMINDER_LABELS } from '../lib/customEvents';

const EVENT_COLORS = [
  { value: '#dbeafe', name: 'Blue' },
  { value: '#fce7f3', name: 'Pink' },
  { value: '#dcfce7', name: 'Green' },
  { value: '#fef3c7', name: 'Yellow' },
  { value: '#e0e7ff', name: 'Indigo' },
  { value: '#fee2e2', name: 'Red' },
  { value: '#d1fae5', name: 'Mint' },
  { value: '#f3e8ff', name: 'Purple' },
  { value: '#fed7aa', name: 'Orange' },
  { value: '#cffafe', name: 'Cyan' },
];

const REMINDER_VALUES = [0, 5, 10, 15, 30, 60, 1440];
const RECURRENCE_VALUES = ['none', 'daily', 'weekly', 'monthly'];

function tr(text, lang) {
  return typeof text === 'string' ? text : (lang === 'he' ? text.he : text.en);
}

export default function CustomEventEditor({ open, onClose, date, event, onSave, onDelete, lang = 'both' }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [color, setColor] = useState('#dbeafe');
  const [recurrence, setRecurrence] = useState('none');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setTime(event.time || '');
      setReminder(event.reminder || false);
      setReminderMinutes(event.reminderMinutes ?? 15);
      setColor(event.color || '#dbeafe');
      setRecurrence(event.recurrence || 'none');
      setLocation(event.location || '');
      setDescription(event.description || '');
    } else {
      setTitle(''); setTime(''); setReminder(false); setReminderMinutes(15);
      setColor('#dbeafe'); setRecurrence('none'); setLocation(''); setDescription('');
    }
  }, [event, open]);

  if (!open || !date) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: event?.id || `ce_${Date.now()}`,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      title: title.trim(),
      time: time || null,
      reminder,
      reminderMinutes: reminder ? reminderMinutes : null,
      color,
      recurrence,
      location: location.trim() || null,
      description: description.trim() || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) onDelete(event.id);
    onClose();
  };

  const dateStr = date.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isEdit = !!event;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-gray-900">
              {isEdit ? (lang === 'he' ? 'עריכת אירוע' : 'Edit Event') : (lang === 'he' ? 'הוספת אירוע' : 'Add Event')}
            </h3>
            <button onClick={onClose} aria-label="Close event editor" className="p-1.5 rounded-lg bg-white/40 hover:bg-white/60"><X className="w-4 h-4 text-gray-700" /></button>
          </div>
          <p className="text-xs text-gray-700 font-medium">{dateStr}</p>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Quick templates */}
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                {lang === 'he' ? 'תבניות מהירות' : 'Quick Templates'}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {EVENT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTitle(getTemplateLabel(tpl, lang));
                      if (tpl.time) setTime(tpl.time);
                      setReminder(tpl.reminder);
                    }}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-medium text-gray-600 hover:text-indigo-700 transition-all flex items-center gap-1"
                  >
                    <span>{tpl.icon}</span>
                    <span>{getTemplateLabel(tpl, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              {lang === 'he' ? 'כותרת' : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={lang === 'he' ? 'שם האירוע' : 'Event title'}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              {lang === 'he' ? 'שעה' : 'Time'}
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 mb-2">
              <input
                type="checkbox"
                checked={reminder}
                onChange={e => setReminder(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <Bell className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">
                {lang === 'he' ? 'תזכורת' : 'Reminder'}
              </span>
            </label>
            {reminder && (
              <select
                value={reminderMinutes}
                onChange={e => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {REMINDER_VALUES.map(v => (
                  <option key={v} value={v}>{tr(REMINDER_LABELS[v], lang)}</option>
                ))}
              </select>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-indigo-500" />
              {lang === 'he' ? 'חזרה' : 'Repeat'}
            </label>
            <div className="flex gap-1.5">
              {RECURRENCE_VALUES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={`flex-1 px-2 py-2 rounded-xl border-2 text-xs font-bold transition-all ${recurrence === r ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {tr(RECURRENCE_LABELS[r], lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              {lang === 'he' ? 'מיקום' : 'Location'}
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={lang === 'he' ? 'מיקום אופציונלי' : 'Optional location'}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              {lang === 'he' ? 'הערות' : 'Notes'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === 'he' ? 'הערות נוספות...' : 'Additional notes...'}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              {lang === 'he' ? 'צבע' : 'Color'}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.value ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
          {isEdit ? (
            <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100">
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'he' ? 'מחק' : 'Delete'}
            </button>
          ) : <div />}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all"
          >
            {lang === 'he' ? 'שמור' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}