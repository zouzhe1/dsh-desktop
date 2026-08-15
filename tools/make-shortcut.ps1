# 创建桌面快捷方式（用户级，无需管理员）
$ErrorActionPreference = 'Stop'

$root = 'C:\Users\zouzhe1\dsh-desktop'
$exe  = Join-Path $root 'DSH桌面版.exe'
$ico  = Join-Path $root 'resources\app\icon.ico'

if (-not (Test-Path $exe)) { throw "未找到主程序: $exe" }
if (-not (Test-Path $ico)) { throw "未找到图标: $ico" }

$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'DSH 桌面版.lnk'

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnkPath)
$sc.TargetPath = $exe
$sc.WorkingDirectory = $root
$sc.IconLocation = "$ico,0"
$sc.Description = 'DeepSeek Harness 桌面版（绿色版）'
$sc.Save()

Write-Host "快捷方式已创建: $lnkPath"
