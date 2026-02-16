🚀 INSTRUCCIONES PARA DESPLEGAR EN BANAHOSTING
================================================================================

DOMINIO: mbsolutionscr.com
HOSTING: BanaHosting (cPanel con Setup Node.js App)

================================================================================
PASO 1: PREPARAR EL PROYECTO EN TU PC
================================================================================

✅ YA COMPLETADO EN ESTE PROYECTO:
- server.js usa puerto dinámico: const PORT = process.env.PORT || 3000;
- Frontend usa api-config.js que detecta automáticamente el dominio
- El archivo api-config.js ya está creado y configurado

NO NECESITAS HACER NADA EN TU PC. Solo pasar al siguiente paso.

================================================================================
PASO 2: PREPARAR ARCHIVO PARA SUBIR
================================================================================

1. En tu PC, navega a la carpeta del proyecto:
   C:\Users\bjorg\OneDrive\Desktop\mbsolutions\

2. Comprime SOLO la carpeta "backend" en un .zip PERO EXCLUYENDO:
   ❌ NO incluyas node_modules/ (lo instalará cPanel)
   ❌ NO incluyas package-lock.json
   
3. Los archivos QUE SÍ debes incluir en el .zip:
   ✅ server.js
   ✅ package.json
   ✅ .env
   ✅ middleware/
   ✅ data/ (la carpeta para productos)
   
   El .zip debe verse así (sin node_modules):
   backend/
   ├── server.js
   ├── package.json
   ├── .env
   ├── middleware/
   │   └── auth.js
   └── data/
       └── productos.json

================================================================================
PASO 3: EN EL CPANEL DE BANAHOSTING
================================================================================

1. Abre el cPanel de BanaHosting
   
2. Ve a: Software → Setup Node.js App
   
3. Haz clic en "Create Application"
   
4. Configura exactamente así:

   📝 Node.js version: 20.x o 18.x (la más nueva disponible)
   
   📝 Application mode: Production
   
   📝 Application root: mbsolutions-backend
      (Esto creará una carpeta con este nombre)
   
   📝 Application URL: mbsolutionscr.com
      (O el dominio que quieras usar)
   
   📝 Application startup file: server.js
   
5. Haz clic en "Create"
   
   El sistema creará automáticamente una carpeta llamada "mbsolutions-backend"
   en tu servidor.

================================================================================
PASO 4: SUBIR ARCHIVOS VIA FILE MANAGER
================================================================================

1. En cPanel, abre: File Manager
   
2. Navega a la carpeta que se creó: public_html/ o mbsolutions-backend/
   (Depende de cómo configuró BanaHosting)
   
3. Sube el archivo .zip que comprimiste
   
4. Descomprime el .zip en esa carpeta
   
5. Ahora debes tener:
   /public_html/server.js (o /mbsolutions-backend/server.js)
   /public_html/package.json
   /public_html/.env
   etc.

================================================================================
PASO 5: INSTALAR DEPENDENCIAS
================================================================================

1. En cPanel, vuelve a: Software → Setup Node.js App
   
2. Verás la aplicación que creaste en el listado
   
3. Haz clic en: "Run NPM Install"
   
   Esto ejecutará automáticamente: npm install
   Y descargará express, cors, jsonwebtoken, etc.
   
4. Espera a que termine (puede tomar 1-2 minutos)

================================================================================
PASO 6: INICIAR EL SERVIDOR
================================================================================

1. En la misma pantalla de Setup Node.js App
   
2. Haz clic en: "Restart"
   
   Esto iniciará tu servidor Node.js.
   
3. Deberías ver un estado "Running" o similar

✅ ¡Tu backend está vivo 24/7!

================================================================================
PASO 7: CONEXIÓN DEL FRONTEND
================================================================================

✅ YA COMPLETADO:
El archivo api-config.js ya detecta automáticamente en qué dominio está:

- Si abres la página desde: file:// (tu PC)
  → Usará: http://localhost:3000
  
- Si abres la página desde: mbsolutionscr.com
  → Usará: https://mbsolutionscr.com
  
- Si abres desde GitHub Pages (testing)
  → Usará: http://localhost:3000

NO NECESITAS CAMBIAR NADA en login.html, admin.html, etc.

================================================================================
PASO 8: SUBIR EL FRONTEND
================================================================================

El frontend (index.html, admin.html, login.html, etc.) lo subes a:
/public_html/

Exactamente donde está ahora. BanaHosting sirve los archivos HTML estáticos
desde ahí automáticamente.

================================================================================
VERIFICACIÓN FINAL
================================================================================

Después de todo, verifica:

1. Abre: https://mbsolutionscr.com
   ✅ Debería cargar la tienda

2. Abre: https://mbsolutionscr.com/login.html
   ✅ Debería cargar la página de login
   
3. Intenta hacer login:
   - Usuario: jmbravoc
   - Contraseña: 07may2025
   ✅ Debería funcionar

4. En consola del navegador (F12):
   - Debería ver: "[API Config] Usando endpoint: https://mbsolutionscr.com"
   ✅ Confirma que detectó correctamente el dominio

================================================================================
MANTENIMIENTO
================================================================================

🔄 Passenger (el servicio de BanaHosting) mantendrá tu servidor activo:
- Si falla por algún error, lo reinicia automáticamente
- Si el servidor se cuelga, lo reinicia
- No necesitas hacer nada más

📊 Si necesitas ver logs, generalmente están en:
cPanel → Metrics → Node.js → Ver logs

⚡ Si necesitas reiniciar manualmente:
cPanel → Software → Setup Node.js App → Botón "Restart"

================================================================================
NOTAS IMPORTANTES
================================================================================

🔐 Seguridad en producción:
- Abre backend/.env en cPanel File Manager
- CAMBIA el valor de JWT_SECRET a algo más seguro
- CAMBIA las credenciales de ADMIN_USER y ADMIN_PASSWORD

📝 El archivo .env en cPanel debería verse así:
PORT=
ADMIN_USER=jmbravoc
ADMIN_PASSWORD=07may2025
JWT_SECRET=miSuperClaveSegura2026
DB_PATH=data/productos.json

🚀 Si quieres DESCARGAR los productos como backup:
File Manager de cPanel → backend/data/productos.json
Descárgalo regularmente como respaldo

================================================================================
¿PROBLEMAS?
================================================================================

Si la API no funciona:

1. Verifica que el botón dice "Running" en Setup Node.js App
   Si dice "Stopped", haz clic en "Restart"

2. Los logs están en: cPanel → Node.js → Ver logs
   Busca mensajes de error

3. Verifica que el puerto correcto está configurado en .env
   (Generalmente BanaHosting asigna uno automáticamente)

4. Si cambias algo en server.js, vuelve a subirlo y haz "Restart"

================================================================================
LISTO! 🎉
================================================================================

Tu sistema MB Solutions está casi en producción. Solo sigue estos pasos
en cPanel y estará 24/7 activo con Passenger vigilando que todo funcione.

Documentación: github.com/JorgeBC420/mbsolutions
Dominio: https://mbsolutionscr.com (cuando lo tengas en BanaHosting)
