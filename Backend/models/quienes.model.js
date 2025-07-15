const { pool } = require('./db'); // Importar el pool de conexiones

class QuienesSomos {
    constructor(id_info, titulo, descripcion, video_quienes_somos, subtitulo1, descripcion1, subtitulo2, descripcion2, subtitulo3, descripcion3) {
        this.id_info = id_info;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.video_quienes_somos = video_quienes_somos;
        this.subtitulo1 = subtitulo1;
        this.descripcion1 = descripcion1;
        this.subtitulo2 = subtitulo2;
        this.descripcion2 = descripcion2;
        this.subtitulo3 = subtitulo3;
        this.descripcion3 = descripcion3;
    }

    /**
     * Obtiene la única fila de información de la tabla quienes_somos.
     * Asume que solo habrá una entrada para la información "Quiénes Somos".
     * @returns {Promise<QuienesSomos|null>} El objeto QuienesSomos si se encuentra, de lo contrario null.
     */
    static async getQuienesSomosData() {
        try {
            const [rows] = await pool.query('SELECT * FROM quienes_somos LIMIT 1');
            if (rows.length === 0) {
                return null;
            }
            const row = rows[0];
            return new QuienesSomos(
                row.id_info,
                row.titulo,
                row.descripcion,
                row.video_quienes_somos,
                row.subtitulo1,
                row.descripcion1,
                row.subtitulo2,
                row.descripcion2,
                row.subtitulo3,
                row.descripcion3
            );
        } catch (error) {
            console.error('Error al obtener datos de Quienes Somos:', error);
            throw error; // Re-throw the error for the controller to handle
        }
    }

    // Puedes añadir métodos para actualizar esta información si fuera necesario en el futuro.
    // static async updateQuienesSomosData(data) { ... }
}

module.exports = QuienesSomos;
