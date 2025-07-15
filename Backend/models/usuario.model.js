const { pool } = require('./db'); // Importar el pool de conexiones
const bcrypt = require('bcryptjs'); // Importar bcryptjs para hashing de contraseñas

class Usuario {
    constructor(id_usuario, email, clave, nombre_usuario, rol) {
        this.id_usuario = id_usuario;
        this.email = email;
        this.clave = clave; // Now it's 'clave'
        this.nombre_usuario = nombre_usuario; // Now it's 'nombre_usuario'
        this.rol = rol;
    }

    /**
     * Busca un usuario por su email.
     * @param {string} email - The user's email.
     * @returns {Promise<Usuario|null>} The Usuario object if found, otherwise null.
     */
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        return new Usuario(row.id_usuario, row.email, row.clave, row.nombre_usuario, row.rol);
    }

    /**
     * Busca un usuario por su ID.
     * @param {number} id_usuario - El ID del usuario.
     * @returns {Promise<Usuario|null>} El objeto Usuario si se encuentra, de lo contrario null.
     */
    static async findById(id_usuario) { // NUEVO MÉTODO
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        return new Usuario(row.id_usuario, row.email, row.clave, row.nombre_usuario, row.rol);
    }

    /**
     * Creates a new user in the database.
     * The password is hashed before saving.
     * @param {object} userData - Object with email, password (will be converted to clave), nombre_usuario and rol.
     * @returns {Promise<Usuario>} The created Usuario object with the generated ID.
     */
    static async create(userData) {
        const { email, password, nombre_usuario, rol } = userData;
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with 10 salt rounds

        const [result] = await pool.query(
            'INSERT INTO usuarios (email, clave, nombre_usuario, rol) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, nombre_usuario, rol]
        );
        return new Usuario(result.insertId, email, hashedPassword, nombre_usuario, rol);
    }

    /**
     * Compares a plain password with a hashed password.
     * @param {string} plainPassword - The plain (unhashed) password.
     * @param {string} hashedPassword - The hashed password stored in the DB (now 'clave').
     * @returns {Promise<boolean>} True if they match, false otherwise.
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Usuario;
