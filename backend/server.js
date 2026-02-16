import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos

// Crear carpeta data si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Crear carpeta public/images si no existe
const imagesDir = path.join(__dirname, 'public', 'images');
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
        if (!base64Str || base64Str === 'images/placeholder.jpg') {
            return 'images/placeholder.jpg';
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const filename = `producto_${timestamp}.png`;
        
        // Decodificar Base64 (manejo de data URI format)
        const base64Data = base64Str.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, '');
        const filepath = path.join(__dirname, 'public', 'images', filename);
        
        // Guardar archivo
        fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
        
        return `images/${filename}`;
    } catch (error) {
        console.error('Error al guardar imagen:', error);
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
        const nombreImagen = guardarImagen(image);

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
