import React from 'react';
import { useAppStore } from '../store/settingsStore';

interface Props {
  onOpenSettings: () => void;
}

export function WelcomeScreen({ onOpenSettings }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-5xl">⏱</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-timer)' }}>
          Rift
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No splits configured yet.
        </p>
      </div>

      <div
        className="rounded-lg p-4 text-left w-full max-w-xs"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: '1.6',
        }}
      >
        <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Getting started:
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open Settings</li>
          <li>Add your splits in the Splits tab</li>
          <li>Press <kbd className="px-1 rounded text-xs" style={{ background: 'var(--bg-primary)', color: 'var(--text-accent)' }}>Space</kbd> to start</li>
          <li>Press <kbd className="px-1 rounded text-xs" style={{ background: 'var(--bg-primary)', color: 'var(--text-accent)' }}>Space</kbd> again to mark each split</li>
        </ol>
      </div>

      <button
        onClick={onOpenSettings}
        className="px-6 py-2 rounded font-semibold transition-opacity hover:opacity-80"
        style={{
          background: 'var(--btn-primary-bg)',
          color: 'var(--btn-primary-text)',
        }}
      >
        Open Settings
      </button>
    </div>
  );
}
