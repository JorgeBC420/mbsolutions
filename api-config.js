// ========================================
// CONFIGURACIÓN DE API - Usar en frontend
// ========================================

// Detecta automáticamente si estás en desarrollo o producción
// Desarrollo: http://localhost:3000  
// Producción: https://mbsolutionscr.com

const API_BASE = (() => {
    const host = window.location.hostname;
    
    // Si estás en localhost, usa localhost:3000
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Si estás en GitHub Pages (para testing)
    if (host === 'jorgebc420.github.io') {
        return 'http://localhost:3000'; // Cambiar cuando se suba a producción
    }
    
    // En producción (mbsolutionscr.com)
    // Usa el mismo dominio con /api (ej: https://mbsolutionscr.com)
    return `https://${host}`;
})();

console.log(`[API Config] Usando endpoint: ${API_BASE}`);
