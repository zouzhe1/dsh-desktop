# DSH Desktop

[简体中文](README.md) | **English**

> Built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (open-sourced by DeepSeek AI, MIT) and maintained by the community, this project wraps it into a double-click desktop experience. See [License & credits](#license--credits) for component ownership.

A desktop app for DeepSeek Harness: **double-click one icon, use the full Web UI in its own window.** No browser, no terminal, no Node.js installation needed.

![DSH Desktop main window](docs/images/screenshot-main.jpg)

## Download & install

Download `dsh-desktop-v1.1.0-win-x64.zip` (**138 MB**) from the [Releases](../../releases) page, extract it to any folder, and double-click `DSH桌面版.exe`.

On first run a setup wizard prepares the environment automatically (one time only):

```
① Environment check ─ already have Node.js ≥ 22.15? → reuse it, jump to ③
② Runtime            ─ otherwise: download Node.js (34 MB) from your region's mirror
③ Components         ─ install dsh and ~530 dependency packages via npm
④ Launch             — the main window opens
```

Downloads automatically use the **npmmirror** registry when your timezone is in China, or the **official global sources** elsewhere. Mirrors can be switched manually in the wizard, failures offer one-click retry, and every step shows a progress bar.

### Size overview

| Item | Size |
|---|---|
| Release ZIP | 138 MB |
| After extraction | 348 MB (Electron shell + app) |
| Fetched on first run | Node.js ~34 MB (zipped) + dsh dependencies ~330 MB |
| Total disk usage once ready | ~780 MB |
| Subsequent launches | ~2 s, no downloads |

### Good to know

| Question | Answer |
|---|---|
| Does it touch my system environment? | No. Everything lives inside the app folder; the system Node.js is only executed, never modified; no registry writes, no environment variables. Deleting the folder uninstalls completely. |
| Where are my chats saved? | `C:\Users\<you>\.dsh` — shared with the CLI (`npx @deepseek-ai/dsh web`). |
| Does the check/download run on every launch? | No — only when a component is missing. Later launches go straight in (~2 s). |
| Can I move the folder or reinstall Windows? | The folder can be moved as a whole (recreate the desktop shortcut afterwards); chats live outside the folder and are unaffected. |
| Can I run two windows at once? | No — launching again focuses the existing window. |
| Which port does it use? | A random free port each launch. Nothing to configure, never conflicts. |
| Antivirus complains? | The app is fully local (no telemetry); renamed Electron binaries occasionally trigger heuristic false positives. |

### Updating to a newer version

Download the new release ZIP, extract, and replace your old folder. The first run re-checks and only fetches what changed.

## For developers

### Build from source

Requirements: git, Node.js ≥ 22.15, npm (Git Bash on Windows).

```bash
git clone https://github.com/zouzhe1/dsh-desktop.git
cd dsh-desktop
tools/build.sh        # assembles dist/dsh-desktop/ (~348 MB)
```

The build downloads Electron and Node.js from npmmirror by default; override with `ELECTRON_MIRROR`, `NODE_MIRROR`, `NODE_VERSION` env vars. For a fully offline variant, run `tools/build.sh full` (~760 MB, bundles the Node runtime and all dependencies).

### Keep dsh up to date

```bash
tools/update-dsh.sh   # checks npm for the latest dsh → confirms → upgrades → syncs
```

dsh is currently at `0.1.0-rc`; release candidates may contain breaking changes — smoke-test after upgrading.

### How it works

```
DSH桌面版.exe (Electron)
 ├─ first run: wizard checks the environment, fetches runtime & dependencies
 ├─ starts server\node.exe → dsh web --port 0 (random free port)
 └─ window loads http://127.0.0.1:<port>
```

Zero patches to harness code: the `/api` trust fence accepts the window's `127.0.0.1:<port>` origin exactly like a browser tab.

### Repository layout

```
app/       Electron main process + preload script + window icon
electron/  staging for the official Electron distribution
server/    dsh dependency manifest + runtime download target
tools/     build.sh · update-dsh.sh · icon & shortcut scripts
docs/      release notes, upstream discussion draft
```

## License & credits

| Component | License | Owner |
|---|---|---|
| This repository (Electron shell, build/update scripts, docs) | MIT © 2026 zouzhe1 | this project |
| [@deepseek-ai/dsh](https://github.com/deepseek-ai/deepseek-harness) (bundled as an npm dependency) | MIT © DeepSeek AI | DeepSeek AI |
| [Electron](https://www.electronjs.org) (distribution) | MIT | OpenJS Foundation & contributors |
| [Node.js](https://nodejs.org) (runtime) | MIT | OpenJS Foundation |

The MIT license of this repository covers only the code we wrote (the shell and scripts); bundled components belong to their respective owners and are redistributed under their own licenses.
