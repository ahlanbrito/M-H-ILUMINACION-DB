const { pool } = require('./db'); // Importar el pool de conexiones

class Comentario {
    constructor(id_comentario, usuario, correo, comentario, created_at) {
        this.id_comentario = id_comentario;
        this.usuario = usuario;
        this.correo = correo;
        this.comentario = comentario;
        this.created_at = created_at;
    }

    /**
     * Crea un nuevo comentario en la base de datos.
     * @param {string} usuario - El nombre del usuario que envía el comentario.
     * @param {string} correo - El correo electrónico del usuario.
     * @param {string} comentario - El texto del comentario.
     * @returns {Promise<Comentario>} El objeto Comentario creado con el ID generado.
     */
    static async createComment(usuario, correo, comentario) {
        try {
            const [result] = await pool.query(
                'INSERT INTO comentarios (usuario, correo, comentario) VALUES (?, ?, ?)',
                [usuario, correo, comentario]
            );
            return new Comentario(result.insertId, usuario, correo, comentario, new Date());
        } catch (error) {
            console.error('Error al crear comentario en la base de datos:', error);
            throw error;
        }
    }

    // Puedes añadir otros métodos como `getAllComments` si necesitas listar comentarios en el futuro
    // static async getAllComments() { ... }
}

module.exports = Comentario;
