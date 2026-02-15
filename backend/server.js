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

// Crear carpeta data si no existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
    fs.writeFileSync(DB_PATH, JSON.stringify(productos, null, 2));
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

        if (!code || !name || !category || !price || !stock === undefined || !description) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const productos = leerProductos();
        const nuevoProducto = {
            id: Date.now(),
            code,
            name,
            category,
            price: parseInt(price),
            stock: parseInt(stock),
            description,
            image: image || 'images/placeholder.jpg',
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
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

app.put('/api/productos/:id', verificarToken, (req, res) => {
    try {
        const { code, name, category, price, stock, description, image } = req.body;
        const productos = leerProductos();
        const index = productos.findIndex(p => p.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        productos[index] = {
            ...productos[index],
            code: code || productos[index].code,
            name: name || productos[index].name,
            category: category || productos[index].category,
            price: price !== undefined ? parseInt(price) : productos[index].price,
            stock: stock !== undefined ? parseInt(stock) : productos[index].stock,
            description: description || productos[index].description,
            image: image || productos[index].image,
            updatedAt: new Date().toISOString()
        };

        guardarProductos(productos);

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            product: productos[index]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

app.delete('/api/productos/:id', verificarToken, (req, res) => {
    try {
        const productos = leerProductos();
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
        res.status(500).json({ error: 'Error al eliminar producto' });
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
    console.log(`🚀 Servidor MB Solutions ejecutándose en http://localhost:${PORT}`);
    console.log(`📦 Base de datos: ${DB_PATH}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
