# MB Solutions - Sistema de Tienda Virtual con Backend Seguro

## Cambios Implementados ✅

Se ha migrado completamente el sistema de tienda de frontend-only a una arquitectura con backend seguro:

### Seguridad Mejorada
- ✅ Autenticación JWT en servidor (no en cliente)
- ✅ Contraseñas NO expuestas en código frontend
- ✅ Productos almacenados en base de datos segura (backend)
- ✅ Tokens JWT con expiración de 24 horas
- ✅ Autorización requerida para operaciones admin

### Archivos Modificados

**Frontend:**
- `login.html` - Ahora valida credenciales con el backend
- `admin.html` - Verifica token JWT antes de permitir acceso
- `admin-script.js` - Todas las operaciones CRUD ahora usan API
- `shop-logic.js` - Los productos se cargan del backend, no de localStorage

**Backend (Nuevo):**
- `backend/server.js` - Servidor Express con todas las rutas
- `backend/middleware/auth.js` - Middleware de verificación JWT
- `backend/.env` - Configuración de ambiente
- `backend/package.json` - Dependencias del proyecto
- `backend/README.md` - Documentación del backend

## Cómo Ejecutar

### Paso 1: Instalar Dependencias del Backend
```bash
cd backend
npm install
```

### Paso 2: Iniciar el Servidor
```bash
node server.js
```

Deberías ver:
```
🚀 Servidor MB Solutions ejecutándose en http://localhost:3000
📦 Base de datos: ./data/productos.json
Environment: development
```

### Paso 3: Acceder a la Tienda
1. Abre tu navegador en `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/index.html`
2. Los productos se cargarán automáticamente del backend
3. Para acceder al panel admin:
   - Haz clic en el icono 🔐 (candado) en la esquina superior derecha
   - O ve a la página `login.html`

### Credenciales de Admin
- **Usuario:** `jmbravoc`
- **Contraseña:** `07may2025`

## Flujo de Operación

### Cliente (Frontend)
1. **Página Principal (index.html)**
   - Carga productos desde `GET /api/productos`
   - Muestra productos dinámicamente
   - Permite consultas via WhatsApp o email

2. **Panel Admin (admin.html)**
   - Requiere autenticación en login.html
   - Recibe JWT token después de login exitoso
   - CRUD de productos usando endpoints protegidos:
     - POST `/api/productos` (crear)
     - PUT `/api/productos/:id` (editar)
     - DELETE `/api/productos/:id` (eliminar)

### Servidor (Backend)
1. **Autenticación (`POST /api/login`)**
   - Valida usuario/contraseña
   - Emite JWT token si las credenciales son correctas
   - Token válido por 24 horas

2. **Productos Públicos (`GET /api/productos`)**
   - Accesible sin autenticación
   - Devuelve lista completa de productos

3. **Productos Protegidos**
   - Requieren header `Authorization: Bearer {token}`
   - Solo admin puede crear/editar/eliminar
   - Rechaza requests sin token válido

## Estructura del Proyecto

```
mbsolutions/
├── index.html              # Página principal (tienda)
├── login.html              # Página de login
├── admin.html              # Panel de administración
├── shop-logic.js           # Lógica de tienda (ahora usa API)
├── admin-script.js         # Lógica de admin (ahora usa API)
├── styles.css              # Estilos globales
├── images/                 # Imágenes del sitio
│
├── backend/                # 🆕 Servidor Node.js/Express
│   ├── server.js           # Servidor principal
│   ├── middleware/
│   │   └── auth.js         # Verificación JWT
│   ├── data/
│   │   └── productos.json  # Base de datos (auto-generada)
│   ├── package.json        # Dependencias
│   ├── .env                # Configuración
│   └── README.md           # Documentación backend
│
└── README.md               # 👈 Este archivo
```

## API Endpoints

### Autenticación
```
POST /api/login
Body: { usuario: "jmbravoc", contraseña: "07may2025" }
Response: { success: true, token: "eyJ..." }
```

### Productos
```
GET /api/productos              # Obtener todos (público)
GET /api/productos/:id          # Obtener uno (público)
POST /api/productos             # Crear (protegido - requiere JWT)
PUT /api/productos/:id          # Editar (protegido - requiere JWT)
DELETE /api/productos/:id       # Eliminar (protegido - requiere JWT)
```

## Importante para Producción

Aunque el sistema ahora es más seguro, hay consideraciones para producción:

1. **JWT_SECRET en `.env`** - Cambiar a una clave fuerte
2. **Base de Datos** - Migrar de JSON a MongoDB/PostgreSQL
3. **HTTPS** - Usar SSL/TLS en producción
4. **CORS** - Especificar dominios permitidos
5. **Hosting** - Desplegar backend en servidor profesional (Heroku, Railway, AWS, etc.)

## Troubleshooting

### Error: "Error de conexión con el servidor"
- Verifica que `node server.js` esté ejecutándose
- Verifica que el backend está en `http://localhost:3000`
- Abre las developer tools (F12) para ver errores en consola

### Error: "Token inválido"
- Vuelve a hacer login
- Verifica que el token JWT no haya expirado (24 horas)
- Limpia el cache/localStorage si es necesario

### No se cargan los productos
- Asegúrate que `backend/data/productos.json` existe
- Verifica que el servidor está ejecutándose
- Revisa la consola del servidor para errores

## URLs útiles

- **Tienda Frontend:** `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/index.html`
- **Panel Admin:** `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/admin.html` (requiere login)
- **Login:** `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/login.html`
- **API Health Check:** `http://localhost:3000/api/health`
- **Ver Productos (JSON):** `http://localhost:3000/api/productos`

## Próximos Pasos Sugeridos

1. Crear una base de datos real (MongoDB Atlas, Supabase, etc.)
2. Implementar subida de imágenes a servidor en lugar de Base64
3. Agregar más roles de usuario (vendedor, gerente, etc.)
4. Implementar historial de cambios
5. Agregar búsqueda y filtros avanzados
6. Implementar carrito de compras
7. Sistema de órdenes/invoicing

---

**Última actualización:** 15 Febrero 2026
**Estado:** ✅ Backend completamente implementado y funcionando
