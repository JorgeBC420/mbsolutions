import jwt from 'jsonwebtoken';

// Usar el mismo JWT_SECRET que server.js (debe venir de .env)
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_' + Date.now();

export function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Token no proporcionado',
            success: false
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded.usuario;
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Token inválido o expirado',
            success: false
        });
    }
}
