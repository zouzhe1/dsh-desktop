#!/usr/bin/env bash
# 升级 dsh 到最新版本，并同步到绿色版目录
set -e
cd "$(dirname "$0")/.."

# 绿色版安装位置（移动过文件夹的话改这里）
PORTABLE_DIR="${PORTABLE_DIR:-$HOME/dsh-desktop}"

cd server
LATEST=$(npm view @deepseek-ai/dsh version)
CURRENT=$(node -p "require('./package.json').dependencies['@deepseek-ai/dsh']")
echo "当前版本: $CURRENT"
echo "最新版本: $LATEST"

if [ "$CURRENT" = "$LATEST" ]; then
  echo "已是最新版本，无需升级"
  exit 0
fi

read -p "升级到 $LATEST？[y/N] " ans
if [[ ! "$ans" =~ ^[yY]$ ]]; then exit 0; fi

npm pkg set "dependencies.@deepseek-ai/dsh=$LATEST"
npm install --no-audit --no-fund

echo "同步 node_modules 到绿色版目录..."
robocopy "$(cygpath -w "$PWD/node_modules")" "$(cygpath -w "$PORTABLE_DIR/server/node_modules")" //E //NFL //NDL //NJH //NJS //NP > /dev/null
echo "完成 ✅  双击桌面图标即可使用新版（注意 rc 版本可能有破坏性变更）"
