import React from 'react';
import { X, Clock, Bell, MapPin, Repeat, FileText, Trash2, Edit3, Calendar } from 'lucide-react';
import { RECURRENCE_LABELS, REMINDER_LABELS } from '../lib/customEvents';

function tr(text, lang) {
  return typeof text === 'string' ? text : (lang === 'he' ? text.he : text.en);
}

export default function EventDetailSheet({ event, date, lang = 'both', onClose, onEdit, onDelete }) {
  if (!event || !date) return null;

  const locale = lang === 'he' ? 'he-IL' : 'en-US';
  const dateStr = date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const color = event.color || '#dbeafe';

  const recurrenceLabel = event.recurrence && event.recurrence !== 'none'
    ? tr(RECURRENCE_LABELS[event.recurrence] || RECURRENCE_LABELS.none, lang)
    : null;

  const reminderLabel = event.reminder
    ? tr(REMINDER_LABELS[event.reminderMinutes ?? 15] || REMINDER_LABELS[15], lang)
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-700" />
              {lang === 'he' ? 'פרטי אירוע' : 'Event Details'}
            </h3>
            <button onClick={onClose} aria-label="Close event details" className="p-1.5 rounded-lg bg-white/40 hover:bg-white/60"><X className="w-4 h-4 text-gray-700" /></button>
          </div>
          <p className="text-lg font-bold text-gray-900" dir="rtl">{event.title}</p>
          <p className="text-xs text-gray-700 font-medium">{dateStr}</p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{event.time}</span>
            </div>
          )}
          {reminderLabel && (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-sm text-gray-700">{reminderLabel}</span>
            </div>
          )}
          {recurrenceLabel && (
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-sm text-gray-700">{recurrenceLabel}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-gray-700">{event.location}</span>
            </div>
          )}
          {event.description && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t border-gray-100">
          {onDelete ? (
            <button onClick={onDelete} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100">
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'he' ? 'מחק' : 'Delete'}
            </button>
          ) : <div />}
          {onEdit && (
            <button onClick={onEdit} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
              <Edit3 className="w-3.5 h-3.5" />
              {lang === 'he' ? 'ערוך' : 'Edit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}