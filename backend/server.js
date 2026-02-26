import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import sharp from 'sharp';
import { verificarToken } from './middleware/auth.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename__ = fileURLToPath(import.meta.url);
const __dirname__ = path.dirname(__filename__);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname__, 'data', 'productos.json');
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_' + Date.now();
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// Advertir si se están usando valores por defecto (solo en producción)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.JWT_SECRET || !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD)) {
    console.warn('[⚠️ ADVERTENCIA] Variables de entorno usando valores por defecto. Configura .env en producción:');
    console.warn('  - JWT_SECRET');
    console.warn('  - ADMIN_USER');
    console.warn('  - ADMIN_PASSWORD');
}

// ========================================
// RATE LIMITERS
// ========================================

// Login: máximo 10 intentos fallidos por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
        success: false
    },
    handler: (req, res, next, options) => {
        const minutosRestantes = Math.ceil(
            (req.rateLimit.resetTime - Date.now()) / 60000
        );
        console.warn(`[RATE LIMIT] IP bloqueada: ${req.ip} — ${req.rateLimit.current} intentos`);
        res.status(429).json({
            error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}.`,
            success: false,
            retryAfter: minutosRestantes
        });
    },
});

// General API: máximo 200 peticiones por minuto por IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Demasiadas peticiones. Intenta de nuevo en un momento.',
        success: false
    }
});

// ========================================
// MIDDLEWARES
// ========================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rutas de archivos estáticos
const publicPath = path.join(__dirname__, 'public');
const adminPath = path.join(__dirname__, 'admin');
const adminAdminPath = path.join(__dirname__, 'admin', 'admin');

console.log('[INIT] Buscando carpetas...');
console.log('[INIT] public/ en:', publicPath);
console.log('[INIT] admin/ en:', adminPath);
console.log('[INIT] admin/admin/ en:', adminAdminPath);
console.log('[INIT] __dirname__:', __dirname__);

if (fs.existsSync(publicPath)) {
    console.log('[INIT] ✅ Carpeta public/ encontrada:', publicPath);
    app.use(express.static(publicPath));
    try {
        const publicContents = fs.readdirSync(publicPath, { withFileTypes: true });
        console.log('[INIT] Contenido de public/:', publicContents.map(item =>
            `${item.isDirectory() ? '[DIR]' : '[FILE]'} ${item.name}`
        ).join(', '));
    } catch (error) {
        console.warn('[INIT] Error al leer contenido de public/:', error.message);
    }
} else {
    console.warn('[INIT] ⚠️ Carpeta public/ no encontrada:', publicPath);
}

if (fs.existsSync(adminPath)) {
    console.log('[INIT] ✅ Carpeta admin/ encontrada:', adminPath);
    app.use('/admin', express.static(adminPath));
    try {
        const adminContents = fs.readdirSync(adminPath);
        console.log('[INIT] Contenido de admin/:', adminContents.join(', '));
    } catch (error) {
        console.warn('[INIT] Error al leer contenido de admin/:', error.message);
    }
} else if (fs.existsSync(adminAdminPath)) {
    console.log('[INIT] ✅ Carpeta admin/admin/ encontrada (fallback):', adminAdminPath);
    app.use('/admin', express.static(adminAdminPath));
} else {
    console.warn('[INIT] ⚠️ Carpeta admin/ no encontrada');
}

// Rate limiter general para todas las rutas /api/
app.use('/api/', apiLimiter);

// ========================================
// INICIALIZACIÓN DE CARPETAS Y ARCHIVOS
// ========================================

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const imagesDir = path.join(__dirname__, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    try {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log('[OK] Carpeta de imágenes creada:', imagesDir);
    } catch (error) {
        console.warn('[WARN] No se pudo crear carpeta de imágenes:', imagesDir, error.message);
    }
}

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function leerProductos() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function guardarProductos(productos) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(productos, null, 2));
    } catch (error) {
        console.error('Error al guardar productos:', error);
        throw new Error('No se pudieron guardar los productos: ' + error.message);
    }
}

function generarToken(usuario) {
    return jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '24h' });
}

async function guardarImagen(base64Str) {
    try {
        if (!base64Str || base64Str === 'images/placeholder.jpg' || base64Str === '') {
            return 'images/placeholder.jpg';
        }

        console.log('[IMG] Iniciando guardado de imagen...');

        const timestamp = Date.now();
        const filename = `producto_${timestamp}.webp`;
        const imagesPath = path.join(__dirname__, 'public', 'images');
        const filepath = path.join(imagesPath, filename);

        console.log('[IMG] Path de guardado:', filepath);
        console.log('[IMG] Directorio existe:', fs.existsSync(imagesPath));

        if (!fs.existsSync(imagesPath)) {
            console.log('[IMG] Creando directorio de imágenes...');
            fs.mkdirSync(imagesPath, { recursive: true });
        }

        let base64Data = base64Str.replace(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, '');

        if (!base64Data || base64Data.length < 10) {
            console.warn('[IMG] Base64 inválido o muy corto, usando placeholder');
            return 'images/placeholder.jpg';
        }

        const inputBuffer = Buffer.from(base64Data, 'base64');
        if (inputBuffer.length < 10) {
            console.warn('[IMG] Buffer decodificado muy pequeño, usando placeholder');
            return 'images/placeholder.jpg';
        }

        console.log('[IMG] Buffer size original:', inputBuffer.length, 'bytes');

        const webpBuffer = await sharp(inputBuffer)
            .resize(1920, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({
                quality: 85,
                effort: 4
            })
            .toBuffer();

        console.log('[IMG] Buffer size WebP:', webpBuffer.length, 'bytes');
        console.log('[IMG] Reducción:', Math.round((1 - webpBuffer.length / inputBuffer.length) * 100) + '%');

        fs.writeFileSync(filepath, webpBuffer);
        console.log('[IMG] Imagen guardada exitosamente como WebP:', filename);
        return `images/${filename}`;

    } catch (error) {
        console.error('[IMG] Error crítico al guardar imagen:', error.message);
        console.error('[IMG] Stack:', error.stack);
        try {
            const timestamp = Date.now();
            const fallbackFilename = `producto_${timestamp}_fallback.png`;
            const imagesPath = path.join(__dirname__, 'public', 'images');
            const filepath = path.join(imagesPath, fallbackFilename);
            let base64Data = base64Str.replace(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filepath, buffer);
            console.log('[IMG] Guardado como fallback PNG:', fallbackFilename);
            return `images/${fallbackFilename}`;
        } catch (fallbackError) {
            console.error('[IMG] Fallback también falló:', fallbackError.message);
            return 'images/placeholder.jpg';
        }
    }
}

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;

        if (process.env.NODE_ENV !== 'production') {
            console.log('[LOGIN] Intento de login recibido');
            console.log('[LOGIN] Usuario recibido:', usuario);
            console.log('[LOGIN] Intento #:', req.rateLimit?.current);
        }

        if (!usuario || !contraseña) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const usuarioTrimmed = String(usuario).trim();
        const contraseñaTrimmed = String(contraseña).trim();
        const adminUserTrimmed = String(ADMIN_USER).trim();
        const adminPasswordTrimmed = String(ADMIN_PASSWORD).trim();

        if (usuarioTrimmed === adminUserTrimmed && contraseñaTrimmed === adminPasswordTrimmed) {
            const token = generarToken(usuarioTrimmed);
            console.log('[LOGIN] ✅ Autenticación exitosa para usuario:', usuarioTrimmed);
            return res.json({
                success: true,
                token,
                message: 'Autenticación exitosa'
            });
        }

        console.warn('[LOGIN] ❌ Credenciales incorrectas. IP:', req.ip, '| Usuario:', usuarioTrimmed);
        res.status(401).json({
            error: 'Usuario o contraseña incorrectos',
            success: false
        });
    } catch (error) {
        console.error('[LOGIN] Error en proceso de login:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            success: false
        });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (PÚBLICO - LECTURA)
// ========================================

app.get('/api/productos', (req, res) => {
    try {
        const productos = leerProductos();

        if (!Array.isArray(productos)) {
            console.warn('[WARN] Productos no es un array, retornando array vacío');
            return res.json([]);
        }

        const productosValidos = productos.filter(p =>
            p && p.id && p.name && p.price !== undefined
        );

        res.json(productosValidos);
    } catch (error) {
        console.error('[ERROR] Error al leer productos:', error);
        res.status(500).json({ error: 'Error al leer productos' });
    }
});

app.get('/api/productos/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        const productos = leerProductos();
        if (!Array.isArray(productos)) {
            return res.status(500).json({ error: 'Error al leer productos' });
        }

        const producto = productos.find(p => p.id === productId);

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(producto);
    } catch (error) {
        console.error('[ERROR] Error al leer producto:', error);
        res.status(500).json({ error: 'Error al leer producto' });
    }
});

// ========================================
// RUTA PARA SERVIR IMÁGENES DE PRODUCTOS
// ========================================

app.get('/api/images/:filename', (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }

        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const ext = path.extname(filename).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({ error: 'Tipo de archivo no permitido' });
        }

        const imagePath = path.join(__dirname__, 'public', 'images', filename);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        res.setHeader('Content-Type', ext === '.png' ? 'image/png' :
                                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                                     ext === '.gif' ? 'image/gif' : 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        res.sendFile(imagePath);
    } catch (error) {
        console.error('[ERROR] Error al servir imagen:', error);
        res.status(500).json({ error: 'Error al cargar imagen' });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (PROTEGIDAS - ADMIN)
// ========================================

app.post('/api/productos', verificarToken, async (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;

        if (!code || !name || !category || price === undefined || stock === undefined || !description) {
            return res.status(400).json({
                error: 'Faltan campos requeridos',
                required: ['code', 'name', 'category', 'price', 'stock', 'description']
            });
        }

        const categoriasValidas = ['laptops', 'desktops', 'accesorios', 'componentes', 'consumibles'];
        if (!categoriasValidas.includes(String(category).toLowerCase())) {
            return res.status(400).json({
                error: 'Categoría inválida',
                validCategories: categoriasValidas
            });
        }

        const priceNum = Number(price);
        const stockNum = Number(stock);

        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({ error: 'El precio debe ser un número positivo' });
        }

        if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
            return res.status(400).json({ error: 'El stock debe ser un número entero positivo' });
        }

        if (String(code).trim().length === 0 || String(code).length > 50) {
            return res.status(400).json({ error: 'El código debe tener entre 1 y 50 caracteres' });
        }

        if (String(name).trim().length === 0 || String(name).length > 200) {
            return res.status(400).json({ error: 'El nombre debe tener entre 1 y 200 caracteres' });
        }

        if (String(description).trim().length === 0 || String(description).length > 2000) {
            return res.status(400).json({ error: 'La descripción debe tener entre 1 y 2000 caracteres' });
        }

        let productos = leerProductos();
        if (!Array.isArray(productos)) productos = [];

        const codigoExistente = productos.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        if (codigoExistente) {
            return res.status(409).json({
                error: 'Ya existe un producto con este código',
                existingProduct: { id: codigoExistente.id, name: codigoExistente.name }
            });
        }

        console.log('[DB] Guardando producto - Code:', code);
        const nombreImagen = await guardarImagen(image);
        console.log('[DB] Imagen guardada como:', nombreImagen);

        const nuevoProducto = {
            id: Date.now(),
            code: String(code).trim(),
            name: String(name).trim(),
            category: String(category).toLowerCase(),
            price: Math.round(priceNum * 100) / 100,
            stock: Math.floor(stockNum),
            description: String(description).trim(),
            image: nombreImagen,
            createdAt: new Date().toISOString()
        };

        productos.push(nuevoProducto);
        guardarProductos(productos);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            product: nuevoProducto
        });
    } catch (error) {
        console.error('[ERROR] Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto: ' + error.message });
    }
});

app.put('/api/productos/:id', verificarToken, async (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        let productos = leerProductos();
        if (!Array.isArray(productos)) productos = [];

        const index = productos.findIndex(p => p.id === productId);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (category !== undefined) {
            const categoriasValidas = ['laptops', 'desktops', 'accesorios', 'componentes', 'consumibles'];
            if (!categoriasValidas.includes(String(category).toLowerCase())) {
                return res.status(400).json({
                    error: 'Categoría inválida',
                    validCategories: categoriasValidas
                });
            }
            productos[index].category = String(category).toLowerCase();
        }

        if (code !== undefined) {
            const codeStr = String(code).trim();
            if (codeStr.length === 0 || codeStr.length > 50) {
                return res.status(400).json({ error: 'El código debe tener entre 1 y 50 caracteres' });
            }
            const codigoExistente = productos.find((p, i) => i !== index && String(p.code).toLowerCase() === codeStr.toLowerCase());
            if (codigoExistente) {
                return res.status(409).json({
                    error: 'Ya existe otro producto con este código',
                    existingProduct: { id: codigoExistente.id, name: codigoExistente.name }
                });
            }
            productos[index].code = codeStr;
        }

        if (name !== undefined) {
            const nameStr = String(name).trim();
            if (nameStr.length === 0 || nameStr.length > 200) {
                return res.status(400).json({ error: 'El nombre debe tener entre 1 y 200 caracteres' });
            }
            productos[index].name = nameStr;
        }

        if (price !== undefined) {
            const priceNum = Number(price);
            if (isNaN(priceNum) || priceNum < 0) {
                return res.status(400).json({ error: 'El precio debe ser un número positivo' });
            }
            productos[index].price = Math.round(priceNum * 100) / 100;
        }

        if (stock !== undefined) {
            const stockNum = Number(stock);
            if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
                return res.status(400).json({ error: 'El stock debe ser un número entero positivo' });
            }
            productos[index].stock = Math.floor(stockNum);
        }

        if (description !== undefined) {
            const descStr = String(description).trim();
            if (descStr.length === 0 || descStr.length > 2000) {
                return res.status(400).json({ error: 'La descripción debe tener entre 1 y 2000 caracteres' });
            }
            productos[index].description = descStr;
        }

        if (image !== undefined) {
            const nombreImagen = await guardarImagen(image);
            productos[index].image = nombreImagen;
        }

        productos[index].updatedAt = new Date().toISOString();
        guardarProductos(productos);

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            product: productos[index]
        });
    } catch (error) {
        console.error('[ERROR] Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
    }
});

app.delete('/api/productos/:id', verificarToken, (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        let productos = leerProductos();
        if (!Array.isArray(productos)) productos = [];

        const index = productos.findIndex(p => p.id === productId);

        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const productoEliminado = productos[index];
        productos.splice(index, 1);
        guardarProductos(productos);

        console.log('[DB] Producto eliminado:', productoEliminado.id, productoEliminado.name);

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente',
            product: productoEliminado
        });
    } catch (error) {
        console.error('[ERROR] Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto: ' + error.message });
    }
});

// ========================================
// RUTA PARA ENVIAR PEDIDOS
// ========================================

app.post('/api/enviar-pedido', async (req, res) => {
    try {
        const { cliente, productos, total, fecha } = req.body;

        if (!cliente || !cliente.email || !cliente.nombre || !productos || productos.length === 0) {
            return res.status(400).json({
                error: 'Datos de pedido incompletos',
                required: {
                    cliente: ['nombre', 'email'],
                    productos: 'array no vacío',
                    total: 'number',
                    fecha: 'string'
                }
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cliente.email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        const totalNum = Number(total);
        if (isNaN(totalNum) || totalNum < 0) {
            return res.status(400).json({ error: 'Total inválido' });
        }

        if (!Array.isArray(productos)) {
            return res.status(400).json({ error: 'Los productos deben ser un array' });
        }

        for (const producto of productos) {
            if (!producto.id || !producto.name || producto.price === undefined || producto.quantity === undefined) {
                return res.status(400).json({
                    error: 'Cada producto debe tener: id, name, price, quantity'
                });
            }
            if (Number(producto.quantity) <= 0) {
                return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
            }
        }

        const pedido = {
            id: Date.now(),
            cliente,
            productos,
            total,
            fecha,
            estado: 'pendiente'
        };

        const pedidosPath = path.join(__dirname__, 'data', 'pedidos.json');
        let pedidos = [];

        if (fs.existsSync(pedidosPath)) {
            try {
                const data = fs.readFileSync(pedidosPath, 'utf-8');
                pedidos = JSON.parse(data);
            } catch (e) {
                pedidos = [];
            }
        }

        pedidos.push(pedido);
        fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
        console.log('[PEDIDO] Nuevo pedido recibido:', pedido.id);

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const productosHTML = productos.map(p =>
                    `<tr>
                        <td>${p.name}</td>
                        <td>₡${p.price.toLocaleString()}</td>
                        <td>${p.quantity}</td>
                        <td>₡${(p.price * p.quantity).toLocaleString()}</td>
                    </tr>`
                ).join('');

                const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: 'ventas@mbsolutionscr.com',
                    subject: `Nuevo Pedido #${pedido.id} - ${cliente.nombre}`,
                    html: `
                        <h2>Nuevo Pedido Recibido</h2>
                        <p><strong>ID Pedido:</strong> ${pedido.id}</p>
                        <p><strong>Fecha:</strong> ${new Date(fecha).toLocaleString('es-CR')}</p>
                        <h3>Información del Cliente</h3>
                        <ul>
                            <li><strong>Nombre:</strong> ${cliente.nombre}</li>
                            <li><strong>Email:</strong> ${cliente.email}</li>
                            <li><strong>Teléfono:</strong> ${cliente.telefono || 'No proporcionado'}</li>
                            <li><strong>Dirección:</strong> ${cliente.direccion}</li>
                        </ul>
                        <h3>Productos</h3>
                        <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Cantidad</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>${productosHTML}</tbody>
                        </table>
                        <h3>Total del Pedido: ₡${total.toLocaleString()}</h3>
                        ${cliente.notas ? `<h3>Notas Especiales</h3><p>${cliente.notas}</p>` : ''}
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log('[EMAIL] Correo enviado a ventas@mbsolutionscr.com');
            } catch (emailError) {
                console.error('[EMAIL] Error al enviar email:', emailError.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Pedido recibido correctamente',
            pedidoId: pedido.id
        });

    } catch (error) {
        console.error('[PEDIDO] Error al procesar pedido:', error);
        res.status(500).json({ error: 'Error al procesar pedido: ' + error.message });
    }
});

// ========================================
// RUTAS DE PÁGINAS ADMIN
// ========================================

app.get('/login', (req, res) => {
    const possiblePaths = [
        path.join(__dirname__, 'admin', 'login.html'),
        path.join(__dirname__, 'admin', 'admin', 'login.html'),
        path.join(__dirname__, 'public', 'admin', 'login.html'),
    ];

    console.log('[ROUTE] /login - Buscando archivo...');

    for (const loginPath of possiblePaths) {
        if (fs.existsSync(loginPath)) {
            console.log('[ROUTE] ✅ Encontrado en:', loginPath);
            return res.sendFile(loginPath);
        }
    }

    console.error('[ROUTE] ❌ Archivo no encontrado en ninguna ruta');
    res.status(404).json({
        error: 'Página de login no encontrada',
        searchedPaths: possiblePaths,
        __dirname: __dirname__
    });
});

app.get('/admin', (req, res) => {
    const possiblePaths = [
        path.join(__dirname__, 'admin', 'admin.html'),
        path.join(__dirname__, 'admin', 'admin', 'admin.html'),
        path.join(__dirname__, 'public', 'admin', 'admin.html'),
    ];

    console.log('[ROUTE] /admin - Buscando archivo...');

    for (const adminPath of possiblePaths) {
        if (fs.existsSync(adminPath)) {
            console.log('[ROUTE] ✅ Encontrado en:', adminPath);
            return res.sendFile(adminPath);
        }
    }

    console.error('[ROUTE] ❌ Archivo no encontrado en ninguna ruta');
    res.status(404).json({
        error: 'Panel de administración no encontrado',
        searchedPaths: possiblePaths,
        __dirname: __dirname__
    });
});

// ========================================
// RUTA DE PRUEBA
// ========================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor MB Solutions funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// VERIFICACIÓN GOOGLE SEARCH CONSOLE
// ========================================

// Sirve cualquier archivo de verificación de Google (google*.html) desde la carpeta raíz del proyecto
app.get('/google:code.html', (req, res) => {
    const filename = `google${req.params.code}.html`;
    const possiblePaths = [
        path.join(__dirname__, '..', filename),        // carpeta raíz del proyecto
        path.join(__dirname__, 'public', filename),     // carpeta public
        path.join(__dirname__, filename),               // carpeta backend
    ];

    console.log(`[GOOGLE] Buscando archivo de verificación: ${filename}`);

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`[GOOGLE] ✅ Encontrado en: ${filePath}`);
            return res.sendFile(filePath);
        }
    }

    console.warn(`[GOOGLE] ⚠️ Archivo no encontrado: ${filename}`);
    res.status(404).send(`Archivo ${filename} no encontrado`);
});

// ========================================
// RUTAS SEO
// ========================================

app.get('/producto/:id', (req, res) => {
    const possiblePaths = [
        path.join(__dirname__, '..', 'producto.html'),
        path.join(__dirname__, 'public', 'producto.html'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return res.sendFile(p);
    }

    res.redirect('/#tienda');
});

app.get('/producto/:id/:slug', (req, res) => {
    const possiblePaths = [
        path.join(__dirname__, '..', 'producto.html'),
        path.join(__dirname__, 'public', 'producto.html'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return res.sendFile(p);
    }

    res.redirect('/#tienda');
});

app.get('/sitemap.xml', (req, res) => {
    try {
        const productos = leerProductos();
        const baseUrl = process.env.SITE_URL || 'https://mbsolutionscr.com';

        const urls = productos.map(p => {
            const slug = p.name
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            return `
  <url>
    <loc>${baseUrl}/producto/${p.id}/${slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }).join('');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('[SITEMAP] Error:', error);
        res.status(500).send('Error generando sitemap');
    }
});

app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.SITE_URL || 'https://mbsolutionscr.com';
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`);
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Servidor MB Solutions ejecutándose en puerto ${PORT}`);
    console.log(`[DB] Base de datos: ${DB_PATH}`);
    console.log(`[ENV] Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[HOST] Escuchando en 0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[ERROR] Puerto ${PORT} ya está en uso. Cambia el puerto en .env`);
    } else {
        console.error('[ERROR] Error al iniciar el servidor:', error);
    }
    process.exit(1);
});

export default app;
