import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/settingsStore';
import { Split, Run, RunSegment } from '../types';
import { themes } from '../themes/themes';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

type Tab = 'splits' | 'hotkeys' | 'appearance' | 'sound';

function formatPbTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis  = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── LSS helpers ───────────────────────────────────────────────────────────

// Parses LiveSplit time strings: "H:MM:SS.fffffff"
function parseLssTime(raw: string | null | undefined): number | null {
  if (!raw || raw.trim() === '') return null;
  const m = raw.trim().match(/^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/);
  if (!m) return null;
  const ms = (parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3])) * 1000;
  return Math.round(ms);
}

function msToLssTime(ms: number): string {
  const h   = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const frac = String(ms % 1000).padStart(3, '0') + '0000'; // 7-digit fractional
  return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${frac}`;
}

interface ParsedLss {
  gameName: string;
  categoryName: string;
  splits: Split[];
  pb: Run | null;
}

function parseLssFile(text: string): ParsedLss | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) return null;

  const gameName     = doc.querySelector('GameName')?.textContent?.trim() ?? '';
  const categoryName = doc.querySelector('CategoryName')?.textContent?.trim() ?? '';
  const segmentEls   = Array.from(doc.querySelectorAll('Segments > Segment'));

  const splits: Split[]       = [];
  const pbSegments: RunSegment[] = [];
  let   prevPbMs = 0;
  let   allHavePb = true;

  for (const el of segmentEls) {
    const name = el.querySelector('Name')?.textContent?.trim() ?? 'Split';
    const id   = generateId();

    // Cumulative PB time for this split
    const pbRaw    = el.querySelector('SplitTimes > SplitTime[name="Personal Best"] > RealTime')?.textContent;
    const pbTime   = parseLssTime(pbRaw);

    // Best individual segment time ever
    const bestRaw  = el.querySelector('BestSegmentTime > RealTime')?.textContent;
    const bestTime = parseLssTime(bestRaw);

    if (pbTime === null) allHavePb = false;

    splits.push({ id, name, pbTime, bestTime });

    if (pbTime !== null) {
      pbSegments.push({
        splitId:     id,
        splitName:   name,
        elapsedTime: pbTime,
        segmentTime: pbTime - prevPbMs,
        delta:       0,
      });
      prevPbMs = pbTime;
    }
  }

  const pb: Run | null =
    allHavePb && pbSegments.length > 0
      ? {
          id:             `run-imported-${Date.now()}`,
          date:           new Date().toISOString(),
          segments:       pbSegments,
          totalTime:      pbSegments[pbSegments.length - 1].elapsedTime ?? 0,
          isPersonalBest: true,
        }
      : null;

  return { gameName, categoryName, splits, pb };
}

// ---- Splits Tab ----
function SplitsTab() {
  const settings     = useAppStore((s) => s.settings);
  const updateSplits = useAppStore((s) => s.updateSplits);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const resetPb      = useAppStore((s) => s.resetPb);
  const [splits, setSplits]           = useState<Split[]>(() => settings.splits);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedLss | null>(null);

  const handleAdd = () => {
    const next = [
      ...splits,
      { id: generateId(), name: `Split ${splits.length + 1}`, pbTime: null, bestTime: null },
    ];
    setSplits(next);
  };

  const handleRemove = (id: string) => {
    setSplits(splits.filter((s) => s.id !== id));
  };

  const handleRename = (id: string, name: string) => {
    setSplits(splits.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleSave = () => {
    updateSplits(splits);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...splits];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSplits(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= splits.length - 1) return;
    const next = [...splits];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setSplits(next);
  };

  const exportJSON = async () => {
    const filePath = await save({
      defaultPath: 'splits.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!filePath) return;
    await writeTextFile(filePath, JSON.stringify(splits, null, 2));
  };

  const exportLSS = async () => {
    const filePath = await save({
      defaultPath: 'splits.lss',
      filters: [{ name: 'LiveSplit', extensions: ['lss'] }],
    });
    if (!filePath) return;
    const segmentXml = splits.map((s) => {
      const pbLine = s.pbTime !== null
        ? `\n        <SplitTime name="Personal Best"><RealTime>${msToLssTime(s.pbTime)}</RealTime></SplitTime>`
        : '';
      const bestLine = s.bestTime !== null
        ? `\n      <BestSegmentTime><RealTime>${msToLssTime(s.bestTime)}</RealTime></BestSegmentTime>`
        : '\n      <BestSegmentTime />';
      return (
        `    <Segment>\n      <Name>${s.name}</Name>` +
        `\n      <SplitTimes>${pbLine}\n      </SplitTimes>` +
        `${bestLine}\n    </Segment>`
      );
    });
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Run version="1.7.0">',
      '  <GameName></GameName>',
      '  <CategoryName></CategoryName>',
      '  <Segments>',
      ...segmentXml,
      '  </Segments>',
      '</Run>',
    ].join('\n');
    await writeTextFile(filePath, xml);
  };

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        if (file.name.endsWith('.lss')) {
          const parsed = parseLssFile(text);
          if (!parsed || parsed.splits.length === 0) {
            alert('Could not read splits from this .lss file.');
            return;
          }
          setPendingImport(parsed);
        } else {
          const parsed: Split[] = JSON.parse(text);
          setSplits(parsed.map((s) => ({ ...s, id: s.id ?? generateId() })));
        }
      } catch {
        alert('Failed to import file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    setSplits(pendingImport.splits);
    // Apply to store immediately so PB is also saved
    await saveSettings({
      splits: pendingImport.splits,
      ...(pendingImport.pb ? { pb: pendingImport.pb } : {}),
    });
    setPendingImport(null);
  };

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* LSS import confirmation */}
      {pendingImport && (
        <div
          className="rounded-lg p-3 flex flex-col gap-2"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glow-primary-40)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-accent)' }}>
            Import from LiveSplit
          </p>
          {(pendingImport.gameName || pendingImport.categoryName) && (
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              {[pendingImport.gameName, pendingImport.categoryName].filter(Boolean).join(' — ')}
            </p>
          )}
          <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>{pendingImport.splits.length} splits</span>
            <span style={{ color: pendingImport.pb ? 'var(--text-ahead)' : 'var(--text-secondary)' }}>
              {pendingImport.pb
                ? `PB: ${formatPbTime(pendingImport.pb.totalTime)}`
                : 'No PB times found'}
            </span>
            <span>
              {pendingImport.splits.filter((s) => s.bestTime !== null).length} best segments
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            This will replace your current splits and PB.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              className="settings-btn-primary text-xs px-3 py-1 rounded"
            >
              Import
            </button>
            <button
              onClick={() => setPendingImport(null)}
              className="settings-btn-secondary text-xs px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Splits list */}
      <div
        className="flex-1 overflow-y-auto rounded"
        style={{ border: '1px solid var(--border-color)' }}
      >
        {splits.length === 0 && (
          <div
            className="p-4 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            No splits yet. Click "Add Split" to begin.
          </div>
        )}
        {splits.map((split, index) => (
          <div
            key={split.id}
            className="flex items-center gap-2 px-2 py-1"
            style={{
              background:
                index % 2 === 0 ? 'var(--bg-split-even)' : 'var(--bg-split-odd)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              className="text-xs w-5 text-center shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              {index + 1}
            </span>
            {editingId === split.id ? (
              <input
                className="flex-1 px-1 rounded text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--text-accent)',
                  outline: 'none',
                }}
                value={split.name}
                autoFocus
                onChange={(e) => handleRename(split.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
              />
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer truncate"
                style={{ color: 'var(--text-primary)' }}
                onDoubleClick={() => setEditingId(split.id)}
                title="Double-click to rename"
              >
                {split.name}
              </span>
            )}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleMoveUp(index)}
                className="px-1 text-xs opacity-60 hover:opacity-100"
                style={{ color: 'var(--text-accent)' }}
                title="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                className="px-1 text-xs opacity-60 hover:opacity-100"
                style={{ color: 'var(--text-accent)' }}
                title="Move down"
              >
                ▼
              </button>
              <button
                onClick={() => setEditingId(split.id)}
                className="px-1 text-xs opacity-60 hover:opacity-100"
                style={{ color: 'var(--text-accent)' }}
                title="Rename"
              >
                ✎
              </button>
              <button
                onClick={() => handleRemove(split.id)}
                className="px-1 text-xs opacity-60 hover:opacity-100"
                style={{ color: 'var(--text-behind)' }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleAdd} className="settings-btn-primary text-sm px-3 py-1 rounded">
          + Add Split
        </button>
        <button onClick={handleSave} className="settings-btn-primary text-sm px-3 py-1 rounded">
          Save Splits
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="settings-btn-secondary text-sm px-3 py-1 rounded cursor-pointer">
          Import
          <input type="file" accept=".json,.lss" className="hidden" onChange={importFile} />
        </label>
        <button onClick={exportJSON} className="settings-btn-secondary text-sm px-3 py-1 rounded">
          Export JSON
        </button>
        <button onClick={exportLSS} className="settings-btn-secondary text-sm px-3 py-1 rounded">
          Export LSS
        </button>
      </div>

      {/* Reset PB */}
      <div
        className="mt-2 pt-3 flex items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reset PB
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {settings.pb
              ? `Current PB: ${formatPbTime(settings.pb.totalTime)}`
              : 'No PB set'}
          </p>
        </div>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              onClick={() => { resetPb(); setConfirmReset(false); }}
              className="text-sm px-3 py-1 rounded font-semibold"
              style={{ background: 'var(--btn-danger-bg)', color: 'var(--btn-danger-text)' }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="settings-btn-secondary text-sm px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            disabled={!settings.pb}
            className="text-sm px-3 py-1 rounded font-semibold disabled:opacity-30"
            style={{ background: 'var(--btn-danger-bg)', color: 'var(--btn-danger-text)' }}
          >
            Reset PB
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Hotkeys Tab ----
const HOTKEY_LABELS: Record<string, string> = {
  startSplit: 'Start / Split',
  reset:      'Reset',
  undoSplit:  'Undo Split',
  skipSplit:  'Skip Split',
  pause:      'Pause / Resume',
};

function HotkeysTab() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const [binding, setBinding] = useState<string | null>(null);
  const [hotkeys, setHotkeys] = useState(settings.hotkeys);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(settings.hotkeysEnabled ?? true);
  const [unbound, setUnbound] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (action: string, e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const key = e.code; // e.g. 'Space', 'Numpad1', 'KeyA'
      if (key === 'Tab') return;

      setHotkeys((prev) => {
        // Check if this key is already bound to another action
        const conflict = (Object.keys(prev) as Array<keyof typeof prev>).find(
          (a) => a !== action && prev[a] === key
        );
        if (conflict) {
          setUnbound(HOTKEY_LABELS[conflict] ?? conflict);
          setTimeout(() => setUnbound(null), 2500);
          return { ...prev, [conflict]: '', [action]: key };
        }
        setUnbound(null);
        return { ...prev, [action]: key };
      });
      setBinding(null);
    },
    []
  );

  const handleSave = () => {
    saveSettings({ hotkeys, hotkeysEnabled });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Enable/disable toggle */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        <label htmlFor="hotkeysEnabled" className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Global hotkeys enabled
        </label>
        <input
          type="checkbox"
          id="hotkeysEnabled"
          checked={hotkeysEnabled}
          onChange={(e) => setHotkeysEnabled(e.target.checked)}
          className="w-4 h-4"
        />
      </div>

      {/* Key bindings */}
      <div className={`flex flex-col gap-4 ${!hotkeysEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {Object.entries(HOTKEY_LABELS).map(([action, label]) => (
          <div key={action} className="flex items-center justify-between gap-2">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {label}
            </span>
            <div className="flex gap-2 items-center">
              {binding === action ? (
                <input
                  className="px-2 py-1 rounded text-sm font-mono w-36 text-center"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-accent)',
                    border: '1px solid var(--text-accent)',
                    outline: 'none',
                  }}
                  autoFocus
                  readOnly
                  placeholder="Press a key..."
                  onKeyDown={(e) => handleKeyDown(action, e)}
                  onBlur={() => setBinding(null)}
                />
              ) : (
                <button
                  className="px-2 py-1 rounded text-sm font-mono w-36 text-center hover:opacity-80"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  onClick={() => setBinding(action)}
                >
                  {hotkeys[action as keyof typeof hotkeys]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="settings-btn-primary text-sm px-3 py-1 rounded mt-2 self-start"
      >
        Save Hotkeys
      </button>
      {unbound && (
        <p className="text-xs" style={{ color: 'var(--text-behind)' }}>
          Unbound from: {unbound}
        </p>
      )}
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Click a button then press the desired key. Hotkeys work globally even when
        the window is not focused.
      </p>
    </div>
  );
}

// ---- Appearance Tab ----
function AppearanceTab() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const [theme, setTheme] = useState(settings.theme);
  const [textSize, setTextSize] = useState(settings.textSize);
  const [timerDecimals, setTimerDecimals] = useState<2 | 3>(settings.timerDecimals ?? 2);
  const [showGraph, setShowGraph] = useState(settings.showGraph);
  const [alwaysOnTop, setAlwaysOnTop] = useState(settings.alwaysOnTop);

  const handleSave = async () => {
    await saveSettings({ theme, textSize, timerDecimals, showGraph, alwaysOnTop });
    try {
      await invoke('set_always_on_top', { alwaysOnTop });
    } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Theme
        </label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="px-2 py-1 rounded text-sm"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Text Size
        </label>
        <div className="flex gap-2">
          {(['small', 'normal', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setTextSize(size)}
              className="px-3 py-1 rounded text-sm capitalize"
              style={{
                background:
                  textSize === size ? 'var(--btn-primary-bg)' : 'var(--bg-tertiary)',
                color:
                  textSize === size
                    ? 'var(--btn-primary-text)'
                    : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Timer precision
        </label>
        <div className="flex gap-2">
          {([2, 3] as const).map((d) => (
            <button
              key={d}
              onClick={() => setTimerDecimals(d)}
              className="px-3 py-1 rounded text-sm"
              style={{
                background: timerDecimals === d ? 'var(--btn-primary-bg)' : 'var(--bg-tertiary)',
                color: timerDecimals === d ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {d === 2 ? '0.00' : '0.000'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showGraph"
          checked={showGraph}
          onChange={(e) => setShowGraph(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="showGraph" className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Show split comparison graph
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="alwaysOnTop"
          checked={alwaysOnTop}
          onChange={(e) => setAlwaysOnTop(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="alwaysOnTop" className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Always on top
        </label>
      </div>

      <button
        onClick={handleSave}
        className="settings-btn-primary text-sm px-3 py-1 rounded self-start"
      >
        Apply Appearance
      </button>
    </div>
  );
}

// ---- Sound Tab ----
function SoundTab() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const [sound, setSound] = useState(settings.sound);

  const toggle = (key: keyof typeof sound) => {
    if (typeof sound[key] === 'boolean') {
      setSound((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleSave = () => {
    saveSettings({ sound });
  };

  const SOUND_LABELS: Array<{ key: keyof typeof sound; label: string }> = [
    { key: 'split', label: 'Split' },
    { key: 'splitFaster', label: 'Split faster than PB' },
    { key: 'runComplete', label: 'Run completed (PB)' },
    { key: 'runSlow', label: 'Run completed (slower)' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Volume: {sound.volume}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={sound.volume}
          onChange={(e) => setSound((prev) => ({ ...prev, volume: Number(e.target.value) }))}
          className="w-full accent-blue-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Enable sounds:
        </p>
        {SOUND_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`sound-${key}`}
              checked={sound[key] as boolean}
              onChange={() => toggle(key)}
              className="w-4 h-4"
            />
            <label
              htmlFor={`sound-${key}`}
              className="text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              {label}
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="settings-btn-primary text-sm px-3 py-1 rounded self-start"
      >
        Save Sound Settings
      </button>
    </div>
  );
}

// ---- Main Settings Modal ----
export function Settings({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('splits');

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'splits', label: 'Splits' },
    { id: 'hotkeys', label: 'Hotkeys' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'sound', label: 'Sound' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex flex-col w-full max-w-md mx-auto my-4 rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
              style={{
                color: activeTab === tab.id ? 'var(--text-accent)' : 'var(--text-secondary)',
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--text-accent)' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'splits' && <SplitsTab />}
          {activeTab === 'hotkeys' && <HotkeysTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'sound' && <SoundTab />}
        </div>
      </div>
    </div>
  );
}
