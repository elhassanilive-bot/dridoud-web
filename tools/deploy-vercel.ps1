param(
  [switch]$SkipInstall,
  [switch]$SkipLint,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "الأمر '$name' غير موجود على هذا الجهاز. ثبّته أولًا ثم أعد المحاولة."
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Step "التحقق من المتطلبات"
Assert-Command "npm"
Assert-Command "npx"

$vercelProjectFile = Join-Path $projectRoot ".vercel\\project.json"
if (-not (Test-Path $vercelProjectFile)) {
  throw "ملف .vercel/project.json غير موجود. شغّل 'npx vercel login' ثم 'npx vercel link' مرة واحدة فقط، وبعدها أعد تشغيل هذا السكريبت."
}

if (-not $SkipInstall) {
  Write-Step "تثبيت الاعتمادات"
  if (Test-Path (Join-Path $projectRoot "package-lock.json")) {
    npm ci
  } else {
    npm install
  }
}

if (-not $SkipLint) {
  Write-Step "فحص الشيفرة"
  npm run lint
}

if (-not $SkipBuild) {
  Write-Step "بناء المشروع"
  npm run build
}

Write-Step "النشر على Vercel Production"
npx vercel --prod --yes

Write-Host ""
Write-Host "تم إرسال آخر التغييرات إلى Vercel." -ForegroundColor Green
Write-Host "إذا نجح النشر فستظهر على: https://dridoud-web.vercel.app/" -ForegroundColor Green
