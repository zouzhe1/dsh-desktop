'use strict';
// DSH 桌面版 — Electron 主进程
// 职责：启动内置 node.exe 运行 dsh web（动态端口），就绪后加载窗口；退出时清理进程树。
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.dirname(process.execPath); // 绿色版根目录（exe 所在目录）
const SERVER_DIR = path.join(ROOT, 'server');
const NODE_EXE = path.join(SERVER_DIR, 'node.exe');
const DSH_BIN = path.join(SERVER_DIR, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
const ICON = path.join(__dirname, 'icon.ico');

const BOOT_TIMEOUT_MS = 90 * 1000;

app.setAppUserModelId('com.deepseek.dsh.desktop');

// ---------- 单实例 ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  boot();
}

let win = null;
let child = null;
let serverUrl = null;
let quitting = false;
let bootTimer = null;

function fatal(title, msg) {
  dialog.showErrorBox(title, msg);
  app.exit(1);
}

function checkLayout() {
  const problems = [];
  if (!fs.existsSync(NODE_EXE)) problems.push(`缺少内置运行时: ${NODE_EXE}`);
  if (!fs.existsSync(DSH_BIN)) problems.push(`缺少 dsh 程序: ${DSH_BIN}`);
  if (problems.length) {
    fatal('DSH 桌面版 - 文件不完整',
      problems.join('\n') + '\n\n请确认绿色版目录完整（server 子目录不能删除）。');
  }
}

function killTree(pid) {
  if (!pid) return;
  try {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } catch (_) { /* 尽力而为 */ }
}

const LOADING_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;
background:linear-gradient(160deg,#101426,#1c2a5e 60%,#2b46c8);color:#fff;
font-family:"Segoe UI","Microsoft YaHei",sans-serif}
.box{text-align:center}
.spinner{width:54px;height:54px;margin:0 auto 22px;border-radius:50%;
border:4px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
h1{font-size:19px;font-weight:600;margin:0 0 8px}
p{font-size:13px;opacity:.75;margin:0}
</style></head><body><div class="box">
<div class="spinner"></div>
<h1>正在启动 DeepSeek Harness…</h1>
<p>首次启动需要加载插件，请稍候</p>
</div></body></html>`;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    icon: ICON,
    autoHideMenuBar: true,
    backgroundColor: '#101426',
    title: 'DSH 桌面版',
    show: true,
    webPreferences: {
      // dsh web 是本地服务，页面自身管理交互；无需 node 集成
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(LOADING_HTML));
  win.on('closed', () => { win = null; });
}

function startServer() {
  const env = Object.assign({}, process.env);
  // 让 dsh 的 plugin 子命令能找到 pnpm（全局 npm 目录）
  if (env.APPDATA) {
    const npmDir = path.join(env.APPDATA, 'npm');
    env.PATH = npmDir + ';' + (env.PATH || '');
  }
  // 防止以 node 模式传染子进程
  delete env.ELECTRON_RUN_AS_NODE;

  child = spawn(NODE_EXE, [DSH_BIN, 'web', '--port', '0'], {
    cwd: SERVER_DIR,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let outBuf = '';
  let errBuf = '';
  child.stdout.on('data', (d) => {
    outBuf += d.toString();
    if (!serverUrl) {
      const m = outBuf.match(/http:\/\/(127\.0\.0\.1|localhost):(\d+)/);
      if (m) {
        serverUrl = `http://${m[1]}:${m[2]}`;
        clearTimeout(bootTimer);
        onServerReady();
      }
    }
  });
  child.stderr.on('data', (d) => { errBuf += d.toString(); });

  child.on('exit', (code) => {
    if (quitting) return;
    if (!serverUrl) {
      clearTimeout(bootTimer);
      fatal('DSH 桌面版 - 服务启动失败',
        `dsh web 进程退出（code=${code}）。\n\n--- stdout ---\n${outBuf.slice(-2000)}\n\n--- stderr ---\n${errBuf.slice(-2000)}`);
    } else {
      dialog.showErrorBox('DSH 桌面版 - 服务已退出',
        `后台服务意外退出（code=${code}），窗口即将关闭。\n\n${errBuf.slice(-1000)}`);
      app.quit();
    }
  });

  bootTimer = setTimeout(() => {
    if (!serverUrl) {
      fatal('DSH 桌面版 - 启动超时',
        `在 ${BOOT_TIMEOUT_MS / 1000} 秒内未检测到服务就绪。\n\n--- stdout ---\n${outBuf.slice(-2000)}\n\n--- stderr ---\n${errBuf.slice(-2000)}`);
    }
  }, BOOT_TIMEOUT_MS);
}

function onServerReady() {
  if (!win) createWindow();
  win.loadURL(serverUrl);
}

function boot() {
  checkLayout();
  app.whenReady().then(() => {
    createWindow();
    startServer();
  });

  app.on('before-quit', () => {
    quitting = true;
    clearTimeout(bootTimer);
    killTree(child && child.pid);
  });

  app.on('window-all-closed', () => app.quit());
}
