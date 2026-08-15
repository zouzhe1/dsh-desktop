#!/usr/bin/env bash
# 一键构建绿色版：下载 Electron / Node 运行时 / dsh 依赖 → 组装到 dist/dsh-desktop/
# 可用环境变量覆盖：
#   ELECTRON_MIRROR  Electron 二进制镜像（默认 npmmirror）
#   NODE_MIRROR      Node 二进制镜像（默认 npmmirror）
#   NODE_VERSION     内置 Node 版本（默认 22.23.2，需 >= 22.15 才有 zstd API）
#   OUT              输出目录（默认 <仓库根>/dist/dsh-desktop）
set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

ELECTRON_MIRROR="${ELECTRON_MIRROR:-https://npmmirror.com/mirrors/electron/}"
NODE_MIRROR="${NODE_MIRROR:-https://npmmirror.com/mirrors/node}"
NODE_VERSION="${NODE_VERSION:-22.23.2}"
OUT="${OUT:-$ROOT/dist/dsh-desktop}"
NODE_ZIP="node-v$NODE_VERSION-win-x64"

echo "==> [1/4] Electron 发行包"
( cd electron \
  && ELECTRON_MIRROR="$ELECTRON_MIRROR" npm install --no-audit --no-fund \
  && ( cd node_modules/electron && ELECTRON_MIRROR="$ELECTRON_MIRROR" node install.js ) )

echo "==> [2/4] dsh 服务依赖"
( cd server && npm install --no-audit --no-fund )

echo "==> [3/4] Node 运行时 ($NODE_VERSION)"
mkdir -p "$ROOT/build"
if [ ! -f "$ROOT/build/$NODE_ZIP/node.exe" ]; then
  ( cd "$ROOT/build" \
    && curl -sLO "$NODE_MIRROR/v$NODE_VERSION/$NODE_ZIP.zip" \
    && rm -rf "$NODE_ZIP" \
    && unzip -q "$NODE_ZIP.zip" )
fi

echo "==> [4/4] 组装 $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/resources/app" "$OUT/server"
cp -r "$ROOT/electron/node_modules/electron/dist/." "$OUT/"
mv "$OUT/electron.exe" "$OUT/DSH桌面版.exe"
cp "$ROOT/app/main.js" "$ROOT/app/package.json" "$ROOT/app/icon.ico" "$OUT/resources/app/"
cp "$ROOT/build/$NODE_ZIP/node.exe" "$OUT/server/"
cp -r "$ROOT/server/node_modules" "$OUT/server/node_modules"
cp "$ROOT/README.md" "$ROOT/LICENSE" "$OUT/"

echo ""
echo "构建完成 ✅  $OUT"
echo "下一步（可选）：powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-shortcut.ps1"
echo "注意：make-shortcut.ps1 里的路径默认指向 C:\\Users\\<你>\\dsh-desktop，按需修改。"
