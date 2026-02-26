// ========================================
// LÓGICA DE LA TIENDA PARA CLIENTE
// ========================================
// API_BASE se define en api-config.js
// Se adapta automáticamente según el dominio

let products = [];
let selectedProduct = null;

// Construir URL de imagen de producto (funciona en desarrollo y producción)
function getProductImageUrl(imagePath) {
    if (!imagePath || imagePath === 'images/placeholder.jpg') {
        return 'images/placeholder.jpg';
    }
    const filename = imagePath.replace(/^images\//, '');
    return `${API_BASE}/api/images/${filename}`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// ========================================
// CARGAR PRODUCTOS DEL BACKEND
// ========================================

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/productos`);
        
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }

        products = await response.json();
        loadCategoryFilters();
        renderProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:3rem; color: var(--error);">Error al cargar productos del servidor.</p>';
        }
    }
}

// ========================================
// FUNCIONES DE CATEGORÍAS
// ========================================

function loadCategoryFilters() {
    const categories = {
        'laptops': 'Laptops',
        'desktops': 'Computadoras',
        'accesorios': 'Accesorios',
        'componentes': 'Componentes',
        'consumibles': 'Consumibles'
    };
    const filterDiv = document.getElementById('categoryFilter');
    if (!filterDiv) return;

    let html = '<button class="category-btn active" onclick="filterCategory(\'all\')">Todos</button>';
    Object.keys(categories).forEach(key => {
        const hasProducts = products.some(p => p.category === key);
        if (hasProducts) {
            html += `<button class="category-btn" onclick="filterCategory('${key}')">${categories[key]}</button>`;
        }
    });
    filterDiv.innerHTML = html;
}


// ── Genera slug de URL a partir de un nombre de producto ──
// Ejemplo: "Adaptador SATA a USB" → "adaptador-sata-a-usb"
function generarSlug(nombre) {
    return nombre
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = category === 'all' ? products : products.filter(p => p.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:3rem; color: var(--gray);">No hay productos en esta categoría.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const slug = generarSlug(p.name);
        const productoUrl = `/producto/${p.id}/${slug}`;

        return `
        <div class="product-card" style="position:relative;" onclick="openProductModal(${p.id})">
            <!--
                Enlace SEO real: Google puede seguirlo aunque el onclick lo intercepte.
                Permite compartir el link con clic derecho > "Copiar URL del enlace".
            -->
            <a href="${productoUrl}"
               aria-label="Ver ${p.name}"
               onclick="event.preventDefault(); openProductModal(${p.id})"
               style="position:absolute; inset:0; z-index:1; border-radius:inherit; display:block;">
            </a>
            <img src="${getProductImageUrl(p.image)}" class="product-image" alt="${p.name}" loading="lazy">
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-footer">
                    <span class="product-price">₡${parseInt(p.price).toLocaleString()}</span>
                    <span class="product-stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">
                        ${p.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openProductModal(productId) {
    selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    document.getElementById('modalProductImage').src = getProductImageUrl(selectedProduct.image);
    document.getElementById('modalProductName').textContent = selectedProduct.name;
    document.getElementById('modalProductCode').textContent = selectedProduct.code;
    document.getElementById('modalProductPrice').textContent = `₡${parseInt(selectedProduct.price).toLocaleString()}`;

    const stockEl = document.getElementById('modalProductStock');
    stockEl.textContent = selectedProduct.stock > 0 ? 'En Stock' : 'Agotado';
    stockEl.className = `product-stock ${selectedProduct.stock > 0 ? 'in-stock' : 'out-stock'}`;

    document.getElementById('modalProductDescription').textContent = selectedProduct.description;

    // ── Botón "Copiar enlace" en el modal ──
    // Selector corregido: el HTML real usa .product-actions
    const modalActions = document.querySelector('.product-actions');
    if (modalActions) {
        // Eliminar botón anterior si existía (de un producto visto antes)
        const existente = modalActions.querySelector('.btn-share-product');
        if (existente) existente.remove();

        const slug = generarSlug(selectedProduct.name);
        const productoUrl = `${window.location.origin}/producto/${selectedProduct.id}/${slug}`;

        const shareBtn = document.createElement('button');
        shareBtn.className = 'btn-share-product';
        shareBtn.type = 'button';
        shareBtn.style.cssText = `
            width: 100%;
            margin-top: 8px;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 10px 16px;
            color: #94a3b8;
            cursor: pointer;
            font-size: 0.88rem;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s, color 0.2s;
        `;
        shareBtn.innerHTML = '<i class="fas fa-link"></i> Copiar enlace del producto';

        shareBtn.onmouseenter = () => { shareBtn.style.background = '#2a3a50'; shareBtn.style.color = '#e2e8f0'; };
        shareBtn.onmouseleave = () => { shareBtn.style.background = '#1e293b'; shareBtn.style.color = '#94a3b8'; };

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(productoUrl).then(() => {
                shareBtn.innerHTML = '<i class="fas fa-check"></i> ¡Enlace copiado!';
                shareBtn.style.color = '#2ed573';
                shareBtn.style.borderColor = '#2ed573';
                setTimeout(() => {
                    shareBtn.innerHTML = '<i class="fas fa-link"></i> Copiar enlace del producto';
                    shareBtn.style.color = '#94a3b8';
                    shareBtn.style.borderColor = '#334155';
                }, 2500);
            });
        };

        modalActions.appendChild(shareBtn);
    }

    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ── addProductToCart ahora usa addToCart() de cart.js,
//    que ya incluye la validación de stock máximo ──
function addProductToCart() {
    if (!selectedProduct) return;

    addToCart({
        id: selectedProduct.id,
        code: selectedProduct.code,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
        stock: selectedProduct.stock
    });

    // Cerrar modal solo si el producto se agregó (no si fue bloqueado por stock)
    const cart = typeof getCart === 'function' ? getCart() : [];
    const enCarrito = cart.find(i => i.id === selectedProduct.id);
    if (enCarrito) {
        closeProductModal();
    }
}
// ========================================
// FUNCIONES DE TABS DE CONTACTO
// ========================================

function switchContactTab(type) {
    document.querySelectorAll('.contact-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.contact-form').forEach(f => f.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById(type + 'Form').classList.add('active');
}

// ========================================
// FUNCIONES DE FORMULARIO WHATSAPP
// ========================================

function handleWhatsAppSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('wa-name').value;
    const phone = document.getElementById('wa-phone').value;
    const msg = document.getElementById('wa-message').value;
    const url = `https://wa.me/50662055092?text=${encodeURIComponent(`Hola MB Solutions, soy ${name}. Teléfono: ${phone}. ${msg}`)}`;
    window.open(url, '_blank');
    e.target.reset();
}

// ========================================
// FUNCIONES DE FORMULARIO EMAIL
// ========================================

function handleEmailSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitEmailBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

    grecaptcha.ready(function() {
        grecaptcha.execute('6LeZvmwsAAAAAErJj7146IxsW9wxkLhj8nOnCNSH', {action: 'submit'}).then(function(token) {
            const name = document.getElementById('em-name').value;
            const email = document.getElementById('em-email').value;
            const msg = document.getElementById('em-message').value;
            
            const subject = encodeURIComponent(`Contacto Web - ${name}`);
            const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`);
            
            window.location.href = `mailto:ventas@mbsolutionscr.com?subject=${subject}&body=${body}`;
            
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Correo';
        });
    });
}
