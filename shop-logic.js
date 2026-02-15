// ========================================
// LÓGICA DE LA TIENDA PARA CLIENTE
// ========================================

let products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];
let selectedProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryFilters();
    renderProducts();
});

// ========================================
// FUNCIONES DE CATEGORÍAS
// ========================================

function loadCategoryFilters() {
    const categories = {
        'laptops': 'Laptops',
        'desktops': 'Computadoras',
        'accesorios': 'Accesorios',
        'componentes': 'Componentes'
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

function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Recargar productos en caso de que hayan sido agregados desde admin
    products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];

    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:3rem; color: var(--gray);">No hay productos en esta categoría.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="openProductModal(${p.id})">
            <img src="${p.image || 'images/placeholder.jpg'}" class="product-image" alt="${p.name}">
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
        </div>
    `).join('');
}

function filterCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderProducts(category);
}

// ========================================
// FUNCIONES DEL MODAL DE PRODUCTO
// ========================================

function openProductModal(productId) {
    selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;
    
    document.getElementById('modalProductImage').src = selectedProduct.image || 'images/placeholder.jpg';
    document.getElementById('modalProductName').textContent = selectedProduct.name;
    document.getElementById('modalProductCode').textContent = selectedProduct.code;
    document.getElementById('modalProductPrice').textContent = `₡${parseInt(selectedProduct.price).toLocaleString()}`;
    
    const stockEl = document.getElementById('modalProductStock');
    stockEl.textContent = selectedProduct.stock > 0 ? 'En Stock' : 'Agotado';
    stockEl.className = `product-stock ${selectedProduct.stock > 0 ? 'in-stock' : 'out-stock'}`;
    
    document.getElementById('modalProductDescription').textContent = selectedProduct.description;
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function contactProduct() {
    if (!selectedProduct) return;
    const message = `Hola, estoy interesado en:\n\n${selectedProduct.name}\nCódigo: ${selectedProduct.code}\nPrecio: ₡${parseInt(selectedProduct.price).toLocaleString()}`;
    const url = `https://wa.me/50662055092?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
};

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
        grecaptcha.execute('TU_SITE_KEY_AQUI', {action: 'submit'}).then(function(token) {
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
