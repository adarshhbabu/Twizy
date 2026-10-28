import React, { useEffect, useState } from 'react';
import { TwizyEvent } from '../types';
import { Phone, PhoneOff, Volume2, ShieldAlert, Clock, MapPin } from 'lucide-react';
import { startRingtone, stopRingtone, speakText, stopSpeech } from '../utils/audioRing';

interface FakeCallModalProps {
  event: TwizyEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FakeCallModal: React.FC<FakeCallModalProps> = ({ event, isOpen, onClose }) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) {
      stopRingtone();
      stopSpeech();
      setCallState('ringing');
      setCallDuration(0);
      setTranscript('');
      setAudioReady(false);
      return;
    }

    setCallState('ringing');
    setAudioReady(false);
    startRingtone();

    return () => {
      stopRingtone();
      stopSpeech();
    };
  }, [isOpen, event]);

  useEffect(() => {
    let interval: number | null = null;
    if (callState === 'connected') {
      interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  if (!isOpen || !event) return null;

  const eventTitle = event.title;
  const location = event.location || 'Campus venue';
  const startMins = event.start_time;

  const spokenMessage = `Hey! Wake up. Your must-attend ${event.type === 'graded' ? 'graded exam' : 'event'} ${eventTitle} starts at ${startMins}. Grab your stuff and move right now, you have 10 minutes transit buffer.`;

  const handleAnswer = () => {
    stopRingtone();
    setCallState('connected');
    setTranscript(spokenMessage);
    speakText(spokenMessage, () => {
      // call can linger for user to hang up
    });
  };

  const handleStartAudio = () => {
    startRingtone();
    setAudioReady(true);
  };

  const handleDecline = () => {
    stopRingtone();
    stopSpeech();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white flex flex-col items-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header indicator */}
        <div className="w-12 h-1 bg-neutral-700 rounded-full mb-6" />

        {/* Incoming or Connected State */}
        {callState === 'ringing' ? (
          <div className="flex flex-col items-center text-center my-4">
            {/* Animated avatar pulse */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg animate-bounce">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-3xl font-extrabold tracking-wider text-emerald-400">
                  TZ
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Twizy</h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mt-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              Must-Attend Alert Call
            </p>

            <div className="mt-5 p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 w-full text-left">
              <div className="text-xs text-neutral-400 font-medium flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Starts in &lt; 20 mins ({startMins} IST)</span>
              </div>
              <div className="text-sm font-semibold text-neutral-200 line-clamp-1">{eventTitle}</div>
              <div className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-neutral-500" />
                <span>{location}</span>
              </div>
            </div>

            <div className="text-xs text-neutral-400 mt-4 italic">
              "Your calendar remembers. Your buddy reacts."
            </div>

            {!audioReady && (
              <button
                onClick={handleStartAudio}
                className="mt-4 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-200 cursor-pointer"
              >
                Tap to start ringtone
              </button>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between w-full mt-10 px-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleDecline}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-rose-900/40 text-white cursor-pointer"
                  title="Decline"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-xs text-neutral-400">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleAnswer}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white cursor-pointer"
                  title="Answer"
                >
                  <Phone className="w-7 h-7 animate-pulse" />
                </button>
                <span className="text-xs text-neutral-400">Answer</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center my-4 w-full">
            <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-emerald-500 flex items-center justify-center text-2xl font-bold text-emerald-400 mb-4">
              TZ
            </div>
            <h2 className="text-xl font-bold text-neutral-100">Twizy Voice Heads-Up</h2>
            <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Connected: {formatSeconds(callDuration)}
            </div>

            {/* Audio wave animation */}
            <div className="flex items-center justify-center gap-1.5 h-10 my-4">
              {[40, 70, 90, 60, 100, 50, 80, 45].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>

            {/* Live spoken transcript box */}
            <div className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700 w-full text-left">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Twizy Voice Output</span>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed font-sans">{transcript}</p>
            </div>

            <button
              onClick={handleDecline}
              className="mt-8 px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-900/40 cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Hang Up</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
