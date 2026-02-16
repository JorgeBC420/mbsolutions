# MB Solutions - Backend Setup Script para Windows
# Este script instala dependencias e inicia el servidor

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      MB Solutions - Backend Setup & Launch Script         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js esta instalado
$nodeInstalled = $false
try {
    $nodeVersion = node --version
    $nodeInstalled = $true
    Write-Host "[OK] Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado. Por favor instala Node.js primero." -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Navegar a la carpeta backend
$backendPath = ".\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "[ERROR] Carpeta 'backend' no encontrada" -ForegroundColor Red
    exit 1
}

push-location $backendPath
Write-Host "[INFO] Entrando en carpeta backend..." -ForegroundColor Yellow
Write-Host ""

# Verificar si node_modules existe (dependencias ya instaladas)
if (-not (Test-Path ".\node_modules")) {
    Write-Host "[INFO] Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[OK] Dependencias ya estan instaladas" -ForegroundColor Green
    Write-Host ""
}

# Verificar si .env existe
if (-not (Test-Path ".\.env")) {
    Write-Host "[WARNING] Archivo .env no encontrado" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Archivo .env configurado" -ForegroundColor Green
}

# Mostrar configuracion
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              Configuracion del Servidor                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "[URL] http://localhost:3000" -ForegroundColor Green
Write-Host "[DB] ./data/productos.json" -ForegroundColor Green
Write-Host "[USER] jmbravoc" -ForegroundColor Green
Write-Host "[PASS] 07may2025" -ForegroundColor Green
Write-Host ""

# Iniciar el servidor
Write-Host "[INFO] Iniciando servidor..." -ForegroundColor Yellow
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

node server.js

# Si llegamos aqui, el servidor se ha detenido
Write-Host ""
Write-Host "[OK] Servidor detenido" -ForegroundColor Yellow
pop-location
