import React, { useEffect } from 'react';
import { useAppStore } from './store/settingsStore';
import { useTimer } from './hooks/useTimer';
import { useHotkeys } from './hooks/useHotkeys';
import { applyTheme } from './themes/themes';
import { Layout } from './components/Layout';
import { Timer } from './components/Timer';
import { SplitList } from './components/SplitList';
import { Graph } from './components/Graph';
import { Settings } from './components/Settings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const loadSettings = useAppStore((s) => s.loadSettings);
  const settingsLoaded = useAppStore((s) => s.settingsLoaded);
  const settings = useAppStore((s) => s.settings);
  const showSettings = useAppStore((s) => s.showSettings);
  const setShowSettings = useAppStore((s) => s.setShowSettings);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (settingsLoaded) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, settingsLoaded]);

  // Sync always-on-top with backend whenever the setting changes
  useEffect(() => {
    if (settingsLoaded) {
      invoke('set_always_on_top', { alwaysOnTop: settings.alwaysOnTop }).catch(() => {});
    }
  }, [settings.alwaysOnTop, settingsLoaded]);

  // Start the animation-frame ticker
  useTimer();

  // Register global hotkeys
  useHotkeys();

  if (!settingsLoaded) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        Loading...
      </div>
    );
  }

  const hasSplits = settings.splits.length > 0;

  return (
    <>
      <Layout>
        {hasSplits ? (
          <>
            <Timer />
            <SplitList />
            <Graph />
          </>
        ) : (
          <WelcomeScreen onOpenSettings={() => setShowSettings(true)} />
        )}
      </Layout>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default App;
