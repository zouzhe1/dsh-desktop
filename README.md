# DSH Desktop

**English** | [简体中文](README.zh-CN.md)

> ⚠️ **This is an independent community project.**
> It is **not** made by, affiliated with, or endorsed by DeepSeek AI.
> [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) is developed by DeepSeek AI under the MIT license and is bundled here only as a dependency. "DeepSeek" and related names belong to their respective owners.

A desktop app for DeepSeek Harness: **double-click one icon, use the full Web UI in its own window.** No browser, no terminal, no Node.js installation needed.

---

## Get started (for everyone)

1. **Download** the latest release ZIP from the [Releases](../../releases) page.
2. **Extract** it to any folder (e.g. `C:\dsh-desktop`). Keep all files together.
3. **Double-click `DSH桌面版.exe`** — the only `.exe` in the folder.

That's it. On first launch you'll see a loading screen for a few seconds while the background service starts, then the app opens.

### Good to know

| Question | Answer |
|---|---|
| Where are my chats saved? | `C:\Users\<you>\.dsh` — shared with the CLI (`npx @deepseek-ai/dsh web`) |
| Can I move the folder later? | Yes, the whole folder is portable. If you made a desktop shortcut, recreate it after moving. |
| Can I run two copies at once? | No — starting it again just focuses the existing window. |
| Which port does it use? | A random free port each launch. Nothing to configure, never conflicts. |
| Antivirus complains? | The app is fully local (no telemetry). Renamed Electron binaries occasionally trigger heuristic warnings; false positive. |

### Update to a newer version

Download the new release ZIP, extract, and replace your old folder. Your chats live outside the app folder, so they are untouched.

---

## For developers

### Build from source

Requirements: git, Node.js ≥ 22.15, npm (Git Bash on Windows).

```bash
git clone https://github.com/<your-username>/dsh-desktop.git
cd dsh-desktop
tools/build.sh        # assembles dist/dsh-desktop/ (~760 MB)
```

Optional: create a desktop shortcut with `tools/make-shortcut.ps1` (edit the path inside first).

`build.sh` downloads Electron and Node.js from [npmmirror](https://npmmirror.com/mirrors/) by default — override with `ELECTRON_MIRROR`, `NODE_MIRROR`, `NODE_VERSION` env vars.

### Keep `dsh` up to date

```bash
tools/update-dsh.sh   # checks npm for the latest dsh → bumps → reinstalls → syncs
```

> `dsh` is currently at `0.1.0-rc`; release candidates may contain breaking changes — smoke-test after upgrading.

### How it works

```
DSH桌面版.exe (Electron)
 ├─ shows a loading page
 ├─ starts server\node.exe → dsh web --port 0   (random free port)
 └─ loads http://127.0.0.1:<port> in the window
```

Zero patches to harness code: the `/api` trust fence accepts the window's `127.0.0.1:<port>` origin exactly like a browser tab.

### Repository layout

```
app/       Electron main process + window icon
electron/  staging for the official Electron distribution
server/    dsh dependency (package.json) + bundled Node runtime target
tools/     build.sh · update-dsh.sh · icon & shortcut scripts
docs/      upstream discussion draft
```

---

## License & credits

| Component | License | Owner |
|---|---|---|
| **This repository** (Electron shell, build/update scripts, docs) | MIT © 2026 zouzhe1 | this project |
| [@deepseek-ai/dsh](https://github.com/deepseek-ai/deepseek-harness) (bundled npm dependency) | MIT © DeepSeek AI | DeepSeek AI |
| [Electron](https://www.electronjs.org) (bundled binaries) | MIT | OpenJS Foundation & Electron contributors |
| [Node.js](https://nodejs.org) (bundled runtime) | MIT | OpenJS Foundation |

The MIT license of this repository covers **only the code we wrote** (the shell and scripts). Bundled components remain the property of their respective owners and are redistributed under their own licenses.
