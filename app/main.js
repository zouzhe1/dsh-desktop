'use strict';
// DSH 桌面版 — Electron 主进程（带首次运行引导）
// 流程：环境检查 → (按需)按地区镜像下载 Node 运行时 → (按需)npm 安装 dsh → 启动服务 → 加载窗口
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ROOT = path.dirname(process.execPath); // 绿色版根目录（exe 所在目录）
const SERVER_DIR = path.join(ROOT, 'server');
const BUNDLED_NODE = path.join(SERVER_DIR, 'node.exe');           // 完整版自带
const RUNTIME_DIR = path.join(SERVER_DIR, 'runtime');             // 精简版下载的运行时
const DSH_BIN = path.join(SERVER_DIR, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
const CONFIG_FILE = path.join(ROOT, 'dsh-desktop-config.json');
const LOG_FILE = path.join(ROOT, 'bootstrap.log');
const ICON = path.join(__dirname, 'icon.ico');

const NODE_VERSION = process.env.DSH_DESKTOP_NODE_VERSION || '22.23.2';
const SERVER_BOOT_TIMEOUT_MS = 120 * 1000;

// ---------- 地区镜像 ----------
const MIRRORS = {
  china: {
    label: '中国镜像 (npmmirror)',
    nodeBase: 'https://npmmirror.com/mirrors/node',
    registry: 'https://registry.npmmirror.com',
  },
  global: {
    label: '国际官方源 (nodejs.org / npmjs.org)',
    nodeBase: 'https://nodejs.org/dist',
    registry: 'https://registry.npmjs.org',
  },
};
const CHINA_TZ = new Set(['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Urumqi', 'Asia/Harbin', 'Asia/Kashgar', 'PRC']);

function detectRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return CHINA_TZ.has(tz) ? 'china' : 'global';
  } catch (_) { return 'global'; }
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (_) { return {}; }
}
function saveConfig(cfg) {
  try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); } catch (_) {}
}

function log(line) {
  try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`); } catch (_) {}
}

// ---------- 单实例 ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  main();
}

app.setAppUserModelId('com.deepseek.dsh.desktop');

let win = null;
let child = null;
let serverUrl = null;
let quitting = false;
let serverTimer = null;
let bootstrapping = false;

function fatal(title, msg) { dialog.showErrorBox(title, msg); app.exit(1); }
function killTree(pid) {
  if (!pid) return;
  try { spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch (_) {}
}

// ---------- 窗口 ----------
const WIZARD_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:linear-gradient(160deg,#101426,#1c2a5e 60%,#2b46c8);
color:#fff;font-family:"Segoe UI","Microsoft YaHei",sans-serif;display:flex;align-items:center;justify-content:center}
.box{width:min(560px,88vw)}
h1{font-size:20px;font-weight:600;margin:0 0 4px}
.sub{font-size:12px;opacity:.65;margin:0 0 26px}
.steps{display:flex;gap:8px;margin-bottom:18px}
.step{flex:1;text-align:center;font-size:12px;padding:8px 4px;border-radius:8px;
background:rgba(255,255,255,.08);opacity:.5;transition:all .3s}
.step.on{opacity:1;background:rgba(255,255,255,.22);font-weight:600}
.step.ok{opacity:1;background:rgba(80,220,140,.35)}
.bar{height:12px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:12px}
.fill{height:100%;width:0;background:linear-gradient(90deg,#7ea0ff,#fff);transition:width .25s}
.indet .fill{width:35%;animation:slide 1.1s linear infinite}
@keyframes slide{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
.status{font-size:14px;margin-bottom:6px}
.detail{font-size:11.5px;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:16px}
.row{display:flex;justify-content:space-between;align-items:center;margin-top:22px}
select,button{font:inherit;border-radius:8px;border:1px solid rgba(255,255,255,.35);
background:rgba(255,255,255,.1);color:#fff;padding:6px 10px;outline:none}
select:disabled{opacity:.5}
button.retry{display:none;cursor:pointer;background:#e5484d;border-color:#e5484d;font-weight:600}
button.retry.show{display:inline-block}
.err{display:none;margin-top:14px;font-size:12.5px;background:rgba(229,72,77,.18);border:1px solid rgba(229,72,77,.5);
border-radius:8px;padding:10px;white-space:pre-wrap;max-height:130px;overflow:auto}
.err.show{display:block}
.mirror{font-size:11.5px;opacity:.6}
</style></head><body><div class="box">
<h1>DSH 桌面版 · 首次运行准备</h1>
<p class="sub">First-run setup — checking environment and fetching missing components</p>
<div class="steps">
  <div class="step" id="s1">① 环境检查</div>
  <div class="step" id="s2">② 运行时</div>
  <div class="step" id="s3">③ 组件安装</div>
  <div class="step" id="s4">④ 启动服务</div>
</div>
<div class="bar indet" id="bar"><div class="fill" id="fill"></div></div>
<div class="status" id="status">正在检查运行环境…</div>
<div class="detail" id="detail"></div>
<div class="row">
  <span class="mirror">下载源：<span id="mirrorNow">自动检测</span></span>
  <span>
    <select id="mirror" disabled>
      <option value="auto">自动（按地区）</option>
      <option value="china">中国镜像</option>
      <option value="global">国际官方源</option>
    </select>
    <button class="retry" id="retry">重试</button>
  </span>
</div>
<div class="err" id="err"></div>
</div>
<script>
const $ = (id) => document.getElementById(id);
const STEPS = ['s1','s2','s3','s4'];
function setSteps(active, doneUpTo) {
  STEPS.forEach((id, i) => {
    const el = $(id);
    el.className = 'step' + (i === active ? ' on' : '') + (i <= doneUpTo ? ' ok' : '');
  });
}
if (window.dshBootstrap) {
  window.dshBootstrap.onEvent((ev) => {
    const map = { check:0, node:1, nodeExtract:1, deps:2, server:3, done:4, error:-1 };
    if (ev.stage === 'error') {
      setSteps(-1, -1);
      $('status').textContent = '出错了 / Something went wrong';
      $('detail').textContent = '';
      $('err').textContent = (ev.detail || '') + (ev.log ? '\\n\\n日志 / log: ' + ev.log : '');
      $('err').classList.add('show');
      $('retry').classList.add('show');
      $('mirror').disabled = false;
      $('bar').classList.remove('indet');
      $('fill').style.width = '0';
      return;
    }
    $('err').classList.remove('show');
    $('retry').classList.remove('show');
    $('mirror').disabled = ev.stage !== 'done';
    const idx = map[ev.stage] !== undefined ? map[ev.stage] : -1;
    setSteps(idx, idx - 1);
    if (ev.mirrorLabel) $('mirrorNow').textContent = ev.mirrorLabel;
    if (typeof ev.percent === 'number') {
      $('bar').classList.remove('indet');
      $('fill').style.width = ev.percent.toFixed(1) + '%';
    } else {
      $('bar').classList.add('indet');
    }
    if (ev.status) $('status').textContent = ev.status;
    if (ev.detail) $('detail').textContent = ev.detail;
    if (ev.stage === 'done') {
      $('bar').classList.remove('indet');
      $('fill').style.width = '100%';
      $('status').textContent = '就绪，正在打开主界面…';
    }
  });
  $('retry').onclick = () => window.dshBootstrap.retry();
  $('mirror').onchange = () => window.dshBootstrap.setMirror($('mirror').value);
}
</script></body></html>`;

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 960, minHeight: 640,
    icon: ICON, autoHideMenuBar: true, backgroundColor: '#101426',
    title: 'DSH 桌面版', show: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(WIZARD_HTML));
  win.on('closed', () => { win = null; });
}

function ev(data) {
  log(`${data.stage} ${data.status || ''} ${data.detail || ''} ${data.percent ?? ''}`);
  if (win && !win.isDestroyed()) win.webContents.send('bootstrap-event', data);
}

// ---------- 环境探测 ----------
// 探测系统 PATH 上的 node 是否具备 dsh 所需能力（≥22.15 的 zstd API）
function probeSystemNode() {
  try {
    const cap = spawnSync('node', ['-e', 'process.exit(require("node:zlib").zstdCompressSync ? 0 : 1)'],
      { timeout: 10000, windowsHide: true, encoding: 'utf8' });
    if (cap.status === 0) {
      const w = spawnSync('where', ['node'], { timeout: 5000, encoding: 'utf8' });
      const exePath = ((w.stdout || '').split(/\r?\n/)[0] || '').trim();
      if (exePath && fs.existsSync(exePath)) {
        const v = (spawnSync('node', ['-v'], { timeout: 5000, encoding: 'utf8' }).stdout || '').trim();
        return { exePath, version: v };
      }
    }
  } catch (_) {}
  return null;
}

function npmCliOf(nodeExePath) {
  const cli = path.join(path.dirname(nodeExePath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  return fs.existsSync(cli) ? cli : null;
}

// ---------- 下载（带进度/重定向） ----------
function download(url, destFile, onPercent) {
  return new Promise((resolve, reject) => {
    let redirects = 0;
    const attempt = (u) => {
      https.get(u, { headers: { 'User-Agent': 'dsh-desktop/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
          redirects += 1;
          res.resume();
          return attempt(new URL(res.headers.location, u).href);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`下载失败 HTTP ${res.statusCode}: ${u}`));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let got = 0;
        const file = fs.createWriteStream(destFile);
        res.on('data', (c) => {
          got += c.length;
          if (total) onPercent(Math.min(100, (got / total) * 100), got, total);
        });
        res.on('error', (e) => { file.close(); reject(e); });
        res.on('end', () => file.end(() => resolve(destFile)));
        res.pipe(file);
        file.on('error', (e) => reject(e));
      }).on('error', reject);
    };
    attempt(url);
  });
}

function fmtMB(n) { return (n / 1024 / 1024).toFixed(1) + ' MB'; }

// ---------- 引导主流程 ----------
async function bootstrap() {
  if (bootstrapping) return;
  bootstrapping = true;
  try {
    const cfg = loadConfig();
    const choice = ['auto', 'china', 'global'].includes(cfg.mirror) ? cfg.mirror : 'auto';
    const region = choice === 'auto' ? detectRegion() : choice;
    const mirror = MIRRORS[region];
    ev({ stage: 'check', status: '正在检查运行环境…', mirrorLabel: mirror.label });

    // 1) 解析 Node 运行时（优先级：内置 → 已下载缓存 → 系统 → 在线下载）
    let nodeExe = null;
    if (fs.existsSync(BUNDLED_NODE)) {
      nodeExe = BUNDLED_NODE;
      ev({ stage: 'check', status: '使用内置运行时', detail: 'bundled node' });
    } else {
      const cached = path.join(RUNTIME_DIR, `node-v${NODE_VERSION}-win-x64`, 'node.exe');
      if (fs.existsSync(cached)) {
        nodeExe = cached;
        ev({ stage: 'check', status: `复用已下载的 Node v${NODE_VERSION}`, detail: cached });
      } else {
        const sys = probeSystemNode();
        if (sys) {
          nodeExe = sys.exePath;
          ev({ stage: 'check', status: `检测到系统 Node ${sys.version}，直接复用，无需下载`, detail: sys.exePath });
        }
      }
    }

    // 2) 需要时下载运行时
    if (!nodeExe) {
      const zipName = `node-v${NODE_VERSION}-win-x64.zip`;
      const url = `${mirror.nodeBase}/v${NODE_VERSION}/${zipName}`;
      const zipPath = path.join(RUNTIME_DIR, zipName);
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
      fs.rmSync(path.join(RUNTIME_DIR, `node-v${NODE_VERSION}-win-x64`), { recursive: true, force: true });
      ev({ stage: 'node', status: `下载 Node.js v${NODE_VERSION} 运行时`, detail: url });
      await download(url, zipPath, (p, got, total) => {
        ev({ stage: 'node', percent: p, status: `下载 Node.js 运行时 ${p.toFixed(0)}%`, detail: `${fmtMB(got)} / ${fmtMB(total)}` });
      });
      ev({ stage: 'nodeExtract', status: '解压运行时…', detail: zipPath });
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
      let ok = spawnSync('tar', ['-xf', zipPath, '-C', RUNTIME_DIR], { timeout: 120000, windowsHide: true }).status === 0;
      if (!ok) {
        ok = spawnSync('powershell', ['-NoProfile', '-Command',
          `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${RUNTIME_DIR}' -Force`],
          { timeout: 180000, windowsHide: true }).status === 0;
      }
      const downloaded = path.join(RUNTIME_DIR, `node-v${NODE_VERSION}-win-x64`, 'node.exe');
      if (!ok || !fs.existsSync(downloaded)) throw new Error('解压运行时失败（tar 与 Expand-Archive 均失败）');
      fs.rmSync(zipPath, { force: true });
      nodeExe = downloaded;
      ev({ stage: 'nodeExtract', status: '运行时就绪', detail: downloaded });
    }

    // 3) 按需安装 dsh 依赖
    if (!fs.existsSync(DSH_BIN)) {
      if (!fs.existsSync(path.join(SERVER_DIR, 'package.json'))) {
        throw new Error(`缺少 ${path.join(SERVER_DIR, 'package.json')}，安装包不完整`);
      }
      const npmCli = npmCliOf(nodeExe);
      if (!npmCli) throw new Error('未找到 npm（node 发行异常）');
      ev({ stage: 'deps', status: '安装 dsh 及其依赖（仅首次，之后跳过）', detail: `registry: ${mirror.registry}` });
      await new Promise((resolve, reject) => {
        // 关键：把 node 所在目录注入 PATH，否则 koffi 等依赖的安装脚本
        // 裸调 `node` 时（用户系统未装 Node 的场景）会找不到命令
        const env = Object.assign({}, process.env);
        env.PATH = path.dirname(nodeExe) + ';' + (env.PATH || '');
        const p = spawn(nodeExe, [npmCli, 'install', '--prefix', SERVER_DIR,
          '--registry', mirror.registry, '--no-audit', '--no-fund', '--loglevel', 'error'],
          { cwd: SERVER_DIR, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
        let tail = '';
        const feed = (d) => {
          tail = (tail + d.toString()).split(/[\r\n]+/).filter(Boolean).slice(-3).join(' ⏐ ');
          ev({ stage: 'deps', status: '安装 dsh 及其依赖…', detail: tail.slice(-160) });
        };
        p.stdout.on('data', feed); p.stderr.on('data', feed);
        p.on('error', reject);
        p.on('exit', (code) => (code === 0 && fs.existsSync(DSH_BIN) ? resolve() : reject(new Error(`npm install 退出码 ${code}`))));
      });
      ev({ stage: 'deps', status: '依赖安装完成' });
    }

    // 4) 启动服务
    ev({ stage: 'server', status: '启动本地服务…' });
    await startServer(nodeExe);
    ev({ stage: 'done', percent: 100 });
    if (win) win.loadURL(serverUrl);
  } catch (e) {
    log(`ERROR ${e && e.stack || e}`);
    ev({ stage: 'error', detail: String((e && e.message) || e), log: LOG_FILE });
  } finally {
    bootstrapping = false;
  }
}

function startServer(nodeExe) {
  return new Promise((resolve) => {
    const env = Object.assign({}, process.env);
    env.PATH = path.dirname(nodeExe) + ';' + (env.PATH || ''); // 子脚本可裸调 node
    if (env.APPDATA && fs.existsSync(path.join(env.APPDATA, 'npm'))) {
      env.PATH = path.join(env.APPDATA, 'npm') + ';' + env.PATH; // dsh plugin 子命令用 pnpm
    }
    delete env.ELECTRON_RUN_AS_NODE;

    child = spawn(nodeExe, [DSH_BIN, 'web', '--port', '0'], {
      cwd: SERVER_DIR, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let out = ''; let err2 = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
      if (!serverUrl) {
        const m = out.match(/http:\/\/(127\.0\.0\.1|localhost):(\d+)/);
        if (m) {
          serverUrl = `http://${m[1]}:${m[2]}`;
          clearTimeout(serverTimer);
          resolve();
        }
      }
    });
    child.stderr.on('data', (d) => { err2 += d.toString(); });
    child.on('exit', (code) => {
      if (quitting) return;
      if (!serverUrl) {
        clearTimeout(serverTimer);
        ev({ stage: 'error', detail: `服务启动失败 (code=${code})\n${(out + err2).slice(-1200)}`, log: LOG_FILE });
      } else {
        dialog.showErrorBox('DSH 桌面版 - 服务已退出', `后台服务意外退出（code=${code}），窗口即将关闭。`);
        app.quit();
      }
    });
    serverTimer = setTimeout(() => {
      if (!serverUrl) ev({ stage: 'error', detail: `启动超时（${SERVER_BOOT_TIMEOUT_MS / 1000}s）\n${(out + err2).slice(-1200)}`, log: LOG_FILE });
    }, SERVER_BOOT_TIMEOUT_MS);
  });
}

function main() {
  app.whenReady().then(() => {
    createWindow();
    bootstrap();
  });
  ipcMain.on('bootstrap-retry', () => { if (!bootstrapping) bootstrap(); });
  ipcMain.on('bootstrap-set-mirror', (_e, m) => {
    if (['auto', 'china', 'global'].includes(m)) saveConfig(Object.assign(loadConfig(), { mirror: m }));
  });
  app.on('before-quit', () => { quitting = true; clearTimeout(serverTimer); killTree(child && child.pid); });
  app.on('window-all-closed', () => app.quit());
}
