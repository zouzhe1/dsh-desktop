# Release 发布说明（粘贴到 GitHub Release 用）

> 操作位置：仓库页面 → Releases → Draft a new release
> Tag: `v1.1.0`（推送标签后自动关联）→ 标题照抄 → 正文粘贴下面双语 → 附上两个 ZIP → Publish

---

## 标题

DSH Desktop v1.1.0 — first-run setup wizard, 44% smaller download

## 正文

### English

**DSH Desktop v1.1.0** — a much smaller download that sets itself up on first run. 🪶

> ⚠️ Independent community project — not affiliated with or endorsed by DeepSeek AI. See [README](../../blob/main/README.md#license--credits) for license boundaries.

**Download available:**

| Build | Zipped | Best for |
|---|---|---|
| **Standard** `…win-x64.zip` (recommended) | ~138 MB | Most users — first-run wizard auto-detects your environment, reuses system Node.js if present, downloads the rest from your region's mirror (npmmirror in China, official sources elsewhere) |

**Install (3 steps):**
1. Download a ZIP below and extract to any folder
2. Double-click `DSH桌面版.exe`
3. Follow the setup wizard (one time, ~1–5 min depending on network)

**Includes:** Electron 43.4.0 · @deepseek-ai/dsh 0.1.0-rc.6 · Node.js 22.23.2 (auto-fetched on first run)
**Platform:** Windows x64 · Portable — no installer, no registry writes

### 中文

**DSH Desktop v1.1.0** —— 下载体积大幅缩小（约 138 MB），首次运行自动配置。🪶

> ⚠️ 独立社区项目，与 DeepSeek AI 无关联。许可边界见 [README](../../blob/main/README.zh-CN.md#许可与致谢)。

**下载：**

| 版本 | 压缩包 | 适合 |
|---|---|---|
| **标准版** `…win-x64.zip` | 约 138 MB | 大多数用户——首启向导自动检测环境，有系统 Node 直接复用，缺的从地区镜像下载（中国走 npmmirror，其他地区走官方源） |

**安装（三步）：**
1. 下载下方 ZIP 解压到任意文件夹
2. 双击 `DSH桌面版.exe`
3. 跟着首次运行向导走（仅一次，约 1–5 分钟，视网速）

**内置：** Electron 43.4.0 · @deepseek-ai/dsh 0.1.0-rc.6 · Node.js 22.23.2（首次运行自动获取）
**平台：** Windows x64 · 绿色免安装，不写注册表

---

# 提醒：推送时连标签一起推

```bash
git push -u origin main --tags
```
