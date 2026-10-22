# make-marks.ps1 — 由 mylogo.png 產生網頁用的標誌與 favicon
#
#   來源：mylogo.png（250×250，透明背景，金色徽標）
#   產出：
#     mark-gold.png   原色金（深色主題用）
#     mark-amber.png  深琥珀（淺色主題用，奶油底上才夠清楚）
#     favicon-64.png  64×64 favicon
#     apple-touch-180.png  180×180（iOS 加到主畫面；白底圓角前先鋪奶油底）
#
# 用法：& .\tools\make-marks.ps1      （請保持本檔 UTF-8，勿用 Set-Content 重寫）

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$dir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$src = Join-Path $dir "mylogo.png"

$img = [System.Drawing.Image]::FromFile($src)
$srcBmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g0 = [System.Drawing.Graphics]::FromImage($srcBmp)
$g0.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g0.Dispose(); $img.Dispose()

function Recolor([System.Drawing.Bitmap]$bmp, [double]$mul, [int]$addR, [int]$addG, [int]$addB, [string]$path) {
  $o = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $p = $bmp.GetPixel($x, $y)
      if ($p.A -eq 0) { continue }
      $r = [Math]::Min(255, [Math]::Max(0, [int]($p.R * $mul) + $addR))
      $g = [Math]::Min(255, [Math]::Max(0, [int]($p.G * $mul) + $addG))
      $b = [Math]::Min(255, [Math]::Max(0, [int]($p.B * $mul) + $addB))
      $o.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $r, $g, $b))
    }
  }
  $o.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $o.Dispose()
}

function SaveSquare([System.Drawing.Bitmap]$bmp, [int]$size, [string]$path, [System.Drawing.Color]$bg) {
  $dst = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gr = [System.Drawing.Graphics]::FromImage($dst)
  $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gr.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($bg.A -gt 0) { $gr.Clear($bg) } else { $gr.Clear([System.Drawing.Color]::Transparent) }
  $gr.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
  $gr.Dispose()
  $dst.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose()
}

# 原色金（深色主題）
Recolor $srcBmp 1.0 0 0 0 (Join-Path $dir "mark-gold.png")
# 深琥珀（淺色主題）：壓暗並往紅棕偏一點
Recolor $srcBmp 0.66 26 -6 -18 (Join-Path $dir "mark-amber.png")

$goldBmp = New-Object System.Drawing.Bitmap((Join-Path $dir "mark-gold.png"))
$amberBmp = New-Object System.Drawing.Bitmap((Join-Path $dir "mark-amber.png"))

SaveSquare $amberBmp 64 (Join-Path $dir "favicon-64.png") ([System.Drawing.Color]::Transparent)
SaveSquare $srcBmp 180 (Join-Path $dir "apple-touch-180.png") ([System.Drawing.Color]::FromArgb(255, 250, 245, 234))

$goldBmp.Dispose(); $amberBmp.Dispose(); $srcBmp.Dispose()

foreach ($f in @("mark-gold.png", "mark-amber.png", "favicon-64.png", "apple-touch-180.png")) {
  $fi = Get-Item (Join-Path $dir $f)
  $bi = [System.Drawing.Image]::FromFile($fi.FullName)
  "{0}: {1} bytes, {2}x{3}" -f $f, $fi.Length, $bi.Width, $bi.Height
  $bi.Dispose()
}
