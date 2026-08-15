# DSH 桌面版（绿色版）

DeepSeek Harness（`@deepseek-ai/dsh`）的 Electron 桌面壳，完全自包含、免安装。

## 目录结构

```
C:\Users\zouzhe1\dsh-desktop\
├── DSH桌面版.exe            # 主程序（Electron，双击运行）
├── *.dll / locales / ...     # Electron 运行库
├── resources\
│   └── app\                  # 桌面壳应用（main.js + 图标）
└── server\                   # 内置服务运行时
    ├── node.exe              # Node.js v22.23.2（无需系统安装 Node）
    └── node_modules\         # @deepseek-ai/dsh 0.1.0-rc.6 及全部依赖
```

## 工作原理

1. 双击 exe → Electron 启动，先显示加载页
2. 主进程用内置 `server\node.exe` 拉起 `dsh web --port 0`（随机空闲端口，不冲突）
3. 服务就绪后窗口自动加载 `http://127.0.0.1:<port>`
4. 关闭窗口时自动清理服务进程树

会话数据保存在 `%USERPROFILE%\.dsh`（与命令行版 `npx @deepseek-ai/dsh web` 共用）。

## 特性

- ✅ 免安装、不写注册表，整个文件夹可拷贝到任意位置（拷贝后需重建快捷方式）
- ✅ 不依赖系统 Node.js（内置 node.exe）
- ✅ 单实例：重复双击只聚焦已有窗口
- ✅ 异常退出保护：服务崩溃时弹窗提示并附日志

## 升级 dsh

在源码目录 `ZCodeProject\dsh-desktop\server\` 里改 `package.json` 的版本号后
`npm install`，然后把 `server\node_modules` 覆盖到绿色版的 `server\` 目录即可。

## 源码

源码与构建脚本位于 `C:\Users\zouzhe1\ZCodeProject\dsh-desktop\`：

- `app\main.js` — Electron 主进程
- `tools\draw-icon.ps1` + `tools\pack-ico.js` — 图标生成
- `tools\make-shortcut.ps1` — 桌面快捷方式
- `electron\` — Electron 发行包暂存
- `server\` — dsh 运行时依赖暂存
