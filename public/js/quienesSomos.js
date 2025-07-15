// Global variable to store the logged-in user's ID.
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
    console.log('Initial session status (quienesSomos.js):', currentLoggedInUser);
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

// Function to load "Quiénes Somos" content from the backend
async function loadQuienesSomosContent() {
    console.log('Attempting to load Quienes Somos content from backend...');
    try {
        const response = await fetch('/api/quienes'); // Endpoint para obtener la información
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Quienes Somos data received:', data);

        // Populate HTML elements
        const tituloElement = document.getElementById('quienes-somos-titulo');
        const descripcionElement = document.getElementById('quienes-somos-descripcion');
        const videoElement = document.getElementById('quienes-somos-video');

        const subtitulo1Element = document.getElementById('subtitulo1');
        const descripcion1Element = document.getElementById('descripcion1');
        const subtitulo2Element = document.getElementById('subtitulo2');
        const descripcion2Element = document.getElementById('descripcion2');
        const subtitulo3Element = document.getElementById('subtitulo3');
        const descripcion3Element = document.getElementById('descripcion3');

        if (tituloElement) tituloElement.textContent = data.titulo || 'Quiénes Somos';
        if (descripcionElement) descripcionElement.textContent = data.descripcion || 'Descripción no disponible.';
        if (videoElement && data.video_quienes_somos) {
            videoElement.src = `../videos/${data.video_quienes_somos}`; // Assuming videos are in public/videos
            videoElement.load(); // Reload video source
        } else if (videoElement) {
            console.warn('No video path found for Quienes Somos or video element not found.');
            videoElement.src = ''; // Clear video source
        }

        if (subtitulo1Element) subtitulo1Element.textContent = data.subtitulo1 || 'Subtítulo 1';
        if (descripcion1Element) descripcion1Element.textContent = data.descripcion1 || 'Descripción 1 no disponible.';
        if (subtitulo2Element) subtitulo2Element.textContent = data.subtitulo2 || 'Subtítulo 2';
        if (descripcion2Element) descripcion2Element.textContent = data.descripcion2 || 'Descripción 2 no disponible.';
        if (subtitulo3Element) subtitulo3Element.textContent = data.subtitulo3 || 'Subtítulo 3';
        if (descripcion3Element) descripcion3Element.textContent = data.descripcion3 || 'Descripción 3 no disponible.';

    } catch (error) {
        console.error('Error al cargar el contenido de Quienes Somos:', error);
        // Display a fallback message if content fails to load
        const mainContainer = document.querySelector('.about-container');
        if (mainContainer) {
            mainContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar la información de "Quiénes Somos" en este momento. Por favor, inténtalo de nuevo más tarde.</p>';
        }
    }
}

// Call functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeUserSession(); // Initialize user session for header
    loadQuienesSomosContent(); // Load content from backend
});
