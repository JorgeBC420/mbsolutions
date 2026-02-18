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
    let total = 0;
    
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <input type="number" min="1" value="${item.quantity}" 
                       onchange="updateQuantity(${item.id}, this.value)">
            </td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <button onclick="removeFromCart(${item.id})" class="btn-remove">
                    Eliminar
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });
    
    // Actualizar total
    const totalElement = document.querySelector('#cartTotal');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

// Inicializar contador de carrito al cargar
window.addEventListener('load', updateCartCount);
