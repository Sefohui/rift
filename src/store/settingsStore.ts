import { create } from 'zustand';
import { Settings, TimerState, Run, RunSegment, Split } from '../types';
import { Store } from '@tauri-apps/plugin-store';

let tauriStore: Store | null = null;

async function getStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load('settings.json');
  }
  return tauriStore;
}

const defaultSettings: Settings = {
  splits: [],
  hotkeys: {
    startSplit: 'Space',
    reset: 'Numpad1',
    undoSplit: 'Numpad3',
    skipSplit: 'Numpad2',
    pause: 'Escape',
  },
  hotkeysEnabled: true,
  theme: 'void',
  textSize: 'normal',
  showGraph: true,
  alwaysOnTop: false,
  sound: {
    volume: 60,
    split: true,
    splitFaster: true,
    runComplete: true,
    runSlow: true,
  },
  pb: null,
  bestRun: null,
};

interface AppState {
  // Settings
  settings: Settings;
  settingsLoaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (partial: Partial<Settings>) => Promise<void>;
  updateSplits: (splits: Split[]) => Promise<void>;
  resetPb: () => Promise<void>;

  // Timer state
  timerState: TimerState;
  currentSplitIndex: number;
  startTime: number | null;
  accumulatedTime: number;
  splitTimes: (number | null)[];  // elapsed ms at each completed split, null = skipped
  currentTime: number;

  // Timer actions
  startOrSplit: () => void;
  pause: () => void;
  resetTimer: () => void;
  undoSplit: () => void;
  skipSplit: () => void;
  tickTimer: (now: number) => void;
  finishRun: () => Run | null;

  // UI state
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  lastRunIsPersonalBest: boolean | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: defaultSettings,
  settingsLoaded: false,

  loadSettings: async () => {
    try {
      const store = await getStore();
      const saved = await store.get<Settings>('settings');
      if (saved) {
        set({ settings: { ...defaultSettings, ...saved }, settingsLoaded: true });
      } else {
        set({ settingsLoaded: true });
      }
    } catch {
      set({ settingsLoaded: true });
    }
  },

  saveSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    try {
      const store = await getStore();
      await store.set('settings', next);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  updateSplits: async (splits) => {
    await get().saveSettings({ splits });
  },

  resetPb: async () => {
    const clearedSplits = get().settings.splits.map((s) => ({
      ...s,
      pbTime: null,
      bestTime: null,
    }));
    await get().saveSettings({ pb: null, bestRun: null, splits: clearedSplits });
  },

  // Timer
  timerState: 'idle',
  currentSplitIndex: 0,
  startTime: null,
  accumulatedTime: 0,
  splitTimes: [],
  currentTime: 0,

  startOrSplit: () => {
    const { timerState, currentSplitIndex, settings, accumulatedTime, splitTimes } = get();
    const splits = settings.splits;

    if (timerState === 'idle' || timerState === 'finished') {
      // Start fresh
      set({
        timerState: 'running',
        currentSplitIndex: 0,
        startTime: Date.now(),
        accumulatedTime: 0,
        splitTimes: [],
        currentTime: 0,
      });
      return;
    }

    if (timerState === 'paused') {
      // Resume
      set({ timerState: 'running', startTime: Date.now() });
      return;
    }

    if (timerState === 'running') {
      const now = Date.now();
      const elapsed = accumulatedTime + (now - (get().startTime ?? now));
      const newSplitTimes = [...splitTimes, elapsed];

      if (currentSplitIndex >= splits.length - 1) {
        // Last split – finish the run
        set({ splitTimes: newSplitTimes, currentSplitIndex: currentSplitIndex + 1 });
        get().finishRun();
      } else {
        set({
          splitTimes: newSplitTimes,
          currentSplitIndex: currentSplitIndex + 1,
        });
      }
    }
  },

  pause: () => {
    const { timerState, startTime, accumulatedTime } = get();
    if (timerState === 'running') {
      const now = Date.now();
      const elapsed = accumulatedTime + (now - (startTime ?? now));
      set({ timerState: 'paused', accumulatedTime: elapsed, startTime: null });
    } else if (timerState === 'paused') {
      set({ timerState: 'running', startTime: Date.now() });
    }
  },

  resetTimer: () => {
    set({
      timerState: 'idle',
      currentSplitIndex: 0,
      startTime: null,
      accumulatedTime: 0,
      splitTimes: [],
      currentTime: 0,
      lastRunIsPersonalBest: null,
    });
  },

  undoSplit: () => {
    const { timerState, currentSplitIndex, splitTimes } = get();
    const canUndo =
      (timerState === 'running' || timerState === 'paused' || timerState === 'finished') &&
      currentSplitIndex > 0;
    if (canUndo) {
      set({
        currentSplitIndex: currentSplitIndex - 1,
        splitTimes: splitTimes.slice(0, -1),
        timerState: timerState === 'finished' ? 'running' : timerState,
      });
    }
  },

  skipSplit: () => {
    const { timerState, currentSplitIndex, settings, splitTimes } = get();
    // Cannot skip when not running, or when on the last split
    if (timerState !== 'running') return;
    if (currentSplitIndex >= settings.splits.length - 1) return;
    set({
      splitTimes: [...splitTimes, null],
      currentSplitIndex: currentSplitIndex + 1,
    });
  },

  tickTimer: (now: number) => {
    const { timerState, startTime, accumulatedTime } = get();
    if (timerState === 'running' && startTime !== null) {
      set({ currentTime: accumulatedTime + (now - startTime) });
    }
  },

  finishRun: () => {
    const { splitTimes, settings } = get();
    const splits = settings.splits;
    if (splitTimes.length === 0) return null;

    const hasSkipped = splitTimes.some((t) => t === null);

    const segments: RunSegment[] = splitTimes.map((elapsed, i) => {
      const prevElapsed = splitTimes.slice(0, i).findLast((t) => t !== null) ?? 0;
      const segmentTime = elapsed !== null ? elapsed - prevElapsed : null;
      const pbElapsed   = splits[i]?.pbTime ?? null;
      const delta       = elapsed !== null && pbElapsed !== null ? elapsed - pbElapsed : null;
      return {
        splitId:     splits[i]?.id ?? String(i),
        splitName:   splits[i]?.name ?? `Split ${i + 1}`,
        elapsedTime: elapsed,
        segmentTime,
        delta,
      };
    });

    const totalTime = splitTimes[splitTimes.length - 1] ?? 0;
    const pbTotal   = settings.pb?.totalTime ?? null;
    // A run with skipped splits can never be a PB
    const isPersonalBest = !hasSkipped && (pbTotal === null || totalTime < pbTotal);

    const run: Run = {
      id: `run-${Date.now()}`,
      date: new Date().toISOString(),
      segments,
      totalTime,
      isPersonalBest,
    };

    set({ timerState: 'finished', currentTime: totalTime, lastRunIsPersonalBest: isPersonalBest });

    // Update PB if needed
    const updates: Partial<Settings> = {};
    if (isPersonalBest) {
      updates.pb = run;
      // Update pbTime on each split
      const newSplits = splits.map((s, i) => ({
        ...s,
        pbTime: segments[i]?.elapsedTime ?? s.pbTime,
        bestTime:
          s.bestTime === null || (segments[i]?.segmentTime ?? Infinity) < s.bestTime
            ? segments[i]?.segmentTime ?? s.bestTime
            : s.bestTime,
      }));
      updates.splits = newSplits;
    }
    if (Object.keys(updates).length > 0) {
      get().saveSettings(updates);
    }

    return run;
  },

  showSettings: false,
  setShowSettings: (v) => set({ showSettings: v }),
  lastRunIsPersonalBest: null,
}));
