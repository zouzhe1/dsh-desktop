# DSH Desktop — DeepSeek Harness 桌面版

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

A **portable desktop app** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) — the agent harness by DeepSeek AI, wrapped in an Electron shell. Double-click an icon and get the full Web UI in its own window: no browser tab, no terminal, no Node.js installation required.

> Community project, not affiliated with DeepSeek AI. The harness itself is consumed as an npm dependency — this repo contains zero harness source code, so upgrading to a new `dsh` release is a one-line dependency bump.

### Features

- 🟢 **Fully portable ("green") build** — no installer, no registry writes; copy the folder anywhere
- 📦 **Self-contained** — bundles its own Node.js runtime + `@deepseek-ai/dsh` + all dependencies
- 🔌 **Dynamic port** — spawns `dsh web --port 0`, never conflicts with anything
- 1️⃣ **Single instance** — launching again just focuses the existing window
- 🧹 **Clean teardown** — closing the window kills the whole server process tree; crashes show a dialog with logs
- 🤝 **Shares sessions** with the CLI version (`~/.dsh`)

### How it works

```
DSH桌面版.exe (Electron)
 ├─ shows a loading page
 ├─ spawns server\node.exe …\dsh\lib\bin.js web --port 0
 └─ on ready, loads http://127.0.0.1:<port> in the window
```

The `/api` browser-trust fence accepts the window's origin (`127.0.0.1:<port>`) exactly like a normal browser tab — no harness patches needed.

### Build from source

Requirements: git, Node.js ≥ 22.15 (for running the build), npm.

```bash
git clone https://github.com/<your-username>/dsh-desktop.git
cd dsh-desktop
tools/build.sh              # assembles dist/dsh-desktop/ (≈760 MB)
tools/make-shortcut.ps1     # optional: desktop shortcut (Windows)
```

`build.sh` downloads Electron + Node.js from npmmirror by default (override with `ELECTRON_MIRROR` / `NODE_MIRROR` / `NODE_VERSION` env vars), installs `@deepseek-ai/dsh`, and assembles the portable folder.

### Keep dsh up to date

```bash
tools/update-dsh.sh         # checks npm for the latest dsh, bumps, reinstalls,
                            # and syncs into the portable folder
```

Note: `dsh` is currently at `0.1.0-rc` — release candidates may contain breaking changes; smoke-test after upgrading.

### Repo layout

```
app/       Electron main process + window icon (ships as resources/app)
electron/  staging for the official Electron distribution
server/    bundled Node runtime target + dsh dependency (package.json)
tools/     build.sh · update-dsh.sh · draw-icon.ps1 · pack-ico.js · make-shortcut.ps1
docs/      upstream discussion draft
```

### License

MIT. DeepSeek Harness is © DeepSeek AI, MIT — see [their repository](https://github.com/deepseek-ai/deepseek-harness).

---

<a id="中文"></a>
## 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的**绿色版桌面应用**：Electron 壳 + 内置 Node.js 运行时 + 内置 dsh。双击图标即可在独立窗口使用完整 Web UI，无需浏览器、终端、系统 Node。

> 社区项目，与 DeepSeek AI 无官方关系。harness 以 npm 依赖形式消费，本仓库不含其源码——升级 dsh 只需改一行版本号。

### 工作原理

主进程用内置 `node.exe` 拉起 `dsh web --port 0`（随机空闲端口），就绪后窗口加载 `http://127.0.0.1:<端口>`；关闭窗口自动清理服务进程树。会话数据与命令行版共用 `~/.dsh`。

### 从源码构建

```bash
git clone https://github.com/<你的用户名>/dsh-desktop.git
cd dsh-desktop
tools/build.sh              # 组装 dist/dsh-desktop/（约 760 MB）
tools/make-shortcut.ps1     # 可选：创建桌面快捷方式（Windows）
```

### 升级 dsh

```bash
tools/update-dsh.sh         # 自动检查最新版 → 确认 → 安装 → 同步到绿色版目录
```

注意：dsh 目前是 `0.1.0-rc` 版本，rc 可能有破坏性变更，升级后建议先试用。

### 目录结构

```
app/       Electron 主进程 + 图标（构建后位于 resources/app）
electron/  Electron 发行包暂存
server/    内置运行时目标目录 + dsh 依赖声明
tools/     构建、升级、图标、快捷方式脚本
docs/      给官方的 Discussions 草稿
```

### 许可

MIT。
