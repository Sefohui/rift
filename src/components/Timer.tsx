import React from 'react';
import { useAppStore } from '../store/settingsStore';

function formatTime(ms: number, showMs = true): string {
  if (ms < 0) ms = 0;
  const hours   = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis  = Math.floor((ms % 1000) / 10);

  const mm  = String(minutes).padStart(2, '0');
  const ss  = String(seconds).padStart(2, '0');
  const ms2 = String(millis).padStart(2, '0');

  if (hours > 0) {
    return showMs ? `${hours}:${mm}:${ss}.${ms2}` : `${hours}:${mm}:${ss}`;
  }
  return showMs ? `${mm}:${ss}.${ms2}` : `${mm}:${ss}`;
}

function formatDelta(ms: number): string {
  const sign = ms < 0 ? '−' : '+';
  const abs  = Math.abs(ms);
  const seconds = (abs / 1000).toFixed(2);
  return `${sign}${seconds}s`;
}

export function Timer() {
  const currentTime       = useAppStore((s) => s.currentTime);
  const timerState        = useAppStore((s) => s.timerState);
  const currentSplitIndex = useAppStore((s) => s.currentSplitIndex);
  const splitTimes        = useAppStore((s) => s.splitTimes);
  const settings          = useAppStore((s) => s.settings);
  const textSize          = settings.textSize;

  const splits = settings.splits;
  const pb     = settings.pb;

  let delta: number | null = null;
  let deltaColor = 'var(--text-secondary)';
  let deltaGlowClass = '';

  if (timerState === 'running' || timerState === 'paused') {
    const pbSplit = splits[currentSplitIndex];
    if (pbSplit?.pbTime != null) {
      delta = currentTime - pbSplit.pbTime;
      deltaColor     = delta < 0 ? 'var(--text-ahead)' : 'var(--text-behind)';
      deltaGlowClass = delta < 0 ? 'glow-ahead' : 'glow-behind';
    }
  } else if (timerState === 'finished' && splitTimes.length > 0) {
    const totalPb = pb?.totalTime ?? null;
    if (totalPb !== null) {
      delta = currentTime - totalPb;
      deltaColor     = delta < 0 ? 'var(--text-ahead)' : 'var(--text-behind)';
      deltaGlowClass = delta < 0 ? 'glow-ahead' : 'glow-behind';
    }
  }

  const timerFontSize =
    textSize === 'small' ? '2.2rem' : textSize === 'large' ? '3.6rem' : '2.8rem';

  // Determine timer color and glow class
  let timerColor     = 'var(--text-timer)';
  let timerGlowClass = 'timer-glow';
  let timerAnimClass = '';

  if (timerState === 'idle') {
    timerColor     = 'var(--text-secondary)';
    timerGlowClass = '';
  } else if (timerState === 'paused') {
    timerColor     = 'var(--text-accent)';
    timerGlowClass = 'timer-glow';
    timerAnimClass = 'timer-paused';
  } else if (timerState === 'finished') {
    if (delta !== null && delta < 0) {
      timerColor     = 'var(--text-ahead)';
      timerGlowClass = 'timer-glow-ahead';
    } else if (delta !== null) {
      timerColor     = 'var(--text-behind)';
      timerGlowClass = 'timer-glow-behind';
    }
  }

  const stateLabel =
    timerState === 'idle'     ? 'Ready'
    : timerState === 'running' ? splits[currentSplitIndex]?.name ?? 'Running'
    : timerState === 'paused'  ? 'Paused'
    : 'Finished';

  return (
    <div
      className="flex flex-col items-end px-4 py-3 shrink-0"
      style={{
        background:   'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* State / split name label */}
      <div
        className="text-xs uppercase tracking-widest mb-1 truncate max-w-full"
        style={{ color: 'var(--text-secondary)', letterSpacing: '0.15em' }}
      >
        {stateLabel}
      </div>

      {/* Main timer */}
      <div
        className={`font-mono font-bold leading-none ${timerGlowClass} ${timerAnimClass}`}
        style={{ fontSize: timerFontSize, color: timerColor }}
      >
        {formatTime(currentTime)}
      </div>

      {/* Delta vs PB */}
      {delta !== null && (
        <div
          className={`font-mono text-sm mt-1 ${deltaGlowClass}`}
          style={{ color: deltaColor }}
        >
          {formatDelta(delta)}
        </div>
      )}
    </div>
  );
}

export { formatTime, formatDelta };
