# GitHub Discussion 草稿（英文）

> 用途：发到 deepseek-ai/deepseek-harness 的 GitHub Discussions，建议官方出桌面版。
> 也可以在 Discussions 里发起投票攒 upvote，让团队看到需求强度。
> 发布地址：https://github.com/deepseek-ai/deepseek-harness/discussions/new

---

**Category:** Ideas / Feature Requests

**Title:** Desktop app (Electron/Tauri shell) for the Web UI — community interest?

## Body

Hi team! First of all — amazing project, and the "everything is a plugin" architecture is a joy to explore. 🙌

I noticed the harness currently ships `apps/cli` and `apps/web`. Many terminal-shy users (and frankly, most non-developer users) would love a **native desktop app**: double-click an icon, get the full Web UI in its own window with a taskbar presence, no browser tab juggling, no terminal.

### What a desktop shell looks like

Since the web UI is already a local HTTP+WebSocket server, a desktop shell is remarkably thin:

- Spawn `dsh web --port 0` (OS-assigned free port) as a child process
- Load `http://127.0.0.1:<port>` in an app window
- Single-instance lock, system tray, clean process-tree teardown on exit

I built a working prototype along these lines (Electron shell + bundled Node runtime, fully self-contained portable build) and it works great — zero changes to harness code needed. The `dsh-client-ui-directory-picker-native` package suggests the UI layer already anticipates native hosts, which made this even smoother.

### Ask

1. Would the team consider an official `apps/desktop` (or a blessed community shell) at some point?
2. If not on the roadmap, would you be open to pointing users to community desktop shells in the README ecosystem section? I'd be happy to maintain one tagged `dsh-plugin` per the contributing guide.

Happy to share details of my prototype if useful. Thanks for building this!

---

# 中文备注（不用发布）

- 官方 CONTRIBUTING.md 明确说：早期阶段不接受外部 PR，但欢迎生态项目（打 `dsh-plugin` topic）
- 我们的核心策略：独立仓库 + npm 依赖跟踪（tools/update-dsh.sh 一键升级）
- 这个帖子目的：① 表达需求攒票 ② 若官方做了桌面版，直接换官方的，省心
