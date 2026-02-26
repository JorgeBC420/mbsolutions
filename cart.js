// ========================================
// CARRITO DE COMPRAS - localStorage
// ========================================

const CART_KEY = 'mb_carrito';

// ========================================
// SISTEMA DE TOAST (reemplaza alert())
// ========================================

function showToast(message, type = 'success') {
    // Crear contenedor si no existe
    let container = document.getElementById('mb-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mb-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const colors = {
        success: { bg: '#1a2e1a', border: '#2ed573', icon: '✓', text: '#2ed573' },
        error:   { bg: '#2e1a1a', border: '#e74c3c', icon: '✕', text: '#e74c3c' },
        warning: { bg: '#2e261a', border: '#f39c12', icon: '⚠', text: '#f39c12' },
        info:    { bg: '#1a1e2e', border: '#4a9eff', icon: 'ℹ', text: '#4a9eff' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${c.bg};
        border: 1px solid ${c.border};
        border-left: 4px solid ${c.border};
        color: #fff;
        padding: 14px 18px;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 0.92rem;
        max-width: 320px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        pointer-events: all;
        opacity: 0;
        transform: translateX(30px);
        transition: opacity 0.25s ease, transform 0.25s ease;
    `;

    toast.innerHTML = `
        <span style="color:${c.text}; font-weight:700; font-size:1rem; line-height:1.4;">${c.icon}</span>
        <span style="line-height:1.5;">${message}</span>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
    });

    // Auto-remover
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ========================================
// FUNCIONES DEL CARRITO
// ========================================

function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

// Agregar producto al carrito (con validación de stock)
function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        // ── Validación de stock máximo ──
        const stockDisponible = product.stock ?? existingItem.stock ?? Infinity;
        if (existingItem.quantity >= stockDisponible) {
            showToast(
                `Solo hay <strong>${stockDisponible}</strong> unidad${stockDisponible !== 1 ? 'es' : ''} disponible${stockDisponible !== 1 ? 's' : ''} de <strong>${product.name}</strong>.`,
                'warning'
            );
            return;
        }
        existingItem.quantity += 1;
        // Guardar stock actualizado por si cambió
        existingItem.stock = stockDisponible;
    } else {
        if (product.stock !== undefined && product.stock <= 0) {
            showToast(`<strong>${product.name}</strong> está agotado.`, 'error');
            return;
        }
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock,
            quantity: 1
        });
    }

    saveCart(cart);
    console.log('[CART] Producto agregado:', product.name);
    showToast(`<strong>${product.name}</strong> agregado al carrito. 🛒`, 'success');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log('[CART] Producto eliminado');
}

// Actualizar cantidad (con validación de stock)
function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            const stockDisponible = item.stock ?? Infinity;
            if (quantity > stockDisponible) {
                showToast(
                    `Máximo <strong>${stockDisponible}</strong> unidad${stockDisponible !== 1 ? 'es' : ''} disponible${stockDisponible !== 1 ? 's' : ''}.`,
                    'warning'
                );
                item.quantity = stockDisponible;
            } else {
                item.quantity = quantity;
            }
            saveCart(cart);
        }
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartCount() {
    const count = getCartCount();
    document.querySelectorAll('.cart-count').forEach(badge => {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    console.log('[CART] Carrito vaciado');
}

// Mostrar carrito en tabla (para página de carrito)
function displayCart() {
    const cart = getCart();
    const cartTableBody = document.querySelector('#cartTable tbody');
    if (!cartTableBody) return;

    cartTableBody.innerHTML = '';

    cart.forEach(item => {
        const precioUnitario = Number(item.price) || 0;
        const subtotalFila = precioUnitario * item.quantity;
        const stockMax = item.stock ?? 999;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>₡${precioUnitario.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <input type="number" min="1" max="${stockMax}" value="${item.quantity}"
                       onchange="updateQuantity(${item.id}, parseInt(this.value, 10)); renderCartPage();">
            </td>
            <td>₡${subtotalFila.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <button onclick="removeFromCart(${item.id}); renderCartPage();" class="btn-remove">
                    Eliminar
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });
}

// Re-renderizar página de carrito sin recargar la página completa
function renderCartPage() {
    const cart = getCart();
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoLleno = document.getElementById('carritoLleno');
    if (!carritoVacio || !carritoLleno) return;

    if (cart.length === 0) {
        carritoVacio.style.display = 'block';
        carritoLleno.style.display = 'none';
    } else {
        carritoVacio.style.display = 'none';
        carritoLleno.style.display = 'block';
        displayCart();
        actualizarResumen();
    }
}

function actualizarResumen() {
    const precioTotalConIVA = getCartTotal();
    const subtotalSinIVA = precioTotalConIVA / 1.13;
    const impuestoIVA = precioTotalConIVA - subtotalSinIVA;
    const formatoCR = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');

    if (subtotalEl) subtotalEl.textContent = `₡${subtotalSinIVA.toLocaleString('es-CR', formatoCR)}`;
    if (taxEl)      taxEl.textContent      = `₡${impuestoIVA.toLocaleString('es-CR', formatoCR)}`;
    if (totalEl)    totalEl.textContent    = `₡${precioTotalConIVA.toLocaleString('es-CR', formatoCR)}`;
}

// Inicializar contador al cargar
window.addEventListener('load', updateCartCount);
