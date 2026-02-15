# Quick Start - MB Solutions Backend

## ⚡ Inicio Rápido en 5 Minutos

### Paso 1️⃣: Abrir PowerShell
```powershell
# Navega a la carpeta del proyecto
cd C:\Users\bjorg\OneDrive\Desktop\mbsolutions
```

### Paso 2️⃣: Ejecutar el Script de Inicio
```powershell
.\backend\start.ps1
```

Deberías ver:
```
✅ Node.js instalado: v18.17.0
📦 Dependencias ya están instaladas
🌐 URL: http://localhost:3000
👤 Usuario Admin: jmbravoc
🔑 Contraseña: 07may2025
🚀 Iniciando servidor...
```

### Paso 3️⃣: Verificar que Funciona
Abre tu navegador y visita:
```
http://localhost:3000/api/health
```

### Paso 4️⃣: Acceder a la Tienda
Abre en tu navegador:
```
file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/index.html
```

### Paso 5️⃣: Acceder al Panel Admin
Haz clic en el icono 🔐 (candado) en la esquina superior derecha, o abre:
```
file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/login.html
```

Credenciales:
- Usuario: `jmbravoc`
- Contraseña: `07may2025`

---

## 🧪 Probar API con ejemplos

### Opción A: Usar cURL (Terminal/PowerShell)

#### 1. Login para obtener token
```bash
curl -X POST http://localhost:3000/api/login `
  -H "Content-Type: application/json" `
  -d '{"usuario":"jmbravoc","contrasena":"07may2025"}'
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Copiar el token y usarlo para crear un producto
```bash
# Reemplaza TOKEN con el valor obtenido arriba
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/productos `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "code":"PROD-001",
    "name":"Laptop Gaming",
    "category":"laptops",
    "price":1500000,
    "stock":5,
    "description":"Laptop gaming profesional",
    "image":"data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

#### 3. Ver todos los productos
```bash
curl http://localhost:3000/api/productos
```

### Opción B: Usar Postman (Interfaz Visual)

1. Descargar Postman desde: https://www.postman.com/downloads/
2. Crear nueva colección "MB Solutions"
3. Crear requests:

**Request 1: POST Login**
- URL: `http://localhost:3000/api/login`
- Method: POST
- Body (JSON):
```json
{
  "usuario": "jmbravoc",
  "contraseña": "07may2025"
}
```

**Request 2: GET Productos**
- URL: `http://localhost:3000/api/productos`
- Method: GET
- Header: (ninguno)

**Request 3: POST Crear Producto**
- URL: `http://localhost:3000/api/productos`
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token_del_login}`
- Body (JSON):
```json
{
  "code": "PROD-001",
  "name": "Laptop Gaming",
  "category": "laptops",
  "price": 1500000,
  "stock": 5,
  "description": "Laptop gaming de alta performance",
  "image": "data:image/jpeg;base64,..."
}
```

---

## 📋 Checklist de Verificación

- [ ] Node.js instalado (`node --version`)
- [ ] Carpeta backend existe
- [ ] Ejecuté `npm install` en backend
- [ ] Servidor iniciado con `start.ps1` o `node server.js`
- [ ] `http://localhost:3000/api/health` responde OK
- [ ] `http://localhost:3000/api/productos` devuelve `[]`
- [ ] Login funciona con usuario `jmbravoc`
- [ ] Panel admin carga después de login
- [ ] Puedo crear un producto en admin
- [ ] El producto aparece en la página principal

---

## 📁 Estructura de Archivos

```
C:\Users\bjorg\OneDrive\Desktop\mbsolutions\
├── backend/
│   ├── server.js           ← Servidor principal
│   ├── start.ps1           ← Script para Windows ⭐
│   ├── package.json
│   ├── .env
│   └── data/
│       └── productos.json  ← Base de datos (se crea automáticamente)
├── index.html              ← Tienda (punto de inicio)
├── login.html              ← Página de login
├── admin.html              ← Panel de administración
├── shop-logic.js           ← Lógica de tienda
├── admin-script.js         ← Lógica de admin
├── styles.css
└── images/
```

---

## 🆘 ¿Qué Hacer si Algo no Funciona?

### El servidor no inicia
```powershell
# Elimina node_modules
rm backend\node_modules -Recurse

# Reinstala
cd backend
npm install
node server.js
```

### Puerto 3000 ya está en uso
```powershell
# Ver qué proceso usa el puerto 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Matar el proceso (reemplaza PID con el número)
Stop-Process -Id 12345 -Force
```

### Los productos no se guardan
- Verifica que `/backend/data/productos.json` existe
- Si no existe, créalo vacío: `[]`
- Reinicia el servidor

### Error "CORS"
- Los CORS están habilitados para todos los orígenes
- Si sigues teniendo problemas, abre la consola (F12) para ver el error exacto

---

## 🚀 Próximos Pasos

1. **Agregar Productos:**
   - Login → Admin Panel
   - Llenar formulario
   - Subir imagen
   - Guardar

2. **Personalizar:**
   - Cambiar colores en `styles.css`
   - Agregar más categorías en `shop-logic.js`
   - Cambiar credenciales en `.env`

3. **Desplegar:**
   - Heroku (gratis para hobby)
   - Railway
   - Render
   - AWS
   - DigitalOcean

---

## 📞 Soporte

**Si todo funciona, el sistema está listo para usar.**

Puntos clave:
- ✅ Frontend: http://localhost:3000/
- ✅ Backend: Datos en `./data/productos.json`
- ✅ Autenticación: JWT 24 horas
- ✅ Admin: Protegido con login

---

**¡Listo para empezar! 🎉**
