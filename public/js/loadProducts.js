// Variable para almacenar los productos cargados
let loadedProducts = {};
let currentProductInModal = null; // Para el producto que se muestra en el modal

// Variable global para almacenar el ID del usuario logueado.
// Se inicializa al cargar la página.
let currentLoggedInUser = null; // Will store { userId, email, nombre_usuario, rol }

// Function to initialize the logged-in user's status when the page loads
function initializeUserSession() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const currentUserSession = sessionStorage.getItem('currentUser');

    if (rememberedUser) {
        currentLoggedInUser = JSON.parse(rememberedUser);
    } else if (currentUserSession) {
        currentLoggedInUser = JSON.parse(currentUserSession);
    } else {
        currentLoggedInUser = null; // No active session
    }
    updateHeaderUserStatus();
    console.log('Initial session status (loadProducts.js):', currentLoggedInUser);
}

// Function to update the header UI based on session status (copied from loadProducts.js)
function updateHeaderUserStatus() {
    const loginLink = document.getElementById('login-link');
    const userProfileDiv = document.getElementById('user-profile');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const cartCountElement = document.querySelector('.icon-link .count'); // Also update cart count in header

    if (currentLoggedInUser && currentLoggedInUser.nombre_usuario) {
        if (loginLink) loginLink.style.display = 'none';
        if (userProfileDiv) userProfileDiv.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${currentLoggedInUser.nombre_usuario}`;
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (userProfileDiv) userProfileDiv.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('rememberedUser');
            sessionStorage.removeItem('currentUser');
            currentLoggedInUser = null;
            updateHeaderUserStatus();
            // Clear local cart for header count as well
            localStorage.removeItem('carrito');
            if (cartCountElement) cartCountElement.textContent = '0';
            alert('You have logged out.');
            window.location.href = '../index.html'; // Or 'Login.html'
        };
    }
    // Update cart count in header based on localStorage 'carrito'
    const localCart = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItemsInLocalCart = localCart.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItemsInLocalCart;
    }
}


// Función para cargar productos desde el backend (ahora acepta un query)
async function loadProducts(searchQuery = '') {
    console.log(`Iniciando carga de productos con búsqueda: "${searchQuery}"`);
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) {
        console.error('Error: No se encontró el contenedor de productos (#products-container).');
        return;
    }
    productsContainer.innerHTML = ''; // Limpiar cualquier contenido existente
    loadedProducts = {}; // Reset loaded products cache

    let url = '/api/productos';
    if (searchQuery) {
        url = `/api/productos/search?query=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('Productos recibidos del backend:', products);

        if (products.length === 0) {
            productsContainer.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
            console.warn('La API de productos devolvió una lista vacía para la búsqueda.');
            return;
        }

        products.forEach(product => {
            loadedProducts[product.id] = product;
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.setAttribute('onclick', `abrirModal(${product.id})`);

            const img = document.createElement('img');
            img.src = `imagenes/${product.imagen}`;
            img.alt = product.titulo;
            img.onerror = () => { console.error(`Error al cargar imagen: ${img.src}`); };

            const p = document.createElement('p');
            p.classList.add('product-text');
            p.textContent = product.titulo;

            productDiv.appendChild(img);
            productDiv.appendChild(p);
            productsContainer.appendChild(productDiv);
        });
    } catch (error) {
        console.error("Error crítico al cargar los productos:", error);
        productsContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los productos en este momento. Por favor, inténtalo de nuevo más tarde.</p>';
    }
}

// Llama a las funciones al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initializeUserSession(); // Inicializa el estado de la sesión
    loadProducts(); // Carga todos los productos inicialmente

    // Event listener para el botón de búsqueda
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            loadProducts(query); // Llama a loadProducts con la consulta
        });

        // Opcional: Búsqueda al presionar Enter en el input
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const query = searchInput.value.trim();
                loadProducts(query);
            }
        });
    } else {
        console.error('Error: Elementos de búsqueda (input o botón) no encontrados.');
    }
});

// --- Funciones del modal y carrito (sin cambios en esta sección) ---

// This 'carrito' variable is for local UI update only, not the source of truth
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function abrirModal(productId) {
    console.log('abrirModal function called with productId:', productId);
    currentProductInModal = loadedProducts[productId];

    if (!currentProductInModal) {
        console.error("Error: Product not found in cache for ID:", productId);
        alert("Could not load product information.");
        return;
    }
    console.log('Current product in modal:', currentProductInModal);

    document.getElementById('modalProductTitle').textContent = currentProductInModal.titulo;
    document.getElementById('modalProductTitle').setAttribute('data-product-id', currentProductInModal.id);
    document.getElementById('ratingCount').textContent = currentProductInModal.ratingCount || "Sin calificaciones";
    document.getElementById('bestSellerBadge').textContent = currentProductInModal.bestSeller ? "✔️ " + currentProductInModal.bestSeller : "";
    document.getElementById('modalProductPrice').textContent = `$${currentProductInModal.precio.toFixed(2)}`;

    let detallesContainer = document.querySelector('.modal-contenido .product-details');
    if (!detallesContainer) {
        detallesContainer = document.createElement('div');
        detallesContainer.classList.add('product-details');
        document.getElementById('modalProductPrice').after(detallesContainer);
    }
    detallesContainer.innerHTML = '<h3>Product Details:</h3>';
    if (currentProductInModal.detalles && typeof currentProductInModal.detalles === 'object') {
        for (const key in currentProductInModal.detalles) {
            if (Object.hasOwnProperty.call(currentProductInModal.detalles, key)) {
                const p = document.createElement('p');
                p.textContent = `${key}: ${currentProductInModal.detalles[key]}`;
                detallesContainer.appendChild(p);
            }
        }
    } else {
        detallesContainer.innerHTML += '<p>No details available.</p>';
        console.warn('Product details are not a valid object:', currentProductInModal.detalles);
    }

    let acercaDeContainer = document.querySelector('.modal-contenido .product-about');
    if (!acercaDeContainer) {
        acercaDeContainer = document.createElement('div');
        acercaDeContainer.classList.add('product-about');
        detallesContainer.after(acercaDeContainer);
    }
    acercaDeContainer.innerHTML = '<h3>About this item:</h3><ul></ul>';
    const ul = acercaDeContainer.querySelector('ul');
    if (currentProductInModal.acercaDe && Array.isArray(currentProductInModal.acercaDe)) {
        currentProductInModal.acercaDe.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
    } else {
        acercaDeContainer.innerHTML += '<p>No "About" information available.</p>';
        console.warn('"About" information is not a valid array:', currentProductInModal.acercaDe);
    }

    document.getElementById('productQuantity').value = 1;
    document.getElementById('productColor').value = '';

    const modalElement = document.getElementById('modalProducto');
    if (modalElement) {
        modalElement.style.display = 'block';
        console.log('Modal display set to block.');
    } else {
        console.error('Error: Modal element (#modalProducto) not found.');
    }
}

function cerrarModal() {
    console.log('Closing modal...');
    const modalElement = document.getElementById('modalProducto');
    if (modalElement) {
        modalElement.style.display = 'none';
    }
    currentProductInModal = null;
}

function cambiarCantidad(cambio) {
    const quantityInput = document.getElementById('productQuantity');
    let currentQuantity = parseInt(quantityInput.value);
    currentQuantity += cambio;
    if (currentQuantity < 1) currentQuantity = 1;
    quantityInput.value = currentQuantity;
}

async function agregarAlCarrito() {
    console.log('Attempting to add to cart...');
    if (!currentProductInModal) {
        console.error("No product selected to add to cart.");
        alert("Please select a product to add to cart.");
        return;
    }

    // --- Session verification logic ---
    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        alert('You must log in to add products to the cart.');
        // Optional: Redirect to the login page
        // window.location.href = 'paginas/Login.html';
        return;
    }
    // --- End session verification logic ---

    const cantidad = parseInt(document.getElementById('productQuantity').value);
    const colorSeleccionado = document.getElementById('productColor').value;

    if (!colorSeleccionado) {
        alert('Please select a color for the product.');
        return;
    }

    const itemData = {
        userId: currentLoggedInUser.userId, // Use the logged-in user's ID
        productoId: currentProductInModal.id,
        cantidad: cantidad,
        // color: colorSeleccionado // Only if you add the 'color' field to your 'carrito' table
    };
    console.log('Data to send to cart:', itemData);

    try {
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        });

        const result = await response.json(); // Expecting JSON response with redirectTo

        if (response.ok) {
            alert(`¡${cantidad} unidades de ${currentProductInModal.titulo} (${colorSeleccionado}) añadidas al carrito con éxito!`);
            console.log('Server response when adding to cart:', result);

            // Update local cart for UI counter (still needed for header count)
            const itemExistente = carrito.find(item => item.id === currentProductInModal.id && item.color === colorSeleccionado);
            if (itemExistente) {
                itemExistente.cantidad += cantidad;
            } else {
                carrito.push({
                    id: currentProductInModal.id,
                    titulo: currentProductInModal.titulo,
                    imagen: currentProductInModal.imagen,
                    precio: currentProductInModal.precio,
                    cantidad: cantidad,
                    color: colorSeleccionado
                });
            }
            localStorage.setItem('carrito', JSON.stringify(carrito));
            updateCartCount();

            cerrarModal();
            // Redirigir a la página del carrito
            if (result.redirectTo) {
                window.location.href = result.redirectTo;
            }
        } else {
            throw new Error(result.message || 'Error desconocido al agregar al carrito.');
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        alert(`Ocurrió un error al agregar el producto al carrito: ${error.message}`);
    }
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.icon-link .count');
    if (cartCountElement) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        cartCountElement.textContent = totalItems;
        console.log('Cart counter updated to:', totalItems);
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('modalProducto');
    if (event.target == modal) {
        cerrarModal();
    }
}
