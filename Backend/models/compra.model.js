const { pool } = require('./db');

class Compra {
    constructor(id_compra, id_usuario, fecha, total, estado) {
        this.id_compra = id_compra;
        this.id_usuario = id_usuario;
        this.fecha = fecha;
        this.total = total;
        this.estado = estado;
    }

    /**
     * Crea un nuevo registro de compra.
     * @param {number} id_usuario - ID del usuario que realiza la compra.
     * @param {number} total - Total de la compra.
     * @param {string} estado - Estado inicial de la compra (ej. 'PENDIENTE').
     * @returns {Promise<number>} El ID de la compra recién creada.
     */
    static async createCompra(id_usuario, total, estado = 'PENDIENTE') {
        const [result] = await pool.query(
            'INSERT INTO compras (id_usuario, total, estado) VALUES (?, ?, ?)',
            [id_usuario, total, estado]
        );
        return result.insertId;
    }

    /**
     * Añade un detalle de producto a una compra específica.
     * @param {number} id_compra - ID de la compra a la que se añade el detalle.
     * @param {number} id_producto - ID del producto comprado.
     * @param {number} cantidad - Cantidad del producto.
     * @param {number} precio_unitario - Precio unitario del producto en el momento de la compra.
     * @returns {Promise<number>} El ID del detalle de compra recién creado.
     */
    static async addDetalleCompra(id_compra, id_producto, cantidad, precio_unitario) {
        const [result] = await pool.query(
            'INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [id_compra, id_producto, cantidad, precio_unitario]
        );
        return result.insertId;
    }
}

module.exports = Compra;
