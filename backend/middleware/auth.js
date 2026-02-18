import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Cargar variables de entorno (importante: debe ejecutarse antes de leer process.env)
dotenv.config();

// Usar el mismo JWT_SECRET que server.js (debe venir de .env)
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_' + Date.now();

// Logging para verificar que se carga correctamente
if (process.env.NODE_ENV !== 'production') {
    console.log('[AUTH] JWT_SECRET cargado:', JWT_SECRET ? 'Sí (longitud: ' + JWT_SECRET.length + ')' : 'No');
}

export function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    // Logging para debug (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH] Verificando token...');
        console.log('[AUTH] Authorization header:', authHeader ? 'Presente' : 'Ausente');
        console.log('[AUTH] JWT_SECRET configurado:', JWT_SECRET ? 'Sí' : 'No');
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AUTH] ❌ Token no proporcionado o formato incorrecto');
        return res.status(401).json({ 
            error: 'Token no proporcionado',
            success: false
        });
    }

    const token = authHeader.substring(7);
    
    // Verificar que el token no esté vacío
    if (!token || token === 'null' || token === 'undefined') {
        console.warn('[AUTH] ❌ Token vacío o inválido:', token);
        return res.status(401).json({ 
            error: 'Token inválido',
            success: false
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded.usuario;
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('[AUTH] ✅ Token válido para usuario:', decoded.usuario);
        }
        
        next();
    } catch (error) {
        console.error('[AUTH] ❌ Error al verificar token:', error.message);
        console.error('[AUTH] Tipo de error:', error.name);
        
        let errorMessage = 'Token inválido o expirado';
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token expirado. Por favor, inicia sesión nuevamente';
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Token inválido';
        }
        
        return res.status(401).json({ 
            error: errorMessage,
            success: false
        });
    }
}
