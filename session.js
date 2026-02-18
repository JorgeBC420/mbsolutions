// ========================================
// GESTIÓN DE SESIÓN - 2 horas de timeout
// ========================================

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

let sessionTimeout;

// Inicializar sesión cuando se hace login
function initSession() {
    console.log('[SESSION] Sesión iniciada');
    resetSessionTimeout();
}

// Resetear el timeout de inactividad
function resetSessionTimeout() {
    // Limpiar timeout anterior
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }
    
    // Ir al login si pasa 2 horas sin actividad
    sessionTimeout = setTimeout(() => {
        logoutSession('Sesión expirada por inactividad');
    }, SESSION_TIMEOUT);
}

// Logout por timeout
function logoutSession(reason) {
    console.log('[SESSION]', reason);
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuario');
    alert(reason + '. Por favor, inicie sesión nuevamente.');
    window.location.href = 'login.html';
}

// Cerrar sesión manualmente
function logout() {
    console.log('[SESSION] Cerrando sesión');
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Detectar actividad del usuario
document.addEventListener('mousemove', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('scroll', resetSessionTimeout);

// Si hay token al cargar la página, iniciar el timeout
window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        initSession();
    }
});
