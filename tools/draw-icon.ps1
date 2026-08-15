# 绘制 DSH 桌面版图标：深蓝渐变圆角方块 + 白色 "DS"
param([string]$OutDir = "$PSScriptRoot\..\icons")
Add-Type -AssemblyName System.Drawing

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Draw-Icon([int]$size, [string]$path) {
    $bmp = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 圆角矩形路径
    $r = [int][Math]::Max(2, [Math]::Round($size * 0.21))
    $w = $size - 1
    $h = $size - 1
    $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
    $gp = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $gp.AddArc(0, 0, (2 * $r), (2 * $r), 180, 90)
    $gp.AddArc(($w - 2 * $r), 0, (2 * $r), (2 * $r), 270, 90)
    $gp.AddArc(($w - 2 * $r), ($h - 2 * $r), (2 * $r), (2 * $r), 0, 90)
    $gp.AddArc(0, ($h - 2 * $r), (2 * $r), (2 * $r), 90, 90)
    $gp.CloseFigure()

    # 深蓝渐变 (DeepSeek 品牌色系)
    $top = [System.Drawing.Color]::FromArgb(255, 90, 122, 255)
    $bottom = [System.Drawing.Color]::FromArgb(255, 28, 46, 150)
    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $top, $bottom, [single]70)
    $g.FillPath($brush, $gp)

    # 白色 "DS" 文本
    $fontSize = [float][Math]::Round($size * 0.42)
    $font = [System.Drawing.Font]::new('Arial Black', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $fmt = [System.Drawing.StringFormat]::new()
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = [System.Drawing.RectangleF]::new(0, [single]($size * 0.02), [single]$size, [single]$size)
    $g.DrawString('DS', $font, [System.Drawing.Brushes]::White, $textRect, $fmt)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $font.Dispose(); $fmt.Dispose(); $gp.Dispose()
    Write-Host "drawn: $path"
}

foreach ($s in @(16, 24, 32, 48, 64, 128, 256)) {
    Draw-Icon $s (Join-Path $OutDir ("icon_" + $s + ".png"))
}
