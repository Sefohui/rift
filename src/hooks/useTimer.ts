import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/settingsStore';

export function useTimer() {
  const timerState = useAppStore((s) => s.timerState);
  const tickTimer = useAppStore((s) => s.tickTimer);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      tickTimer(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };

    if (timerState === 'running') {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [timerState, tickTimer]);
}
