// Audio synthesis for Twizy realistic incoming call ringtone using Web Audio API

let audioCtx: AudioContext | null = null;
let ringInterval: number | null = null;
let activeNodes: (OscillatorNode | GainNode)[] = [];

export function startRingtone(): void {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    stopRingtone(); // ensure clean state

    // Play a repeating ring pattern: two bursts of dual-tone chords, then pause
    const playBurst = () => {
      if (!audioCtx || audioCtx.state === 'closed') return;
      const now = audioCtx.currentTime;

      const playTone = (freq1: number, freq2: number, startTime: number, duration: number) => {
        if (!audioCtx) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq1, startTime);
        osc2.frequency.setValueAtTime(freq2, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);

        activeNodes.push(osc1, osc2, gain);
      };

      // Ringing motif: 2 pulses (480Hz + 720Hz harmony)
      playTone(480, 720, now, 0.45);
      playTone(520, 780, now + 0.5, 0.45);
    };

    playBurst();
    ringInterval = window.setInterval(playBurst, 2400);
  } catch (err) {
    console.warn('Audio ringtone playback error:', err);
  }
}

export function stopRingtone(): void {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  for (const node of activeNodes) {
    try {
      if ('stop' in node) {
        (node as OscillatorNode).stop();
      }
      node.disconnect();
    } catch (e) {
      // ignore
    }
  }
  activeNodes = [];
}

export function speakText(text: string, onEnd?: () => void): void {
  try {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en')) && !v.name.includes('Whisper')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    if (onEnd) onEnd();
  }
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
