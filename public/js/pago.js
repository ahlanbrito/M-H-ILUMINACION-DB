// Global variable to store the logged-in user's ID.
let currentLoggedInUser = null; // Will store { userId, email, nombre_usuario, rol }
let cartItemsForPayment = []; // Stores items fetched from sessionStorage

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
    console.log('Initial session status (pago.js):', currentLoggedInUser);
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


// Function to load payment details from sessionStorage and display them
function loadPaymentDetails() {
    console.log('loadPaymentDetails: Attempting to load cart data from sessionStorage.');
    const cartData = sessionStorage.getItem('cartToProcess');
    
    if (!cartData) {
        console.error('loadPaymentDetails: No cart data found in sessionStorage (cartToProcess).');
        alert('No hay productos en el carrito para procesar el pago. Redirigiendo al carrito.');
        window.location.href = 'carrito.html';
        return;
    }

    try {
        cartItemsForPayment = JSON.parse(cartData);
        console.log('loadPaymentDetails: Cart items parsed:', cartItemsForPayment);
    } catch (e) {
        console.error('loadPaymentDetails: Error parsing cart data from sessionStorage:', e);
        alert('Error al cargar la información del carrito. Redirigiendo al carrito.');
        window.location.href = 'carrito.html';
        return;
    }


    const orderItemsSummaryContainer = document.getElementById('order-items-summary');
    if (!orderItemsSummaryContainer) {
        console.error('loadPaymentDetails: Element #order-items-summary not found.');
        return;
    }
    orderItemsSummaryContainer.innerHTML = ''; // Clear previous content

    let subtotal = 0;

    if (cartItemsForPayment.length === 0) {
        orderItemsSummaryContainer.innerHTML = '<p>No hay ítems en el carrito.</p>';
        console.warn('loadPaymentDetails: cartItemsForPayment is empty.');
    } else {
        cartItemsForPayment.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            subtotal += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('order-item');
            itemDiv.innerHTML = `
                <span>${item.titulo} (${item.cantidad} x $${item.precio.toFixed(2)})</span>
                <span>$${itemTotal.toFixed(2)}</span>
            `;
            orderItemsSummaryContainer.appendChild(itemDiv);
        });
    }

    const shippingCost = subtotal > 100 ? 0 : 15; // Same shipping logic as carrito.js
    const totalOrder = subtotal + shippingCost;

    console.log(`loadPaymentDetails: Calculated: Subtotal=$${subtotal.toFixed(2)}, Shipping=$${shippingCost.toFixed(2)}, Total=$${totalOrder.toFixed(2)}`);

    const subtotalDisplay = document.getElementById('subtotal-display');
    const shippingDisplay = document.getElementById('shipping-display');
    const totalDisplay = document.getElementById('total-display');

    if (subtotalDisplay) {
        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        console.log('loadPaymentDetails: Subtotal display updated.');
    } else {
        console.error('loadPaymentDetails: Element #subtotal-display not found.');
    }

    if (shippingDisplay) {
        shippingDisplay.textContent = shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`;
        console.log('loadPaymentDetails: Shipping display updated.');
    } else {
        console.error('loadPaymentDetails: Element #shipping-display not found.');
    }

    if (totalDisplay) {
        totalDisplay.textContent = `$${totalOrder.toFixed(2)}`;
        console.log('loadPaymentDetails: Total display updated.');
    } else {
        console.error('loadPaymentDetails: Element #total-display not found.');
    }


    // Store calculated totals in sessionStorage for easy access during payment processing
    sessionStorage.setItem('paymentSummary', JSON.stringify({
        subtotal: subtotal,
        envio: shippingCost,
        total: totalOrder
    }));
    console.log('loadPaymentDetails: Payment summary saved to sessionStorage.');
}

// Function to process payment
async function realizarPago() {
    if (!currentLoggedInUser || !currentLoggedInUser.userId) {
        alert('Debes iniciar sesión para completar la compra.');
        window.location.href = 'Login.html';
        return;
    }

    if (cartItemsForPayment.length === 0) {
        alert('Tu carrito está vacío. No hay nada que pagar.');
        window.location.href = 'carrito.html';
        return;
    }

    const paymentSummary = JSON.parse(sessionStorage.getItem('paymentSummary'));
    if (!paymentSummary) {
        alert('Error al obtener el resumen del pago. Por favor, vuelve al carrito.');
        window.location.href = 'carrito.html';
        return;
    }

    // Get selected payment method (optional, for future expansion)
    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!selectedPaymentMethod) {
        alert('Por favor, selecciona un método de pago.');
        return;
    }
    console.log('Método de pago seleccionado:', selectedPaymentMethod.value);


    const confirmPayment = confirm(`Estás a punto de pagar $${paymentSummary.total.toFixed(2)}. ¿Confirmar?`);
    if (!confirmPayment) {
        return;
    }

    // Prepare data for backend
    const purchaseData = {
        userId: currentLoggedInUser.userId,
        subtotal: paymentSummary.subtotal,
        envio: paymentSummary.envio,
        total: paymentSummary.total,
        items: cartItemsForPayment.map(item => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio // Use the price fetched from DB in carrito.js
        }))
    };
    console.log('Datos de compra a enviar:', purchaseData);

    try {
        const response = await fetch('/api/compras/procesar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData),
        });

        // Check if the response is OK (status 2xx) before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text(); // Read as text to see the HTML error
            console.error('Error HTTP al procesar el pago. Respuesta del servidor (HTML/Texto):', errorText);
            // Attempt to parse as JSON in case it's a JSON error with a non-200 status
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || 'Error desconocido del servidor.');
            } catch (e) {
                // If it's not JSON, throw the original text error
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}. Contenido: ${errorText.substring(0, 100)}...`);
            }
        }

        const result = await response.json(); // Now this should only run if response.ok is true

        alert(result.message + ` ID de Compra: ${result.id_compra}`);
        console.log('Compra exitosa:', result);

        // Clear cart data from sessionStorage and localStorage (header count)
        sessionStorage.removeItem('cartToProcess');
        localStorage.removeItem('carrito'); // Clear local cart for header count
        updateHeaderUserStatus(); // Update header cart count to 0

        // Optionally, provide a link to the generated invoice
        if (result.facturaPath) {
            alert(`Factura generada y disponible en: ${result.facturaPath}.`);
            // You can open it in a new tab or provide a download link
            // window.open(result.facturaPath, '_blank');
        }

        // Redirect to a confirmation page or home
        window.location.href = '../index.html'; // Or a dedicated success page
    } catch (error) {
        console.error('Error al procesar el pago (frontend catch):', error);
        alert(`Ocurrió un error al procesar el pago: ${error.message}`);
    }
}

// Attach event listener to the pay button
document.addEventListener('DOMContentLoaded', () => {
    initializeUserSession(); // Initialize user session
    loadPaymentDetails(); // Load details for display

    const payButton = document.getElementById('pay-button');
    if (payButton) {
        payButton.addEventListener('click', realizarPago);
    } else {
        console.error('Pay button (#pay-button) not found.');
    }
});
