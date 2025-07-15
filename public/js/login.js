document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('#login-form form');
    const registerForm = document.querySelector('#register-form form');
    const rememberCheckbox = document.getElementById('remember');

    // 1. Verify if there's a saved session when the page loads
    checkSessionStatus();

    // Handle user registration
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value; // Sent as 'password'
        const repeatPassword = document.getElementById('repeat-password').value;
        const nombre_usuario = email.split('@')[0]; // Use nombre_usuario for the table
        const rol = 'cliente'; // Assign a default role on the frontend if there's no field

        if (password !== repeatPassword) {
            alert('Passwords do not match.');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, nombre_usuario, rol }) // Send nombre_usuario and rol
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // After successful registration, redirect to the login page as requested
                window.location.href = 'login.html'; // Redirect to login.html
            } else {
                alert('Error registering: ' + data.message);
            }
        } catch (error) {
            console.error('Network or server error during registration:', error);
            alert('An error occurred during registration. Please try again later.');
        }
    });

    // Handle login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value; // Sent as 'password'
        const rememberMe = rememberCheckbox.checked;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                saveSession(data.userId, data.email, data.nombre_usuario, data.rol, rememberMe); // Pass nombre_usuario and rol
                window.location.href = '../index.html'; // Redirect to the main page
            } else {
                alert('Error logging in: ' + data.message);
            }
        } catch (error) {
            console.error('Network or server error during login:', error);
            alert('An error occurred during login. Please try again later.');
        }
    });

    // Function to save the user session
    function saveSession(userId, email, nombre_usuario, rol, rememberMe) {
        const userData = { userId, email, nombre_usuario, rol }; // Save nombre_usuario and rol
        sessionStorage.setItem('currentUser', JSON.stringify(userData)); // Session for tab duration
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify(userData)); // Persistent session
        } else {
            localStorage.removeItem('rememberedUser');
        }
    }

    // Function to check session status when login.html loads
    function checkSessionStatus() {
        const rememberedUser = localStorage.getItem('rememberedUser');
        const currentUser = sessionStorage.getItem('currentUser');

        let userToLoad = null;

        if (rememberedUser) {
            userToLoad = JSON.parse(rememberedUser);
            document.getElementById('login-email').value = userToLoad.email;
            rememberCheckbox.checked = true;
        } else if (currentUser) {
            userToLoad = JSON.parse(currentUser);
            document.getElementById('login-email').value = userToLoad.email;
        }

        // Optional: If the user is already logged in, redirect to index.html
        // if (userToLoad) {
        //     window.location.href = '../index.html';
        // }
    }

    // Tab system (already existing in your HTML)
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.form-content').forEach(form => form.classList.remove('active'));

            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-form`).classList.add('active');
        });
    });
});
