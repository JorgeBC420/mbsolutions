import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'productos.json');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes Base64
app.use(express.static('public')); // Servir archivos estáticos

// Crear carpeta data si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Crear carpeta public/images si no existe
const imagesDir = path.join(__dirname, '..', '..', 'public_html', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
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

function verificarToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
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
        const imagesPath = path.join(__dirname, '..', '..', 'public_html', 'images');
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
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (usuario === ADMIN_USER && contraseña === ADMIN_PASSWORD) {
        const token = generarToken(usuario);
        return res.json({ 
            success: true,
            token,
            message: 'Autenticación exitosa'
        });
    }

    res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos',
        success: false
    });
});

// ========================================
// RUTAS DE PRODUCTOS (PÚBLICO - LECTURA)
// ========================================

app.get('/api/productos', (req, res) => {
    try {
        const productos = leerProductos();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer productos' });
    }
});

app.get('/api/productos/:id', (req, res) => {
    try {
        const productos = leerProductos();
        const producto = productos.find(p => p.id === parseInt(req.params.id));
        
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer producto' });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (PROTEGIDAS - ADMIN)
// ========================================

app.post('/api/productos', verificarToken, (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;

        // Validación mejorada
        if (!code || !name || !category || price === undefined || stock === undefined || !description) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Leer productos actuales
        let productos = leerProductos();
        if (!Array.isArray(productos)) {
            productos = [];
        }

        // Guardar imagen y obtener nombre del archivo
        console.log('[DB] Guardando producto - Code:', code);
        const nombreImagen = guardarImagen(image);
        console.log('[DB] Imagen guardada como:', nombreImagen);

        // Crear nuevo producto
        const nuevoProducto = {
            id: Date.now(),
            code: String(code),
            name: String(name),
            category: String(category),
            price: parseInt(price) || 0,
            stock: parseInt(stock) || 0,
            description: String(description),
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
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto: ' + error.message });
    }
});

app.put('/api/productos/:id', verificarToken, (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;
        let productos = leerProductos();
        const index = productos.findIndex(p => p.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Actualizar solo los campos proporcionados
        if (code !== undefined) productos[index].code = String(code);
        if (name !== undefined) productos[index].name = String(name);
        if (category !== undefined) productos[index].category = String(category);
        if (price !== undefined) productos[index].price = parseInt(price) || 0;
        if (stock !== undefined) productos[index].stock = parseInt(stock) || 0;
        if (description !== undefined) productos[index].description = String(description);
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
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
    }
});

app.delete('/api/productos/:id', verificarToken, (req, res) => {
    try {
        let productos = leerProductos();
        const index = productos.findIndex(p => p.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const productoEliminado = productos[index];
        productos.splice(index, 1);
        guardarProductos(productos);

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente',
            product: productoEliminado
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
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
            return res.status(400).json({ error: 'Datos de pedido incompletos' });
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
        const pedidosPath = path.join(__dirname, 'data', 'pedidos.json');
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
    res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
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

app.listen(PORT, () => {
    console.log(`[OK] Servidor MB Solutions ejecutándose en puerto ${PORT}`);
    console.log(`[DB] Base de datos: ${DB_PATH}`);
    console.log(`[ENV] Modo: ${process.env.NODE_ENV || 'development'}`);
});
