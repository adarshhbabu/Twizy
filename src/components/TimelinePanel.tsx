import React, { useState } from 'react';
import { TwizyEvent } from '../types';
import {
  Clock,
  MapPin,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Download,
  Upload,
  Plus,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Info,
  CalendarDays,
} from 'lucide-react';
import { detectConflicts, getEventTypeBadge, timeToMinutes } from '../utils/scheduleRules';
import { exportToICS, parseICSContent } from '../utils/calendarSync';

interface TimelinePanelProps {
  schedule: TwizyEvent[];
  changeLog: string[];
  currentDate: string;
  onUpdateSchedule: (newSchedule: TwizyEvent[]) => void;
  onAddChangeLog: (log: string) => void;
  onTriggerFakeCall: (event: TwizyEvent) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  schedule,
  changeLog,
  currentDate,
  onUpdateSchedule,
  onAddChangeLog,
  onTriggerFakeCall,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TwizyEvent>>({
    title: '',
    start_time: '12:00',
    duration_minutes: 60,
    type: 'class',
    priority: 3,
    must_attend: false,
    location: '',
  });

  // Unique dates in schedule
  const uniqueDates = Array.from(new Set([currentDate, ...schedule.map((e) => e.date)])).sort();

  // Filter events by selected date and sort chronologically
  const dayEvents = schedule
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  // Run real conflict detection
  const conflictInfo = detectConflicts(schedule, 10);

  const handleToggleMustAttend = (id: string) => {
    const target = schedule.find((e) => e.id === id);
    if (!target) return;
    const updated = schedule.map((e) =>
      e.id === id ? { ...e, must_attend: !e.must_attend } : e
    );
    onUpdateSchedule(updated);
    onAddChangeLog(
      `Toggled attendance for "${target.title}": ${!target.must_attend ? 'Now Marked MUST-ATTEND' : 'Optional'}.`
    );
  };

  const handleDeleteEvent = (id: string) => {
    const target = schedule.find((e) => e.id === id);
    if (!target) return;
    if (target.type === 'graded') {
      alert("Twizy rule: Fixed graded exams cannot be manually removed without instructor notice.");
      return;
    }
    const updated = schedule.filter((e) => e.id !== id);
    onUpdateSchedule(updated);
    onAddChangeLog(`Removed event "${target.title}" from timeline.`);
  };

  const handleSaveNewEvent = () => {
    if (!newEvent.title) return;
    const created: TwizyEvent = {
      id: 'custom-' + Date.now(),
      title: newEvent.title,
      date: selectedDate,
      start_time: newEvent.start_time || '12:00',
      duration_minutes: Number(newEvent.duration_minutes) || 60,
      type: newEvent.type || 'personal',
      priority: Number(newEvent.priority) || 3,
      must_attend: Boolean(newEvent.must_attend),
      source: 'Manual entry',
      location: newEvent.location || 'Campus',
    };
    onUpdateSchedule([...schedule, created]);
    onAddChangeLog(`Added "${created.title}" at ${created.start_time} (${created.type}).`);
    setIsAddingEvent(false);
    setNewEvent({
      title: '',
      start_time: '12:00',
      duration_minutes: 60,
      type: 'class',
      priority: 3,
      must_attend: false,
      location: '',
    });
  };

  const handleICSImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseICSContent(text);
        if (parsed.length > 0) {
          const formatted: TwizyEvent[] = parsed.map((p) => ({
            id: p.id || 'imp-' + Date.now(),
            title: p.title || 'Imported Class',
            date: p.date || selectedDate,
            start_time: p.start_time || '09:00',
            duration_minutes: p.duration_minutes || 60,
            type: p.type || 'class',
            priority: p.priority || 3,
            must_attend: false,
            source: 'ICS Import',
            location: p.location || 'Campus',
          }));
          onUpdateSchedule([...schedule, ...formatted]);
          onAddChangeLog(`Imported ${formatted.length} events from calendar .ics file.`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-neutral-800/80 text-neutral-100 overflow-hidden select-text">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                Timeline
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {dayEvents.length} events
                </span>
              </h2>
              <div className="text-[11px] text-neutral-400">Asia/Calcutta • Live schedule</div>
            </div>
          </div>

          {/* Sync actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportToICS(schedule)}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/60"
              title="Export .ICS for Google / Apple Calendar"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/60"
              title="Import .ICS Calendar"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".ics"
                onChange={handleICSImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1"
              title="Add Custom Event"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Date Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {uniqueDates.map((date) => {
            const isToday = date === currentDate;
            const isSelected = date === selectedDate;
            const dateObj = new Date(date + 'T00:00:00');
            const dayLabel = isToday
              ? 'Today'
              : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800'
                }`}
              >
                {dayLabel}
              </button>
            );
          })}
        </div>

        {/* Conflict Alert Banner if detected */}
        {conflictInfo.hasConflict && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[11px] uppercase tracking-wide">Transit & Overlap Notice</div>
              <div className="text-[11px] text-amber-200/90 leading-tight mt-0.5">
                Campus transit buffer between consecutive venues is under 10 minutes. Graded work is protected.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Events Vertical Timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 relative">
        {isAddingEvent && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-emerald-500/40 text-xs space-y-3 mb-4 shadow-xl">
            <div className="font-semibold text-emerald-400 flex items-center justify-between">
              <span>Add Event for {selectedDate}</span>
              <span className="text-[10px] text-neutral-400 font-normal">Twizy Smart Scheduler</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Algorithms Lecture, Canteen Catchup..."
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Start Time (24h):</label>
                <input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Duration (minutes):</label>
                <input
                  type="number"
                  value={newEvent.duration_minutes}
                  onChange={(e) => setNewEvent({ ...newEvent, duration_minutes: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Event Type:</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                >
                  <option value="class">Class</option>
                  <option value="graded">Graded Exam/Lab</option>
                  <option value="deadline">Deadline</option>
                  <option value="club">Club / Sport</option>
                  <option value="personal">Personal / Study</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Priority (1 to 5):</label>
                <select
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({ ...newEvent, priority: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      Priority {p} {p === 5 ? '(Locked)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Location (e.g. LH 302, Library 2F)"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none"
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-neutral-300 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEvent.must_attend}
                  onChange={(e) => setNewEvent({ ...newEvent, must_attend: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>Must Attend (Triggers Call)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingEvent(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewEvent}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl cursor-pointer shadow"
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        )}

        {dayEvents.length === 0 ? (
          <div className="py-12 px-4 text-center text-neutral-500 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="font-medium text-neutral-400">No events scheduled for {selectedDate}</p>
            <p className="text-[11px] text-neutral-600 mt-1">Tell Twizy in chat or click "+ Add" above.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-800">
            {dayEvents.map((evt) => {
              const badge = getEventTypeBadge(evt.type);
              const isGraded = evt.type === 'graded';
              const isDeadline = evt.type === 'deadline';

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 top-4 w-2.5 h-2.5 rounded-full border-2 border-neutral-950 transition-all ${
                      isGraded
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110'
                        : isDeadline
                        ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-110'
                        : 'bg-neutral-500 group-hover:bg-emerald-400'
                    }`}
                  />

                  {/* Event Card */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                      isGraded
                        ? 'bg-neutral-900/95 border-amber-500/40 shadow-sm shadow-amber-950/30'
                        : isDeadline
                        ? 'bg-neutral-900/95 border-rose-500/40 shadow-sm shadow-rose-950/30'
                        : 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        {evt.must_attend && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-400" />
                            MUST ATTEND
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {evt.must_attend && (
                          <button
                            onClick={() => onTriggerFakeCall(evt)}
                            className="px-2 py-0.5 text-[10px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Simulate Fake Call wake-up for this event"
                          >
                            <ShieldAlert className="w-3 h-3" /> Call
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleMustAttend(evt.id)}
                          className={`p-1 rounded-lg hover:bg-neutral-800 text-xs transition-colors cursor-pointer ${
                            evt.must_attend ? 'text-rose-400' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                          title={evt.must_attend ? 'Make optional' : 'Set as must-attend'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1 rounded-lg hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-neutral-100 leading-snug">
                      {evt.title}
                    </h3>

                    {/* Time & Duration */}
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
                      <span className="flex items-center gap-1.5 font-mono text-neutral-200">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        {evt.start_time} ({evt.duration_minutes}m)
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate text-neutral-400">
                          <MapPin className="w-3 h-3 text-neutral-500" />
                          {evt.location}
                        </span>
                      )}
                    </div>

                    {/* Source & Priority footer */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2.5 pt-2 border-t border-neutral-800/80">
                      <span>Source: {evt.source}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">Priority:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                idx <= evt.priority ? 'bg-emerald-400' : 'bg-neutral-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Underneath: "What changed and why" Log */}
      <div className="border-t border-neutral-800/80 bg-neutral-950 p-4 max-h-56 flex flex-col shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              What Changed and Why
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Twizy Audit Log</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {changeLog.length === 0 ? (
            <div className="text-neutral-500 text-[11px] italic py-2">
              No schedule changes recorded yet. Twizy will log conflict resolutions and moves here.
            </div>
          ) : (
            changeLog.map((log, index) => (
              <div
                key={index}
                className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/70 text-neutral-300 text-[11px] leading-relaxed flex items-start gap-2 hover:border-neutral-700/80 transition-colors"
              >
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span className="flex-1">{log}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
