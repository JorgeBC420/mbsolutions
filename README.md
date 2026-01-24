# MB Solutions CR - Guía de Instalación

## 📋 Requisitos

- Editor de código (VS Code recomendado)
- ImageMagick instalado para convertir imágenes a WebP
- Las imágenes en las carpetas correspondientes

## 📁 Estructura de carpetas requerida

```
mbsolutions/
├── index.html
├── styles.css
├── convert-to-webp.ps1
├── README.md
└── images/
    ├── mbslogo.jpeg
    └── carrusel/
        ├── carrusel 1.jpeg
        ├── carrusel 2.jpeg
        ├── carrusel 3.jpeg
        └── carrusel 4.jpeg
```

## 🖼️ Convertir imágenes a WebP

### Opción 1: Usando el script PowerShell (Windows)

1. Asegúrate de que ImageMagick está instalado:
   - Descarga desde: https://imagemagick.org/script/download.php#windows
   - Instala con las opciones por defecto

2. Ejecuta el script:
```powershell
# Abre PowerShell en la carpeta del proyecto
.\convert-to-webp.ps1
```

### Opción 2: Convertir manualmente con ImageMagick

```bash
# Logo
magick convert images/mbslogo.jpeg -quality 80 images/mbslogo.webp

# Carrusel
magick convert images/carrusel/carrusel\ 1.jpeg -quality 80 images/carrusel/carrusel1.webp
magick convert images/carrusel/carrusel\ 2.jpeg -quality 80 images/carrusel/carrusel2.webp
magick convert images/carrusel/carrusel\ 3.jpeg -quality 80 images/carrusel/carrusel3.webp
magick convert images/carrusel/carrusel\ 4.jpeg -quality 80 images/carrusel/carrusel4.webp
```

### Opción 3: Online (sin instalar nada)

Usa https://convertio.co/es/jpeg-webp/ para convertir online

## 📊 Carrusel de Imágenes

### Características:
- ✅ 4 imágenes en rotación
- ✅ Autoplay cada 5 segundos
- ✅ Botones anterior/siguiente
- ✅ Indicadores (dots) para navegar
- ✅ Responsivo en móviles
- ✅ Transiciones suaves

### Personalización del tiempo de autoplay:

En `index.html`, busca en el JavaScript:
```javascript
autoplayInterval = setInterval(() => {
    showSlide(currentIndex + 1);
}, 5000); // Cambiar 5000 por milisegundos (ej: 3000 = 3 segundos)
```

## 🎨 Archivos principales

### index.html
- Estructura HTML de la página
- Carrusel con 4 imágenes
- Formulario de contacto integrado con WhatsApp
- Botón flotante de WhatsApp
- Menú responsive

### styles.css
- Estilos CSS organizados por secciones
- Estilos del carrusel
- Media queries para responsividad
- Comentarios para fácil mantenimiento

## 🚀 Funcionalidades

### Carrusel
- Navegación manual con botones
- Navegación por dots/indicadores
- Autoplay automático
- Transiciones suaves

### Contacto
- Formulario integrado con WhatsApp
- Al enviar, abre WhatsApp con el mensaje
- Campos: Empresa, Nombre, Teléfono, Email, Mensaje

### Menú
- Menú desktop horizontal
- Menú móvil hamburguesa
- Efecto hover en links
- Se cierra al hacer click en un link

### Efectos
- Efecto de sombra en navbar al scroll
- Animación float en elementos
- Transiciones suaves en botones y cards

## 📱 Responsividad

La página es totalmente responsiva:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Móvil**: menos de 768px
- **Móvil pequeño**: menos de 480px

## 🔗 Enlaces importantes

### Datos de contacto (Editar en HTML y CSS):
- **Teléfono**: +506 6205 5092
- **Email**: ventas@mbsolutionscr.com
- **WhatsApp**: https://wa.me/50662055092

### Redes sociales (Editar links en footer):
- Facebook
- Instagram
- WhatsApp

## 📝 Notas

1. **WebP**: Formato de imagen moderno, más pequeño y de mejor calidad que JPEG
2. **Nombres de archivos**: Asegúrate de que coincidan exactamente con los del HTML
3. **Rutas**: Las imágenes deben estar en `images/` y `images/carrusel/`
4. **Hosted**: Sube `index.html` y `styles.css` a tu servidor FTP

## 🆘 Solución de problemas

### Las imágenes no cargan
- Verifica que los archivos están en las carpetas correctas
- Comprueba que los nombres de archivo sean exactos (mayúsculas/minúsculas)
- Revisa que están en formato WebP

### El carrusel no funciona
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que todas las imágenes cargan correctamente

### Las imágenes están borrosas
- Asegúrate de convertir con calidad 80 o superior
- Redimensiona las imágenes de origen si son muy pequeñas

## 📞 Soporte

Para ayuda con:
- Instalación de ImageMagick
- Conversión de imágenes
- Personalización de estilos

Contacta: +506 6205 5092 (WhatsApp)

---
**Última actualización**: Enero 2026
**Versión**: 2.0 (Con carrusel)
