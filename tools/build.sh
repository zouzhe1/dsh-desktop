#!/usr/bin/env bash
# 一键构建绿色版：
#   tools/build.sh          标准版（仅 Electron 壳，约 348MB；首次运行向导自动装依赖，发布用这个）
#   tools/build.sh full     全内置版（Node + dsh 依赖全打包，约 760MB；仅离线场景自用）
# 可用环境变量覆盖：
#   ELECTRON_MIRROR  Electron 二进制镜像（默认 npmmirror）
#   NODE_MIRROR      Node 二进制镜像（默认 npmmirror）
#   NODE_VERSION     内置 Node 版本（默认 22.23.2，需 >= 22.15 才有 zstd API）
#   OUT              输出目录（默认 <仓库根>/dist/dsh-desktop[-full]）
set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

MODE="${1:-slim}"
if [ "$MODE" = "full" ]; then OUT_DEFAULT="$ROOT/dist/dsh-desktop-full"; else OUT_DEFAULT="$ROOT/dist/dsh-desktop"; fi
OUT="${OUT:-$OUT_DEFAULT}"

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

echo "==> [4/4] 组装 $OUT ($MODE)"
rm -rf "$OUT"
mkdir -p "$OUT/resources/app" "$OUT/server"
cp -r "$ROOT/electron/node_modules/electron/dist/." "$OUT/"
mv "$OUT/electron.exe" "$OUT/DSH桌面版.exe"
cp "$ROOT"/app/* "$OUT/resources/app/"          # main.js / preload.js / package.json / icon.ico
cp "$ROOT/README.md" "$ROOT/README.zh-CN.md" "$ROOT/LICENSE" "$OUT/"

if [ "$MODE" = "full" ]; then
  # 全内置版：内置运行时 + 全部依赖
  cp "$ROOT/build/$NODE_ZIP/node.exe" "$OUT/server/"
  cp -r "$ROOT/server/node_modules" "$OUT/server/node_modules"
else
  # 标准版：只带依赖声明，首次运行时向导自动安装
  cp "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$OUT/server/"
fi

echo ""
echo "构建完成 ✅  $OUT ($([ "$MODE" = "full" ] && echo 全内置版-离线自用 || echo 标准版-发布用))"
