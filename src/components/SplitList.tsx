import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/settingsStore';
import { formatTime, formatDelta } from './Timer';

export function SplitList() {
  const settings          = useAppStore((s) => s.settings);
  const currentSplitIndex = useAppStore((s) => s.currentSplitIndex);
  const splitTimes        = useAppStore((s) => s.splitTimes);
  const currentTime       = useAppStore((s) => s.currentTime);
  const timerState        = useAppStore((s) => s.timerState);
  const textSize          = settings.textSize;

  const splits     = settings.splits;
  const scrollRef  = useRef<HTMLDivElement>(null);
  const activeRef  = useRef<HTMLDivElement>(null);

  const fontSize =
    textSize === 'small' ? '0.76rem' : textSize === 'large' ? '0.98rem' : '0.86rem';

  // Keep the active split centered in the visible area
  useEffect(() => {
    const container = scrollRef.current;
    const active    = activeRef.current;
    if (!container || !active) return;

    // Absolute position of the active row within the scrollable content
    const activeAbsTop =
      active.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;

    // Place the active row at ~40% from the top (some completed splits visible above)
    const target = activeAbsTop - container.clientHeight * 0.4 + active.clientHeight / 2;

    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [currentSplitIndex]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ overflowX: 'hidden' }}>
      {splits.map((split, index) => {
        const isCompleted = index < splitTimes.length;
        const isActive    =
          index === currentSplitIndex &&
          (timerState === 'running' || timerState === 'paused');

        const elapsed = isCompleted ? splitTimes[index] : null;
        const segmentTime =
          elapsed !== null
            ? index === 0
              ? elapsed
              : elapsed - (splitTimes[index - 1] ?? 0)
            : null;

        const pbElapsed = split.pbTime;
        let delta: number | null = null;
        if (isCompleted && elapsed !== null && pbElapsed !== null) {
          delta = elapsed - pbElapsed;
        } else if (isActive && pbElapsed !== null) {
          delta = currentTime - pbElapsed;
        }

        const isBestSegment =
          isCompleted &&
          segmentTime !== null &&
          split.bestTime !== null &&
          segmentTime <= split.bestTime;

        let deltaColor     = 'var(--text-secondary)';
        let deltaGlowClass = '';
        if (delta !== null) {
          if (isBestSegment) {
            deltaColor     = 'var(--text-best)';
            deltaGlowClass = 'glow-gold';
          } else {
            deltaColor     = delta < 0 ? 'var(--text-ahead)' : 'var(--text-behind)';
            deltaGlowClass = delta < 0 ? 'glow-ahead' : 'glow-behind';
          }
        }

        const textColor = isActive || isCompleted
          ? 'var(--text-primary)'
          : 'var(--text-secondary)';

        return (
          <div
            key={split.id}
            ref={isActive ? activeRef : null}
            className={`flex items-center px-3 ${isActive ? 'split-row-active' : 'split-row-inactive'}`}
            style={{
              background: isActive
                ? undefined  // handled by split-row-active class
                : index % 2 === 0
                ? 'var(--bg-split-even)'
                : 'var(--bg-split-odd)',
              borderBottom: '1px solid var(--border-color)',
              fontSize,
              minHeight: '2rem',
              transition: 'background 0.2s, box-shadow 0.2s',
              opacity: isCompleted || isActive ? 1 : 0.55,
            }}
          >
            {/* Split name */}
            <div
              className="flex-1 truncate font-medium"
              style={{ color: textColor }}
            >
              {split.name}
            </div>

            {/* Delta */}
            <div
              className={`font-mono w-[5.5rem] text-right ${deltaGlowClass}`}
              style={{ color: deltaColor, fontSize: '0.80em' }}
            >
              {delta !== null ? formatDelta(delta) : ''}
            </div>

            {/* Time */}
            <div
              className="font-mono w-[5.5rem] text-right"
              style={{
                color: isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isCompleted ? 1 : 0.5,
              }}
            >
              {elapsed !== null
                ? formatTime(elapsed, false)
                : pbElapsed !== null
                ? formatTime(pbElapsed, false)
                : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
