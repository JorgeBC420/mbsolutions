// ========================================
// LÓGICA DEL PANEL DE ADMINISTRACIÓN
// ========================================

let currentEditingId = null;
let currentImageBase64 = "";
let products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];

document.addEventListener('DOMContentLoaded', () => {
    loadProductsList();
});

// ========================================
// MANEJO DE IMAGEN
// ========================================

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = function() {
        currentImageBase64 = reader.result;
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `<img src="${currentImageBase64}" style="width:100%; height:100%; object-fit:contain;">`;
        }
    };
    reader.readAsDataURL(file);
}

// ========================================
// CARGAR LISTA DE PRODUCTOS
// ========================================

function loadProductsList() {
    products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];
    const list = document.getElementById('productsList');
    
    if (!list) return;
    
    if (products.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--gray); padding: 2rem;">No hay productos agregados aún.</p>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="product-item">
            <div class="product-item-info">
                <h4>${p.name}</h4>
                <p>Código: ${p.code} | Categoría: ${p.category}</p>
                <p>Precio: ₡${parseInt(p.price).toLocaleString()} | Stock: ${p.stock}</p>
            </div>
            <div class="product-item-actions">
                <button onclick="editProduct(${p.id})" class="btn-small btn-edit">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProduct(${p.id})" class="btn-small btn-delete">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// EDITAR PRODUCTO
// ========================================

function editProduct(id) {
    currentEditingId = id;
    const product = products.find(p => p.id === id);
    
    if (!product) return;

    // Llenar el formulario con los datos del producto
    document.getElementById('productCode').value = product.code;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description;
    
    currentImageBase64 = product.image;
    const preview = document.getElementById('imagePreview');
    if (preview && product.image) {
        preview.innerHTML = `<img src="${product.image}" style="width:100%; height:100%; object-fit:contain;">`;
    }

    // Cambiar título del modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Producto';
    }

    // Mostrar el modal
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('active');
    }

    // Scroll al formulario
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// GUARDAR PRODUCTO (CREAR O EDITAR)
// ========================================

function saveProduct(e) {
    e.preventDefault();
    
    const productData = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        stock: document.getElementById('productStock').value,
        description: document.getElementById('productDescription').value,
        image: currentImageBase64 || 'images/placeholder.jpg'
    };

    products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];

    if (currentEditingId) {
        // Modo EDITAR
        const index = products.findIndex(p => p.id === currentEditingId);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Modo CREAR
        productData.id = Date.now();
        products.push(productData);
    }

    // Guardar en localStorage
    localStorage.setItem('mbsolutions_products', JSON.stringify(products));
    
    alert(currentEditingId ? "Producto actualizado correctamente" : "Producto creado correctamente");
    
    // Limpiar y recargar
    resetForm();
    loadProductsList();
    currentEditingId = null;
    currentImageBase64 = "";
}

// ========================================
// ELIMINAR PRODUCTO
// ========================================

function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    products = JSON.parse(localStorage.getItem('mbsolutions_products')) || [];
    products = products.filter(p => p.id !== id);
    
    localStorage.setItem('mbsolutions_products', JSON.stringify(products));
    
    alert("Producto eliminado correctamente");
    loadProductsList();
}

// ========================================
// LIMPIAR FORMULARIO
// ========================================

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '<p style="color: var(--gray);">La imagen aparecerá aquí</p>';
    currentImageBase64 = "";
    currentEditingId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Nuevo Producto';
    }
}

// ========================================
// CERRAR MODAL
// ========================================

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
    }
    resetForm();
}
