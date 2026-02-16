// ========================================
// LÓGICA DEL PANEL DE ADMINISTRACIÓN
// ========================================
// API_BASE se define en api-config.js
// Se adapta automáticamente según el dominio

let currentEditingId = null;
let currentImageBase64 = "";

document.addEventListener('DOMContentLoaded', () => {
    loadProductsList();
});

// ========================================
// OBTENER TOKEN DE AUTENTICACIÓN
// ========================================

function getAuthToken() {
    return localStorage.getItem('adminToken');
}

function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

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

async function loadProductsList() {
    try {
        const response = await fetch(`${API_BASE}/api/productos`);
        
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }

        const products = await response.json();
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
    } catch (error) {
        console.error('Error al cargar productos:', error);
        const list = document.getElementById('productsList');
        if (list) {
            list.innerHTML = '<p style="text-align:center; color: var(--error); padding: 2rem;">Error al cargar productos. Verifica que el servidor esté ejecutándose.</p>';
        }
    }
}

// ========================================
// EDITAR PRODUCTO
// ========================================

async function editProduct(id) {
    currentEditingId = id;
    
    try {
        const response = await fetch(`${API_BASE}/api/productos/${id}`);
        
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const product = await response.json();

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
    } catch (error) {
        console.error('Error al cargar producto:', error);
        alert('Error al cargar el producto');
    }
}

// ========================================
// GUARDAR PRODUCTO (CREAR O EDITAR)
// ========================================

async function saveProduct(e) {
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

    try {
        let response;
        let actionMessage;

        if (currentEditingId) {
            // Modo EDITAR
            response = await fetch(`${API_BASE}/api/productos/${currentEditingId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });
            actionMessage = 'actualizado';
        } else {
            // Modo CREAR
            response = await fetch(`${API_BASE}/api/productos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });
            actionMessage = 'creado';
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al guardar producto');
        }

        alert(`Producto ${actionMessage} correctamente`);
        
        // Limpiar y recargar
        resetForm();
        loadProductsList();
        currentEditingId = null;
        currentImageBase64 = "";
        closeProductModal();
    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert(`Error: ${error.message}`);
    }
}

// ========================================
// ELIMINAR PRODUCTO
// ========================================

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/productos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al eliminar producto');
        }

        alert("Producto eliminado correctamente");
        loadProductsList();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert(`Error: ${error.message}`);
    }
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
