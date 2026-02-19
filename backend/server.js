import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { verificarToken } from './middleware/auth.js';

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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes Base64
// Servir archivos estáticos (ruta absoluta para producción)
const publicPath = path.join(__dirname__, 'public');
const adminPath = path.join(__dirname__, 'admin'); // Estructura: backend/admin/
const adminAdminPath = path.join(__dirname__, 'admin', 'admin'); // Estructura anidada: backend/admin/admin/

console.log('[INIT] Buscando carpetas...');
console.log('[INIT] public/ en:', publicPath);
console.log('[INIT] admin/ en:', adminPath);
console.log('[INIT] admin/admin/ en:', adminAdminPath);
console.log('[INIT] __dirname__:', __dirname__);

// Servir carpeta public/ si existe (para imágenes y otros estáticos)
if (fs.existsSync(publicPath)) {
    console.log('[INIT] ✅ Carpeta public/ encontrada:', publicPath);
    app.use(express.static(publicPath));
    
    // Listar contenido para debug
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

// Servir carpeta admin/ directamente (estructura preferida)
if (fs.existsSync(adminPath)) {
    console.log('[INIT] ✅ Carpeta admin/ encontrada:', adminPath);
    app.use('/admin', express.static(adminPath));
    
    // Listar contenido para debug
    try {
        const adminContents = fs.readdirSync(adminPath);
        console.log('[INIT] Contenido de admin/:', adminContents.join(', '));
    } catch (error) {
        console.warn('[INIT] Error al leer contenido de admin/:', error.message);
    }
} else if (fs.existsSync(adminAdminPath)) {
    // Fallback: servir carpeta admin/admin/ si existe (estructura anidada)
    console.log('[INIT] ✅ Carpeta admin/admin/ encontrada (fallback):', adminAdminPath);
    app.use('/admin', express.static(adminAdminPath));
} else {
    console.warn('[INIT] ⚠️ Carpeta admin/ no encontrada');
}

// Crear carpeta data si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Carpeta de imágenes: SIEMPRE backend/public/images para que express.static('public') las sirva en /images/
const imagesDir = path.join(__dirname__, 'public', 'images');

if (!fs.existsSync(imagesDir)) {
    try {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log('[OK] Carpeta de imágenes creada:', imagesDir);
    } catch (error) {
        console.warn('[WARN] No se pudo crear carpeta de imágenes:', imagesDir, error.message);
    }
}

// Inicializar archivo de productos vacío si no existe
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

function guardarImagen(base64Str) {
    try {
        // Si no hay imagen, retornar placeholder
        if (!base64Str || base64Str === 'images/placeholder.jpg' || base64Str === '') {
            return 'images/placeholder.jpg';
        }

        console.log('[IMG] Iniciando guardado de imagen...');
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const filename = `producto_${timestamp}.png`;
        // Siempre guardar en public/images para que express.static('public') sirva en /images/
        const imagesPath = path.join(__dirname__, 'public', 'images');
        const filepath = path.join(imagesPath, filename);
        
        console.log('[IMG] Path de guardado:', filepath);
        console.log('[IMG] Directorio existe:', fs.existsSync(imagesPath));
        
        // Validar que la carpeta exista
        if (!fs.existsSync(imagesPath)) {
            console.log('[IMG] Creando directorio de imágenes...');
            fs.mkdirSync(imagesPath, { recursive: true });
        }
        
        // Decodificar Base64 (manejo de data URI format)
        let base64Data = base64Str.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, '');
        
        // Validar que tengan datos Base64
        if (!base64Data || base64Data.length < 10) {
            console.warn('[IMG] Base64 inválido o muy corto, usando placeholder');
            return 'images/placeholder.jpg';
        }
        
        // Intentar decodificar para validar
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length < 10) {
            console.warn('[IMG] Buffer decodificado muy pequeño, usando placeholder');
            return 'images/placeholder.jpg';
        }
        
        console.log('[IMG] Buffer size:', buffer.length, 'bytes');
        
        // Guardar archivo
        fs.writeFileSync(filepath, buffer);
        
        console.log('[IMG] Imagen guardada exitosamente:', filename);
        return `images/${filename}`;
    } catch (error) {
        console.error('[IMG] Error crítico al guardar imagen:', error.message);
        console.error('[IMG] Stack:', error.stack);
        return 'images/placeholder.jpg';
    }
}

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;

        // Logging para debug (solo en desarrollo o si hay error)
        if (process.env.NODE_ENV !== 'production') {
            console.log('[LOGIN] Intento de login recibido');
            console.log('[LOGIN] Usuario recibido:', usuario);
            console.log('[LOGIN] Usuario esperado:', ADMIN_USER);
            console.log('[LOGIN] Contraseña recibida (longitud):', contraseña ? contraseña.length : 0);
            console.log('[LOGIN] Contraseña esperada (longitud):', ADMIN_PASSWORD ? ADMIN_PASSWORD.length : 0);
        }

        if (!usuario || !contraseña) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        // Comparación con trim para evitar espacios en blanco
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

        // Logging del error (sin mostrar credenciales completas)
        console.warn('[LOGIN] ❌ Credenciales incorrectas. Usuario recibido:', usuarioTrimmed);
        console.warn('[LOGIN] Comparación usuario:', usuarioTrimmed === adminUserTrimmed);
        console.warn('[LOGIN] Comparación contraseña:', contraseñaTrimmed === adminPasswordTrimmed);
        
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

        // Filtrar productos con datos válidos (opcional, para robustez)
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
// Permite que las imágenes funcionen aunque el frontend esté en otra ruta o dominio
app.get('/api/images/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Validación de seguridad: prevenir path traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }

        // Validar extensión de archivo
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const ext = path.extname(filename).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({ error: 'Tipo de archivo no permitido' });
        }

        const imagePath = path.join(__dirname__, 'public', 'images', filename);
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        // Establecer headers apropiados para imágenes
        res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 
                                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                                     ext === '.gif' ? 'image/gif' : 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
        
        res.sendFile(imagePath);
    } catch (error) {
        console.error('[ERROR] Error al servir imagen:', error);
        res.status(500).json({ error: 'Error al cargar imagen' });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (PROTEGIDAS - ADMIN)
// ========================================

app.post('/api/productos', verificarToken, (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;

        // Validación de campos requeridos
        if (!code || !name || !category || price === undefined || stock === undefined || !description) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                required: ['code', 'name', 'category', 'price', 'stock', 'description']
            });
        }

// Validación de tipos y valores
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

        // Validación de longitud de campos
        if (String(code).trim().length === 0 || String(code).length > 50) {
            return res.status(400).json({ error: 'El código debe tener entre 1 y 50 caracteres' });
        }

        if (String(name).trim().length === 0 || String(name).length > 200) {
            return res.status(400).json({ error: 'El nombre debe tener entre 1 y 200 caracteres' });
        }

        if (String(description).trim().length === 0 || String(description).length > 2000) {
            return res.status(400).json({ error: 'La descripción debe tener entre 1 y 2000 caracteres' });
        }

        // Verificar que no exista un producto con el mismo código
        let productos = leerProductos();
        if (!Array.isArray(productos)) {
            productos = [];
        }

        const codigoExistente = productos.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        if (codigoExistente) {
            return res.status(409).json({ 
                error: 'Ya existe un producto con este código',
                existingProduct: { id: codigoExistente.id, name: codigoExistente.name }
            });
        }

        // Guardar imagen y obtener nombre del archivo
        console.log('[DB] Guardando producto - Code:', code);
        const nombreImagen = guardarImagen(image);
        console.log('[DB] Imagen guardada como:', nombreImagen);

        // Crear nuevo producto
        const nuevoProducto = {
            id: Date.now(),
            code: String(code).trim(),
            name: String(name).trim(),
            category: String(category).toLowerCase(),
            price: Math.round(priceNum * 100) / 100, // Redondear a 2 decimales
            stock: Math.floor(stockNum),
            description: String(description).trim(),
            image: nombreImagen,
            createdAt: new Date().toISOString()
        };

        // Guardar
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

app.put('/api/productos/:id', verificarToken, (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'ID de producto inválido' });
        }

        let productos = leerProductos();
        if (!Array.isArray(productos)) {
            productos = [];
        }

        const index = productos.findIndex(p => p.id === productId);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

// Validaciones para campos actualizados
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
            // Verificar que no exista otro producto con el mismo código
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
            const nombreImagen = guardarImagen(image);
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
        if (!Array.isArray(productos)) {
            productos = [];
        }

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
// RUTA PARA ENVIAR PEDIDOS - NO PROTEGIDA
// ========================================

app.post('/api/enviar-pedido', async (req, res) => {
    try {
        const { cliente, productos, total, fecha } = req.body;

        // Validación básica
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

        // Validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cliente.email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        // Validación de total
        const totalNum = Number(total);
        if (isNaN(totalNum) || totalNum < 0) {
            return res.status(400).json({ error: 'Total inválido' });
        }

        // Validación de productos
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

        // Guardar pedido en archivo
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

        // Intentar enviar email (opcional, requiere configuración SMTP)
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
                            <tbody>
                                ${productosHTML}
                            </tbody>
                        </table>
                        
                        <h3>Total del Pedido: ₡${total.toLocaleString()}</h3>
                        
                        ${cliente.notas ? `<h3>Notas Especiales</h3><p>${cliente.notas}</p>` : ''}
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log('[EMAIL] Correo enviado a ventas@mbsolutionscr.com');
            } catch (emailError) {
                console.error('[EMAIL] Error al enviar email:', emailError.message);
                // No fallar la respuesta aunque el email falle
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
    // Intentar múltiples estructuras posibles (orden de prioridad)
    const possiblePaths = [
        path.join(__dirname__, 'admin', 'login.html'), // Estructura directa: backend/admin/ (PREFERIDA)
        path.join(__dirname__, 'admin', 'admin', 'login.html'), // Estructura anidada: backend/admin/admin/
        path.join(__dirname__, 'public', 'admin', 'login.html'), // Estructura antigua: backend/public/admin/
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
    // Intentar múltiples estructuras posibles (orden de prioridad)
    const possiblePaths = [
        path.join(__dirname__, 'admin', 'admin.html'), // Estructura directa: backend/admin/ (PREFERIDA)
        path.join(__dirname__, 'admin', 'admin', 'admin.html'), // Estructura anidada: backend/admin/admin/
        path.join(__dirname__, 'public', 'admin', 'admin.html'), // Estructura antigua: backend/public/admin/
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
// INICIAR SERVIDOR
// ========================================

// Manejo de errores al iniciar el servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Servidor MB Solutions ejecutándose en puerto ${PORT}`);
    console.log(`[DB] Base de datos: ${DB_PATH}`);
    console.log(`[ENV] Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[HOST] Escuchando en 0.0.0.0:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[ERROR] Puerto ${PORT} ya está en uso. Cambia el puerto en .env`);
    } else {
        console.error('[ERROR] Error al iniciar el servidor:', error);
    }
    process.exit(1);
});

// Exportar app para Passenger (si es necesario)
export default app;
