# Backend - MB Solutions Tienda

Sistema backend seguro para la administración de productos y autenticación de la tienda MB Solutions CR.

## Requisitos Previos

- Node.js 16+ instalado
- npm (incluido con Node.js)

## Instalación

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

## Configuración

El archivo `.env` ya está configurado con:
- `PORT=3000` - Puerto del servidor
- `ADMIN_USER=xxx` - Usuario administrador (ver `docs/SETUP_PRIVADO.md`)
- `ADMIN_PASSWORD=xxx` - Contraseña administrador (ver `docs/SETUP_PRIVADO.md`)
- `JWT_SECRET=your_super_secret_jwt_key_change_in_production` - Clave secreta JWT
- `DB_PATH=./data/productos.json` - Ruta de base de datos

## Ejecución

### Modo Desarrollo
```bash
node server.js
```

El servidor se iniciará en `http://localhost:3000`

### Con Nodemon (Auto-reload)
```bash
npm install --save-dev nodemon
npx nodemon server.js
```

## Endpoints API

### Autenticación
- **POST** `/api/login`
  - Body: `{ usuario: string, contraseña: string }`
  - Response: `{ success: true, token: string }`

### Productos (Público)
- **GET** `/api/productos` - Listar todos los productos
- **GET** `/api/productos/:id` - Obtener un producto específico

### Productos (Protegido - Requiere Token JWT)
- **POST** `/api/productos` - Crear producto
- **PUT** `/api/productos/:id` - Actualizar producto
- **DELETE** `/api/productos/:id` - Eliminar producto

### Salud
- **GET** `/api/health` - Verificar estado del servidor

## Estructura del Proyecto

```
backend/
├── server.js           # Servidor principal Express
├── middleware/
│   └── auth.js         # Middleware JWT
├── data/
│   └── productos.json  # Base de datos JSON
├── package.json        # Dependencias
├── .env               # Variables de entorno
└── README.md          # Este archivo
```

## Formato de Producto

```json
{
  "id": 1707000000000,
  "code": "PROD-001",
  "name": "Laptop Gaming",
  "category": "laptops",
  "price": 1500000,
  "stock": 5,
  "description": "Laptop gaming de alta performance",
  "image": "data:image/jpeg;base64,..."
}
```

## Categorías Válidas
- `laptops` - Laptops
- `desktops` - Computadoras de escritorio
- `accesorios` - Accesorios
- `componentes` - Componentes

## Cambios de Seguridad

### Antes (Frontend - Inseguro)
- Credenciales en el cliente
- Productos en localStorage
- Sin autenticación real

### Después (Backend - Seguro)
- Credenciales validadas en servidor
- Productos en base de datos segura
- Autenticación JWT token-based
- Autorización para operaciones admin

## Frontend API Configuration

En los archivos frontend:
- `shop-logic.js` - Carga productos del API
- `admin-script.js` - CRUD de productos con JWT
- `login.html` - Obtiene token JWT

URL API Base: `http://localhost:3000`

## Notas Importantes

1. **En Producción:**
   - Cambiar `JWT_SECRET` a una clave fuerte
   - Usar base de datos real (MongoDB, PostgreSQL, etc.) en lugar de JSON
   - Implementar HTTPS
   - Usar variables de entorno secretas

2. **CORS:**
   - Actualmente permite cualquier origen
   - En producción: especificar orígenes permitidos

3. **Base de Datos:**
   - Actualmente usa archivo JSON
   - NO recomendado para producción
   - Migrar a base de datos profesional

4. **Tokens JWT:**
   - Expiran después de 24 horas
   - Se almacenan en localStorage en el cliente
   - Incluir en header: `Authorization: Bearer <token>`
