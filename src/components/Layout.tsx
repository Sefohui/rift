import React from 'react';
import { useAppStore } from '../store/settingsStore';
import { useSounds } from '../hooks/useSounds';

export function Layout({ children }: { children: React.ReactNode }) {
  const timerState   = useAppStore((s) => s.timerState);
  const startOrSplit = useAppStore((s) => s.startOrSplit);
  const resetTimer   = useAppStore((s) => s.resetTimer);
  const pause        = useAppStore((s) => s.pause);
  const undoSplit    = useAppStore((s) => s.undoSplit);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const settings     = useAppStore((s) => s.settings);
  const splitTimes   = useAppStore((s) => s.splitTimes);
  const currentSplitIndex = useAppStore((s) => s.currentSplitIndex);
  const lastRunIsPersonalBest = useAppStore((s) => s.lastRunIsPersonalBest);
  const { playSplit, playSplitFaster, playRunComplete, playRunSlow } = useSounds();

  const prevSplitIndexRef = React.useRef(currentSplitIndex);
  const prevTimerState    = React.useRef(timerState);

  React.useEffect(() => {
    if (timerState === 'running' && currentSplitIndex > prevSplitIndexRef.current) {
      const idx = currentSplitIndex - 1;
      const elapsed  = splitTimes[idx];
      const pbElapsed = settings.splits[idx]?.pbTime;
      if (pbElapsed != null && elapsed != null && elapsed < pbElapsed) {
        playSplitFaster();
      } else {
        playSplit();
      }
    }
    prevSplitIndexRef.current = currentSplitIndex;
  }, [currentSplitIndex]);

  React.useEffect(() => {
    if (prevTimerState.current === 'running' && timerState === 'finished') {
      // lastRunIsPersonalBest is set synchronously in finishRun before timerState changes
      if (lastRunIsPersonalBest) {
        playRunComplete();
      } else {
        playRunSlow();
      }
    }
    prevTimerState.current = timerState;
  }, [timerState]);

  const startLabel =
    timerState === 'idle' || timerState === 'finished' ? 'Start'
    : timerState === 'paused' ? 'Resume'
    : 'Split';

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Header */}
      <div style={{ background: 'var(--header-gradient)' }}>
        <div className="flex items-center justify-between px-3 py-2">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              color: 'var(--glow-primary)',
              textShadow: '0 0 8px var(--glow-primary-40)',
              letterSpacing: '0.25em',
            }}
          >
            Rift
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost text-xs px-2 py-0.5"
            style={{ fontSize: '0.72rem' }}
            title="Settings"
          >
            ⚙ Settings
          </button>
        </div>
        <div className="header-accent-line" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

      {/* Controls */}
      <div>
        <div
          className="h-px"
          style={{ background: 'var(--border-color)' }}
        />
        <div
          className="flex gap-2 px-3 py-2"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <button
            className="btn-primary text-xs px-3 py-1.5"
            style={{ flex: 2 }}
            onClick={startOrSplit}
            disabled={settings.splits.length === 0}
          >
            {startLabel}
          </button>
          <button
            className="btn-ghost text-xs px-2 py-1.5"
            style={{ flex: 1 }}
            onClick={pause}
            disabled={timerState === 'idle' || timerState === 'finished'}
          >
            Pause
          </button>
          <button
            className="btn-ghost text-xs px-2 py-1.5"
            style={{ flex: 1 }}
            onClick={undoSplit}
            disabled={timerState === 'idle' || currentSplitIndex === 0}
          >
            Undo
          </button>
          <button
            className="btn-danger text-xs px-2 py-1.5"
            style={{ flex: 1 }}
            onClick={resetTimer}
            disabled={timerState === 'idle'}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
