# Rift

A modern speedrun timer for Windows, built to stand out from LiveSplit. Rift features a clean, glow-based UI with multiple themes, real-time split comparison, and global hotkeys that work even when the window is out of focus.

---

## Features

### Timer
- Start, split, pause, undo split, and reset
- Displays current split time, total elapsed time, and delta vs PB per split
- Color-coded deltas — green when ahead, red when behind, gold for best segment ever
- Timer glows and pulses based on run state

### Splits
- Add, remove, reorder, and rename splits
- Import directly from LiveSplit (`.lss`) — splits, PB times, and best segments are all carried over
- Export to `.lss` (compatible with LiveSplit) or `.json`
- Reset PB at any time from settings

### Split comparison graph
- Real-time line graph comparing the current run against PB
- Updates after each split
- Can be toggled on/off in settings

### Themes
| Theme | Description |
|-------|-------------|
| **Void** | Deep navy with electric cyan glow |
| **Ember** | Dark warm brown with fire-orange glow |
| **Aurora** | Deep navy with teal-mint glow |
| **Neon Rose** | Dark purple with hot-pink glow |

### Global hotkeys
- Work even when the window is not focused
- Configurable key bindings per action
- Can be toggled on/off without changing bindings

| Default key | Action |
|-------------|--------|
| `Space` | Start / Split |
| `Numpad 1` | Reset |
| `Numpad 3` | Undo split |
| `Escape` | Pause / Resume |

### Sound effects
- Distinct sounds for: split, split faster than PB, run complete (PB), run complete (slower than PB)
- Master volume slider
- Individual sounds can be toggled on/off

### Other
- Always-on-top mode (configurable)
- Three text size options: small, normal, large
- All settings and PB data persist automatically between sessions
- Minimum window size 300×400 px, fully resizable

---

## Installation

Download the latest installer from the [Releases](https://github.com/Sefohui/rift/releases) page.

Run the `.msi` or `.exe` installer and follow the on-screen steps. No additional dependencies required.

---

## Migrating from LiveSplit

1. In LiveSplit, right-click → **Save Splits As** → save as `.lss`
2. Open Rift → **Settings** → **Splits** → **Import**
3. Select your `.lss` file and confirm

All split names, PB times, and best segment times are imported automatically.
