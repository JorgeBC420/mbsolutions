// ========================================
// CONFIGURACIÓN DE API - Usar en frontend
// ========================================

// Detecta automáticamente si estás en desarrollo o producción
// Desarrollo: http://localhost:3000  
// Producción: rutas relativas /api (funciona con Passenger en BanaHosting)

const API_BASE = (() => {
    const host = window.location.hostname;
    
    // Si estás en localhost, usa localhost:3000
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Si estás en GitHub Pages (para testing)
    if (host === 'jorgebc420.github.io') {
        return 'http://localhost:3000';
    }
    
    // En producción (mbsolutionscr.com o cualquier dominio)
    // Usa rutas relativas - funciona con Passenger/reverse proxy en BanaHosting
    // Las llamadas irán a /api/, que Passenger redirige al puerto del Node.js app
    return '';
})();

console.log(`[API Config] Host: ${window.location.hostname}`);
