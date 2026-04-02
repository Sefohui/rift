import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/settingsStore';

function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const soundSettings = useAppStore((s) => s.settings.sound);

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = createAudioContext();
    }
    return ctxRef.current;
  }

  function vol(): number {
    return (soundSettings.volume ?? 60) / 100;
  }

  function beep(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.3,
    startDelay = 0,
  ) {
    const ctx = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);
    gain.gain.setValueAtTime(gainVal * vol(), ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration);
  }

  // Neutral click when taking a split
  const playSplit = useCallback(() => {
    if (!soundSettings.split) return;
    beep(440, 0.055, 'square', 0.18);
  }, [soundSettings]);

  // Quick ascending ding when split is faster than PB
  const playSplitFaster = useCallback(() => {
    if (!soundSettings.splitFaster) return;
    beep(660, 0.10, 'sine', 0.28);
    beep(900, 0.14, 'sine', 0.22, 0.09);
  }, [soundSettings]);

  // ── Run complete faster than PB ──────────────────────────────────
  // Bright, triumphant ascending fanfare: 5 notes up, then a long high note
  const playRunComplete = useCallback(() => {
    if (!soundSettings.runComplete) return;
    // Rising arpeggio: C5 → E5 → G5 → C6 → E6
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      beep(freq, 0.22, 'triangle', 0.28, i * 0.10);
    });
    // Final long bright note
    beep(1319, 0.55, 'sine', 0.22, notes.length * 0.10);
  }, [soundSettings]);

  // ── Run complete slower than PB ──────────────────────────────────
  // Slow, descending "sad trombone" – lower frequencies, sawtooth for grit
  const playRunSlow = useCallback(() => {
    if (!soundSettings.runSlow) return;
    // Descending: Bb4 → G4 → Eb4 → Bb3 (minor feel)
    beep(466, 0.30, 'sawtooth', 0.20, 0.00);
    beep(392, 0.35, 'sawtooth', 0.18, 0.28);
    beep(311, 0.40, 'sawtooth', 0.16, 0.58);
    beep(233, 0.60, 'sawtooth', 0.14, 0.90);
  }, [soundSettings]);

  return { playSplit, playSplitFaster, playRunComplete, playRunSlow };
}
