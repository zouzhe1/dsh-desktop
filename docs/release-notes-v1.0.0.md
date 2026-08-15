# Release v1.0.0 发布说明（粘贴到 GitHub Release 用）

> 操作位置：仓库页面 → Releases → Draft a new release
> Tag: `v1.0.0`（已有本地标签，推送后自动关联）→ 标题照抄 → 正文粘贴下面双语 → 附上 ZIP → Publish

---

## 标题

DSH Desktop v1.0.0 — first portable release

## 正文

### English

**DSH Desktop v1.0.0** — the first portable release. 🎉

A desktop app for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): double-click one icon, use the full Web UI in its own window. No browser, no terminal, no Node.js installation.

> ⚠️ Independent community project — not affiliated with or endorsed by DeepSeek AI. See [README](../../blob/main/README.md#license--credits) for license boundaries.

**Install (3 steps):**
1. Download `dsh-desktop-v1.0.0-win-x64-portable.zip` below
2. Extract to any folder
3. Double-click `DSH桌面版.exe`

**Includes:** Electron 43.4.0 · Node.js 22.23.2 · @deepseek-ai/dsh 0.1.0-rc.6
**Platform:** Windows x64 · **Size:** ~760 MB unzipped · Portable — no installer, no registry writes

### 中文

**DSH Desktop v1.0.0** —— 首个绿色版发布。🎉

DeepSeek Harness 的桌面应用：双击图标，在独立窗口使用完整 Web 界面。免浏览器、免终端、免安装 Node.js。

> ⚠️ 独立社区项目，与 DeepSeek AI 无关联。许可边界见 [README](../../blob/main/README.zh-CN.md#许可与致谢)。

**安装（三步）：**
1. 下载下方 `dsh-desktop-v1.0.0-win-x64-portable.zip`
2. 解压到任意文件夹
3. 双击 `DSH桌面版.exe`

**内置：** Electron 43.4.0 · Node.js 22.23.2 · @deepseek-ai/dsh 0.1.0-rc.6
**平台：** Windows x64 · **大小：** 解压后约 760 MB · 绿色免安装，不写注册表

---

# 提醒：推送时连标签一起推

```bash
git push -u origin main --tags
```
