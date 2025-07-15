const Usuario = require('../models/usuario.model'); // Importar el modelo de Usuario

/**
 * Registers a new user.
 * Checks if the email already exists before creating the user.
 */
exports.register = async (req, res) => {
    // We now expect 'password' from the frontend, which will be used for 'clave'
    const { email, password, nombre_usuario, rol } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const existingUser = await Usuario.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'This email is already registered.' });
        }

        // If no nombre_usuario is provided, use the part of the email before '@'
        const userNombre = nombre_usuario || email.split('@')[0];
        // If no rol is provided, assign a default role (e.g., 'cliente')
        const userRol = rol || 'cliente';

        const newUser = await Usuario.create({ email, password, nombre_usuario: userNombre, rol: userRol });

        res.status(201).json({
            message: 'User registered successfully.',
            userId: newUser.id_usuario,
            email: newUser.email,
            nombre_usuario: newUser.nombre_usuario, // Return nombre_usuario
            rol: newUser.rol
        });
    } catch (error) {
        console.error('Error in user registration:', error);
        res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
    }
};

/**
 * Logs in a user.
 * Checks for user existence and validates credentials.
 */
exports.login = async (req, res) => {
    const { email, password } = req.body; // The frontend still sends 'password'

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await Usuario.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        // Compare the provided password with the user's hashed 'clave'
        const isPasswordValid = await Usuario.comparePassword(password, user.clave);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        res.status(200).json({
            message: 'Login successful.',
            userId: user.id_usuario,
            email: user.email,
            nombre_usuario: user.nombre_usuario, // Return nombre_usuario
            rol: user.rol
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Internal server error during login.', error: error.message });
    }
};
