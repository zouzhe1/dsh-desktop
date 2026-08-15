# DSH Desktop 桌面版

[English](README.md) | **简体中文**

> ⚠️ **这是一个独立的社区项目。**
> 与 DeepSeek AI **没有**隶属、合作或背书关系。
> [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）由 DeepSeek AI 开发（MIT 许可），本项目仅将其作为依赖打包在内。"DeepSeek" 及相关名称归其权利人所有。

DeepSeek Harness 的桌面应用：**双击一个图标，在独立窗口里使用完整的 Web 界面。** 不需要浏览器、不需要终端、不需要安装 Node.js。

---

## 普通用户：三步上手

1. **下载**：打开本仓库的 [Releases 发布页](../../releases)，下载最新的 ZIP 压缩包。
2. **解压**：解压到任意文件夹（比如 `C:\dsh-desktop`）。⚠️ 文件夹里的东西要保持完整，不要拆开。
3. **双击 `DSH桌面版.exe`**（文件夹里唯一的 `.exe`）。

完成！首次启动会先显示几秒加载画面（后台服务正在启动），然后自动进入界面。

### 常见问题

| 问题 | 答案 |
|---|---|
| 我的聊天记录存在哪？ | `C:\Users\<你的用户名>\.dsh`，和命令行版（`npx @deepseek-ai/dsh web`）共用 |
| 以后能搬走这个文件夹吗？ | 能，整个文件夹随便移动。搬完记得重建桌面快捷方式。 |
| 能同时开两个窗口吗？ | 不能——再次双击只会聚焦到已打开的窗口（防重复设计）。 |
| 用什么端口？要配置吗？ | 每次启动自动挑一个空闲端口，零配置、永不冲突。 |
| 杀毒软件报警？ | 本应用完全本地运行、无遥测。改名的 Electron 程序偶尔触发启发式误报，属误判。 |

### 怎么升级新版本

下载新的 release ZIP → 解压 → 用新文件夹替换旧文件夹即可。聊天记录存在应用文件夹**外面**，不受影响。

---

## 开发者

### 从源码构建

环境要求：git、Node.js ≥ 22.15、npm（Windows 下用 Git Bash）。

```bash
git clone https://github.com/<你的用户名>/dsh-desktop.git
cd dsh-desktop
tools/build.sh        # 组装出 dist/dsh-desktop/（约 760 MB）
```

可选：运行 `tools/make-shortcut.ps1` 创建桌面快捷方式（先改脚本里的路径）。

`build.sh` 默认从 [npmmirror 镜像](https://npmmirror.com/mirrors/)下载 Electron 和 Node.js，可用环境变量 `ELECTRON_MIRROR`、`NODE_MIRROR`、`NODE_VERSION` 覆盖。

### 跟进上游 dsh 新版本

```bash
tools/update-dsh.sh   # 自动检查 npm 最新版 → 确认 → 升级 → 同步到绿色版目录
```

> dsh 目前处于 `0.1.0-rc` 阶段，rc 版本可能有破坏性变更，升级后建议先试用。

### 工作原理

```
DSH桌面版.exe (Electron)
 ├─ 先显示加载页
 ├─ 启动 server\node.exe → dsh web --port 0  （随机空闲端口）
 └─ 窗口加载 http://127.0.0.1:<端口>
```

没有改动 harness 的任何代码：`/api` 信任防线接受的正是窗口的 `127.0.0.1:<端口>` 来源，与浏览器标签页完全一致。

### 仓库结构

```
app/       Electron 主进程 + 窗口图标
electron/  Electron 官方发行包暂存
server/    dsh 依赖声明 + 内置 Node 运行时目标
tools/     build.sh · update-dsh.sh · 图标与快捷方式脚本
docs/      给官方的 Discussions 草稿
```

---

## 许可与致谢

| 组成部分 | 许可证 | 归属 |
|---|---|---|
| **本仓库**（Electron 壳、构建/升级脚本、文档） | MIT © 2026 zouzhe1 | 本项目 |
| [@deepseek-ai/dsh](https://github.com/deepseek-ai/deepseek-harness)（作为依赖打包） | MIT © DeepSeek AI | DeepSeek AI |
| [Electron](https://www.electronjs.org)（二进制发行包） | MIT | OpenJS Foundation 及 Electron 贡献者 |
| [Node.js](https://nodejs.org)（内置运行时） | MIT | OpenJS Foundation |

本仓库的 MIT 许可证**只覆盖我们自己写的代码**（外壳和脚本）。打包在内的各组件归各自权利人所有，按其自身许可分发。
