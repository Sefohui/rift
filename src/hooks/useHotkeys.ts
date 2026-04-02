import { useEffect } from 'react';
import { register, unregisterAll, ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';
import { useAppStore } from '../store/settingsStore';

// Map our hotkey strings to Tauri accelerator format
function toAccelerator(key: string): string {
  const map: Record<string, string> = {
    'Space': 'Space',
    'Numpad0': 'Numpad0',
    'Numpad1': 'Numpad1',
    'Numpad2': 'Numpad2',
    'Numpad3': 'Numpad3',
    'Numpad4': 'Numpad4',
    'Numpad5': 'Numpad5',
    'Numpad6': 'Numpad6',
    'Numpad7': 'Numpad7',
    'Numpad8': 'Numpad8',
    'Numpad9': 'Numpad9',
    'Escape': 'Escape',
    'Enter': 'Return',
    'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
    'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
    'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  };
  return map[key] ?? key;
}

export function useHotkeys() {
  const hotkeys = useAppStore((s) => s.settings.hotkeys);
  const hotkeysEnabled = useAppStore((s) => s.settings.hotkeysEnabled);
  const startOrSplit = useAppStore((s) => s.startOrSplit);
  const resetTimer = useAppStore((s) => s.resetTimer);
  const undoSplit = useAppStore((s) => s.undoSplit);
  const pause = useAppStore((s) => s.pause);

  useEffect(() => {
    let active = true;

    const registerHotkeys = async () => {
      try {
        await unregisterAll();
        if (!active || !hotkeysEnabled) return;

        const bindings: Array<{ key: string; handler: () => void }> = [
          { key: hotkeys.startSplit, handler: startOrSplit },
          { key: hotkeys.reset, handler: resetTimer },
          { key: hotkeys.undoSplit, handler: undoSplit },
          { key: hotkeys.pause, handler: pause },
        ];

        for (const { key, handler } of bindings) {
          const accel = toAccelerator(key);
          try {
            await register(accel, (event: ShortcutEvent) => {
              // Only fire on key press, not release — prevents double-triggering
              if (event.state === 'Pressed') {
                handler();
              }
            });
          } catch (e) {
            console.warn(`Failed to register hotkey ${accel}:`, e);
          }
        }
      } catch (e) {
        console.warn('Hotkey registration failed:', e);
      }
    };

    registerHotkeys();

    return () => {
      active = false;
      unregisterAll().catch(() => {});
    };
  }, [hotkeys, hotkeysEnabled, startOrSplit, resetTimer, undoSplit, pause]);
}
