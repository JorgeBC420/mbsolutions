// ========================================
// CARRITO DE COMPRAS - localStorage
// ========================================

const CART_KEY = 'mb_carrito';

// Obtener carrito desde localStorage
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

// Guardar carrito en localStorage
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

// Agregar producto al carrito
function addToCart(product) {
    const cart = getCart();
    
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Si existe, aumentar cantidad
        existingItem.quantity += 1;
    } else {
        // Si no existe, agregarlo
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart(cart);
    console.log('[CART] Producto agregado:', product.name);
    alert(`${product.name} agregado al carrito`);
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log('[CART] Producto eliminado');
}

// Actualizar cantidad
function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
}

// Obtener total del carrito
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Obtener cantidad de items
function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Actualizar número de items en el UI
function updateCartCount() {
    const count = getCartCount();
    const cartBadge = document.querySelector('.cart-count');
    
    if (cartBadge) {
        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'inline-block';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

// Vaciar carrito
function clearCart() {
    localStorage.removeItem(CART_KEY);
    saveCart([]);
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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>₡${precioUnitario.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <input type="number" min="1" value="${item.quantity}" 
                       onchange="updateQuantity(${item.id}, parseInt(this.value, 10)); location.reload();">
            </td>
            <td>₡${subtotalFila.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <button onclick="removeFromCart(${item.id}); location.reload();" class="btn-remove">
                    Eliminar
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });
}
// Actualizar resumen extrayendo el IVA del precio total
function actualizarResumen() {
    const precioTotalConIVA = getCartTotal(); // total final con IVA
    
    // Cálculo inverso: extraer el 13% de IVA
    const subtotalSinIVA = precioTotalConIVA / 1.13;
    const impuestoIVA = precioTotalConIVA - subtotalSinIVA;
    
    const formatoCR = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');

    if (subtotalEl) {
        subtotalEl.textContent = `₡${subtotalSinIVA.toLocaleString('es-CR', formatoCR)}`;
    }
    if (taxEl) {
        taxEl.textContent = `₡${impuestoIVA.toLocaleString('es-CR', formatoCR)}`;
    }
    if (totalEl) {
        totalEl.textContent = `₡${precioTotalConIVA.toLocaleString('es-CR', formatoCR)}`;
    }
}
// Inicializar contador de carrito al cargar
window.addEventListener('load', updateCartCount);
