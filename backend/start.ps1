# MB Solutions - Backend Setup Script para Windows
# Este script instala dependencias e inicia el servidor

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      MB Solutions - Backend Setup & Launch Script         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
$nodeInstalled = $false
try {
    $nodeVersion = node --version
    $nodeInstalled = $true
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js primero." -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Navegar a la carpeta backend
$backendPath = ".\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Carpeta 'backend' no encontrada" -ForegroundColor Red
    exit 1
}

push-location $backendPath
Write-Host "📁 Entrando en carpeta backend..." -ForegroundColor Yellow
Write-Host ""

# Verificar si package-lock.json existe (dependencias ya instaladas)
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ Dependencias ya están instaladas" -ForegroundColor Green
    Write-Host ""
}

# Verificar si .env existe
if (-not (Test-Path ".\.env")) {
    Write-Host "⚠️  Archivo .env no encontrado, creará uno por defecto" -ForegroundColor Yellow
} else {
    Write-Host "✅ Archivo .env configurado" -ForegroundColor Green
}

# Mostrar configuración
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              Configuración del Servidor                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:3000" -ForegroundColor Green
Write-Host "📦 Base de datos: ./data/productos.json" -ForegroundColor Green
Write-Host "👤 Usuario Admin: jmbravoc" -ForegroundColor Green
Write-Host "🔑 Contraseña: 07may2025" -ForegroundColor Green
Write-Host ""

# Iniciar el servidor
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Yellow
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

node server.js

# Si llegamos aquí, el servidor se ha detenido
Write-Host ""
Write-Host "✋ Servidor detenido" -ForegroundColor Yellow
pop-location
