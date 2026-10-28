import React from 'react';
import { StudentPreferences } from '../types';
import { X, Sliders, Shield, Bed, Coffee, Clock } from 'lucide-react';

interface PreferencesModalProps {
  preferences: StudentPreferences;
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: StudentPreferences) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  preferences,
  isOpen,
  onClose,
  onSavePreferences,
}) => {
  const [prefs, setPrefs] = React.useState<StudentPreferences>(preferences);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Student Routine & Limits</h2>
              <p className="text-xs text-neutral-400">Twizy rules for sleep, transit buffers, and tone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* Transit Buffer */}
          <div>
            <label className="font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Campus Transit Buffer (Minutes)</span>
            </label>
            <p className="text-[11px] text-neutral-500 mb-2">
              Default is 10 minutes between consecutive venues on campus.
            </p>
            <input
              type="number"
              min="0"
              max="60"
              value={prefs.transit_buffer_minutes}
              onChange={(e) =>
                setPrefs({ ...prefs, transit_buffer_minutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sleep & Wake Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
                <Bed className="w-4 h-4 text-indigo-400" />
                <span>Target Bedtime:</span>
              </label>
              <input
                type="time"
                value={prefs.sleep_start}
                onChange={(e) => setPrefs({ ...prefs, sleep_start: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Wake Up Time:</span>
              </label>
              <input
                type="time"
                value={prefs.wake_up}
                onChange={(e) => setPrefs({ ...prefs, wake_up: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs"
              />
            </div>
          </div>

          {/* Default Tone for peer messages */}
          <div>
            <label className="font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Default Message Draft Tone</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['casual', 'polite', 'formal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, default_tone: t })}
                  className={`py-2 rounded-xl capitalize font-medium transition-all cursor-pointer ${
                    prefs.default_tone === t
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rule note */}
          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 text-neutral-400 text-[11px] leading-relaxed">
            <span className="text-emerald-400 font-semibold">Core Twizy Rule:</span> Fixed classes and graded events are never pushed into your sleep window or moved without faculty notice.
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
