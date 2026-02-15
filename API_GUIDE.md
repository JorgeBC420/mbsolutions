# Guía de Uso del Backend - MB Solutions

## Resumen de Cambios

El sistema ha sido transformado de un sistema basado en LocalStorage a uno basado en API REST con autenticación JWT.

### Antes ❌ (Inseguro)
```javascript
// Acceso directo a localStorage (vulnerable)
let products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];
localStorage.setItem('mbsolutions_products', JSON.stringify(products));
```

### Ahora ✅ (Seguro)
```javascript
// Acceso seguro a través de API con autenticación
const response = await fetch('http://localhost:3000/api/productos');
const products = await response.json();
```

---

## Guía Rápida de Inicio

### 1. Instalar y Ejecutar el Backend

**Opción A: PowerShell (Windows Recomendado)**
```powershell
cd backend
.\start.ps1
```

**Opción B: CMD/Terminal
```bash
cd backend
npm install
node server.js
```

### 2. Verificar que El Servidor Funciona

Abre tu navegador y ve a:
```
http://localhost:3000/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Servidor MB Solutions funcionando correctamente",
  "timestamp": "2026-02-15T10:30:00.000Z"
}
```

### 3. Verificar Que Los Productos Se Cargan

```
http://localhost:3000/api/productos
```

Al principio verá `[]` (lista vacía). Los productos se pueden agregar desde el panel admin.

---

## Flujo de Uso - Cliente

### Página Principal (index.html)

1. **Al Cargar:**
   - Se ejecuta `loadProducts()`
   - Hace `GET http://localhost:3000/api/productos`
   - Muestra productos en la tienda

2. **Para Ver un Producto:**
   - Clic en un producto
   - Se abre modal con detalles
   - Puede consultar por WhatsApp

3. **Para Contactar:**
   - **WhatsApp:** Abre WhatsApp chat directo
   - **Email:** Abre cliente de email con reCAPTCHA v3

---

## Flujo de Uso - Admin

### 1. Login

**URL:** `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/login.html`

```
Usuario: jmbravoc
Contraseña: 07may2025
```

**Lo que sucede:**
```javascript
// login.html hace POST al backend
const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        usuario: "jmbravoc",
        contraseña: "07may2025"
    })
});

const data = await response.json();
// Si es exitoso, data contiene: { success: true, token: "eyJ..." }
localStorage.setItem('adminToken', data.token);
// Redirige a admin.html
```

### 2. Panel Admin

**URL:** `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/admin.html`

**Protección:**
```javascript
// Al cargar admin.html, verifica token
window.addEventListener('load', () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        window.location.href = 'login.html'; // Redirige si no hay token
    }
});
```

### 3. Operaciones CRUD

#### Listar Productos
```javascript
const response = await fetch('http://localhost:3000/api/productos');
const products = await response.json();
```

#### Crear Producto
```javascript
const newProduct = {
    code: "PROD-001",
    name: "Laptop Gaming",
    category: "laptops",
    price: 1500000,
    stock: 5,
    description: "Descripción del producto",
    image: "data:image/jpeg;base64,..." // Base64 de imagen
};

const response = await fetch('http://localhost:3000/api/productos', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    body: JSON.stringify(newProduct)
});

const result = await response.json();
// { success: true, product: {...} }
```

#### Editar Producto
```javascript
const updatedProduct = {
    code: "PROD-001",
    name: "Laptop Gaming Pro",
    category: "laptops",
    price: 1800000,
    stock: 3,
    description: "Descripción actualizada",
    image: "data:image/jpeg;base64,..."
};

const response = await fetch('http://localhost:3000/api/productos/1707000000000', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    body: JSON.stringify(updatedProduct)
});

const result = await response.json();
// { success: true, product: {...} }
```

#### Eliminar Producto
```javascript
const response = await fetch('http://localhost:3000/api/productos/1707000000000', {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    }
});

const result = await response.json();
// { success: true, product: {...} }
```

#### Cerrar Sesión
```javascript
function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}
```

---

## Estructura de Datos

### Producto (JSON)
```json
{
  "id": 1707000000000,
  "code": "PROD-001",
  "name": "Laptop Gaming",
  "category": "laptops",
  "price": 1500000,
  "stock": 5,
  "description": "Laptop gaming de alta performance con procesador Intel i9",
  "image": "data:image/jpeg;base64,...",
  "createdAt": "2026-02-15T10:30:00.000Z",
  "updatedAt": "2026-02-15T11:45:00.000Z"
}
```

### Categorías Válidas
- `laptops` - Laptops
- `desktops` - Computadoras de escritorio
- `accesorios` - Accesorios
- `componentes` - Componentes

---

## Tokens JWT

### ¿Qué es un JWT?
Token que contiene información del usuario y es verificado por el servidor.

### Estructura
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJ1c3VhcmlvIjoiam1icmF2b2MiLCJpYXQiOjE3MDcwMDAwMDAsImV4cCI6MTcwNzA4NjQwMH0
.sIr03zM8cFLXwzK5gJ2N...
```

### Validez
- **Emitido:** Al hacer login exitoso
- **Válido por:** 24 horas
- **Almacenamiento:** localStorage (frontend)
- **Uso:** Header `Authorization: Bearer {token}`

### Cuando Expira
- Se requiere hacer login nuevamente
- El servidor rechazará el token expirado con HTTP 401

---

## Protección de API

### Endpoints Públicos (Sin Autenticación)
```
GET /api/productos       # Ver todos los productos
GET /api/productos/:id   # Ver un producto
GET /api/health          # Verificar salud del servidor
```

### Endpoints Protegidos (Requieren Token)
```
POST /api/productos      # Crear producto
PUT /api/productos/:id   # Editar producto
DELETE /api/productos/:id     # Eliminar producto
```

### Cómo Enviar Token
```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
};

fetch(url, { headers, ...options });
```

### Respuestas de Error
```javascript
// No autenticado
{
    "error": "Token no proporcionado",
    "success": false
}

// Token inválido o expirado
{
    "error": "Token inválido o expirado",
    "success": false
}

// Credenciales incorrectas
{
    "error": "Usuario o contraseña incorrectos",
    "success": false
}

// Recurso no encontrado
{
    "error": "Producto no encontrado"
}
```

---

## Troubleshooting

### "Error de conexión con el servidor"
**Causa:** El backend no está ejecutándose
**Solución:**
1. Abre PowerShell en la carpeta backend
2. Ejecuta `.\start.ps1` o `node server.js`
3. Verifica que veas el mensaje:
   ```
   🚀 Servidor MB Solutions ejecutándose en http://localhost:3000
   ```

### "Token no proporcionado"
**Causa:** El token no se envía correctamente en el header
**Solución:**
1. Verifica que hagas login primero
2. Comprueba que el token está en localStorage
3. Revisa que el header sea: `Authorization: Bearer {token}`

### "Token inválido o expirado"
**Causa:** El token venció o está corrupto
**Solución:**
1. Haz logout
2. Haz login otra vez
3. Limpia localStorage si persiste

### "Síntomas: Los productos no se cargan"
**Causa:** Múltiples posibles
**Solución:**
```javascript
// En consola del navegador (F12):
fetch('http://localhost:3000/api/health')
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
```

---

## Mejoras Futuras

1. **Base de Datos Real**
   - Migrar de JSON a MongoDB o PostgreSQL
   - Mejor performance y escalabilidad

2. **Imágenes en Servidor**
   - Implementar upload file en lugar de Base64
   - Mejor manejo de memoria

3. **Múltiples Usuarios**
   - Roles: Admin, Vendedor, Gerente
   - Auditoría de cambios

4. **Validaciones**
   - Validar datos en cliente y servidor
   - Sanitizar inputs

5. **Seguridad**
   - Rate limiting
   - Encriptación de contraseñas
   - HTTPS en producción

---

**Última actualización:** 15 Febrero 2026
**Versión:** 2.0 (Backend)
