export interface Split {
  id: string;
  name: string;
  pbTime: number | null;   // total elapsed ms at this split in PB run
  bestTime: number | null; // best segment time in ms
}

export interface RunSegment {
  splitId: string;
  splitName: string;
  elapsedTime: number | null; // null = skipped
  segmentTime: number | null; // null = skipped
  delta: number | null;
}

export interface Run {
  id: string;
  date: string;
  segments: RunSegment[];
  totalTime: number;
  isPersonalBest: boolean;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export interface HotkeyMap {
  startSplit: string;
  reset: string;
  undoSplit: string;
  skipSplit: string;
  pause: string;
}

export interface SoundSettings {
  volume: number;
  split: boolean;
  splitFaster: boolean;
  runComplete: boolean;
  runSlow: boolean;
}

export interface Settings {
  splits: Split[];
  hotkeys: HotkeyMap;
  hotkeysEnabled: boolean;
  theme: string;
  textSize: 'small' | 'normal' | 'large';
  timerDecimals: 2 | 3;
  showGraph: boolean;
  alwaysOnTop: boolean;
  sound: SoundSettings;
  pb: Run | null;
  bestRun: Run | null;
}

export interface TimerSlice {
  timerState: TimerState;
  currentSplitIndex: number;
  startTime: number | null;       // Date.now() when timer started / resumed
  accumulatedTime: number;        // ms accumulated before current run segment (for pausing)
  splitTimes: (number | null)[];  // elapsed ms at each completed split, null = skipped
  currentTime: number;            // current elapsed ms (updated by ticker)
}
