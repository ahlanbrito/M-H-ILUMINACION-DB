// Global variable to store the logged-in user's ID.
let currentLoggedInUser = null; // Will store { userId, email, nombre_usuario, rol }

// This 'carrito' variable is for local UI update only, the source of truth is the backend
let carritoLocal = [];

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
    console.log('Initial session status (carrito.js):', currentLoggedInUser);
}

// Function to update the header UI based on session status (copied from loadProducts.js)
function updateHeaderUserStatus() {
    const loginLink = document.getElementById('login-link');
    const userProfileDiv = document.getElementById('user-profile');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');

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
            alert('You have logged out.');
            // Redirect to home or login page after logout
            window.location.href = '../index.html'; // Or 'Login.html'
        };
    }
}

// Function to fetch cart items from the backend
async function fetchCarritoFromBackend() {
    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        console.warn('No user logged in. Cannot fetch cart items.');
        // Display empty cart message or redirect to login
        const listaCarrito = document.getElementById('listaCarrito');
        listaCarrito.innerHTML = `
            <div class="carrito-vacio">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="10" cy="20.5" r="1"/><circle cx="18" cy="20.5" r="1"/>
                    <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/>
                </svg>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestros productos y encuentra lo que necesitas</p>
                <a href="../index.html" class="btn-seguir-comprando">Seguir comprando</a>
                <p><a href="Login.html">Inicia sesión</a> para ver o agregar productos a tu carrito.</p>
            </div>
        `;
        document.getElementById('resumenCarrito').innerHTML = ''; // Clear summary
        updateCartCount(); // Update header cart count to 0
        return;
    }

    try {
        const response = await fetch(`/api/carrito/${currentLoggedInUser.userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        carritoLocal = await response.json(); // Update local carrito with backend data
        console.log('Carrito recibido del backend:', carritoLocal);
        mostrarCarrito();
    } catch (error) {
        console.error("Error al cargar el carrito desde el backend:", error);
        const listaCarrito = document.getElementById('listaCarrito');
        listaCarrito.innerHTML = '<p>Lo sentimos, no pudimos cargar tu carrito en este momento. Por favor, inténtalo de nuevo más tarde.</p>';
        document.getElementById('resumenCarrito').innerHTML = ''; // Clear summary
    }
}

// Display cart items
function mostrarCarrito() {
    const listaCarrito = document.getElementById('listaCarrito');
    const resumenCarrito = document.getElementById('resumenCarrito');
    const totalItemsElement = document.getElementById('total-items');

    if (carritoLocal.length === 0) {
        listaCarrito.innerHTML = `
            <div class="carrito-vacio">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="10" cy="20.5" r="1"/><circle cx="18" cy="20.5" r="1"/>
                    <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/>
                </svg>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestros productos y encuentra lo que necesitas</p>
                <a href="../index.html" class="btn-seguir-comprando">Seguir comprando</a>
            </div>
        `;
        resumenCarrito.innerHTML = '';
        updateCartCount();
        return;
    }

    // Update total items count
    const totalItems = carritoLocal.reduce((total, item) => total + item.cantidad, 0);
    totalItemsElement.textContent = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`;

    // Display items
    listaCarrito.innerHTML = '';
    carritoLocal.forEach((item, index) => {
        const subtotalItem = item.precio * item.cantidad;
        const itemHTML = `
            <div class="item-carrito">
                <div class="item-imagen">
                    <img src="../imagenes/${item.imagen}" alt="${item.titulo}">
                </div>
                <div class="item-detalles">
                    <div class="item-info">
                        <h3 class="item-titulo">${item.titulo}</h3>
                        <div class="item-variantes">
                            <span class="item-color">Color: ${item.detalles.Color || 'N/A'}</span>
                            <!-- Assuming 'talla' might be in details or not used -->
                            <!-- <span class="item-talla">${item.talla || 'N/A'}</span> -->
                        </div>
                    </div>
                    <div class="item-precio">
                        <span class="precio-unitario">$${item.precio.toFixed(2)} c/u</span>
                        <span class="precio-total">$${subtotalItem.toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-controls">
                    <div class="cantidad-control">
                        <button class="btn-cantidad menos" onclick="cambiarCantidad(${item.id_producto}, -1)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="cantidad">${item.cantidad}</span>
                        <button class="btn-cantidad mas" onclick="cambiarCantidad(${item.id_producto}, 1)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                    <button class="btn-eliminar" onclick="eliminarItem(${item.id_producto})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        listaCarrito.innerHTML += itemHTML;
    });

    // Calculate totals
    const subtotal = carritoLocal.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envio = subtotal > 100 ? 0 : 15; // Example shipping logic
    const total = subtotal + envio;

    // Display summary
    resumenCarrito.innerHTML = `
        <div class="resumen-detalle">
            <div class="resumen-linea">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="resumen-linea">
                <span>Envío</span>
                <span>${envio === 0 ? 'Gratis' : `$${envio.toFixed(2)}`}</span>
            </div>
            <div class="resumen-total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
        <button class="btn-pagar" onclick="pagar()">Proceder al pago</button>
    `;

    // Update header cart count
    updateCartCount();
}

// Functions to handle cart changes
async function cambiarCantidad(productoId, cambio) {
    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        alert('Debes iniciar sesión para modificar el carrito.');
        return;
    }

    const itemIndex = carritoLocal.findIndex(item => item.id_producto === productoId);
    if (itemIndex === -1) {
        console.error('Producto no encontrado en el carrito local.');
        return;
    }

    const currentCantidad = carritoLocal[itemIndex].cantidad;
    const nuevaCantidad = currentCantidad + cambio;

    if (nuevaCantidad <= 0) {
        // If new quantity is 0 or less, confirm removal
        if (confirm('¿Estás seguro de que quieres eliminar este producto de tu carrito?')) {
            await eliminarItem(productoId);
        }
        return;
    }

    try {
        const response = await fetch('/api/carrito/actualizar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentLoggedInUser.userId,
                productoId: productoId,
                cantidad: nuevaCantidad
            }),
        });

        const result = await response.json();
        if (response.ok) {
            console.log('Cantidad actualizada en backend:', result.message);
            // Re-fetch cart to ensure UI is in sync with DB and stock validation
            await fetchCarritoFromBackend();
        } else {
            alert(`Error al actualizar cantidad: ${result.message}`);
            console.error('Error al actualizar cantidad:', result.message);
        }
    } catch (error) {
        console.error('Error de red al actualizar cantidad:', error);
        alert('Ocurrió un error al actualizar la cantidad. Por favor, inténtalo de nuevo más tarde.');
    }
}

async function eliminarItem(productoId) {
    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        alert('Debes iniciar sesión para eliminar productos del carrito.');
        return;
    }

    try {
        const response = await fetch('/api/carrito/eliminar', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentLoggedInUser.userId,
                productoId: productoId
            }),
        });

        const result = await response.json();
        if (response.ok) {
            console.log('Producto eliminado del backend:', result.message);
            // Re-fetch cart to ensure UI is in sync with DB
            await fetchCarritoFromBackend();
        } else {
            alert(`Error al eliminar producto: ${result.message}`);
            console.error('Error al eliminar producto:', result.message);
        }
    } catch (error) {
        console.error('Error de red al eliminar producto:', error);
        alert('Ocurrió un error al eliminar el producto. Por favor, inténtalo de nuevo más tarde.');
    }
}

function pagar() {
    if (carritoLocal.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
        return;
    }

    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        alert('Para continuar con la compra, primero debes iniciar sesión.');
        window.location.href = 'Login.html';
        return;
    }

    // Store cart data in sessionStorage to pass to pago.html
    sessionStorage.setItem('cartToProcess', JSON.stringify(carritoLocal));
    window.location.href = '../paginas/pago.html';
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.icon-link .count');
    if (cartCountElement) {
        const totalItems = carritoLocal.reduce((sum, item) => sum + item.cantidad, 0);
        cartCountElement.textContent = totalItems;
        console.log('Cart counter updated to:', totalItems);
    }
}

// Initial load when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeUserSession(); // Initialize user session
    fetchCarritoFromBackend(); // Fetch cart from backend
});
