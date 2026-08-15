'use strict';
// 向导页与主进程之间的安全桥（contextIsolation 下唯一暴露面）
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshBootstrap', {
  onEvent: (cb) => ipcRenderer.on('bootstrap-event', (_e, data) => cb(data)),
  setMirror: (m) => ipcRenderer.send('bootstrap-set-mirror', m),
  retry: () => ipcRenderer.send('bootstrap-retry'),
});
