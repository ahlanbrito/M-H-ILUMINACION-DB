const { pool } = require('./db');
const bcrypt = require('bcryptjs'); // Asegúrate de que esto esté aquí si se usa en otros modelos

class Producto {
    constructor(id, titulo, imagen, precio, ratingCount, bestSeller, detalles, acercaDe, id_categoria, stock) {
        this.id = id;
        this.titulo = titulo;
        this.imagen = imagen;
        this.precio = parseFloat(precio);
        this.ratingCount = ratingCount;
        this.bestSeller = bestSeller;
        this.detalles = detalles;
        this.acercaDe = acercaDe;
        this.id_categoria = id_categoria;
        this.stock = stock;
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM productos');
        return rows.map(row => {
            row.detalles = row.detalles ? JSON.parse(row.detalles) : {};
            row.acercaDe = row.acercaDe ? JSON.parse(row.acercaDe) : [];
            return new Producto(
                row.id,
                row.titulo,
                row.imagen,
                row.precio,
                row.ratingCount,
                row.bestSeller,
                row.detalles,
                row.acercaDe,
                row.id_categoria,
                row.stock
            );
        });
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        row.detalles = row.detalles ? JSON.parse(row.detalles) : {};
        row.acercaDe = row.acercaDe ? JSON.parse(row.acercaDe) : [];
        return new Producto(
            row.id,
            row.titulo,
            row.imagen,
            row.precio,
            row.ratingCount,
            row.bestSeller,
            row.detalles,
            row.acercaDe,
            row.id_categoria,
            row.stock
        );
    }

    static async count() {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM productos');
        return rows[0].count;
    }

    static async create(productData) {
        const { titulo, imagen, precio, ratingCount, bestSeller, detalles, acercaDe, id_categoria, stock } = productData;
        const stringifiedDetalles = JSON.stringify(detalles || {});
        const stringifiedAcercaDe = JSON.stringify(acercaDe || []);
        const numericPrecio = parseFloat(precio);
        if (isNaN(numericPrecio)) {
            throw new Error('Precio inválido: no es un número.');
        }

        const [result] = await pool.query(
            'INSERT INTO productos (titulo, imagen, precio, ratingCount, bestSeller, detalles, acercaDe, id_categoria, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [titulo, imagen, numericPrecio, ratingCount, bestSeller, stringifiedDetalles, stringifiedAcercaDe, id_categoria, stock || 0]
        );
        return { id: result.insertId, ...productData };
    }

    static async getStock(id_producto) {
        const [rows] = await pool.query('SELECT stock FROM productos WHERE id = ?', [id_producto]);
        if (rows.length === 0) {
            return null;
        }
        return rows[0].stock;
    }

    static async updateStock(id_producto, cantidad) {
        const [result] = await pool.query(
            'UPDATE productos SET stock = stock + ? WHERE id = ?',
            [cantidad, id_producto]
        );
        return result.affectedRows > 0;
    }

    /**
     * Busca productos por título.
     * @param {string} query - El término de búsqueda.
     * @returns {Promise<Array<Producto>>} Un array de objetos Producto que coinciden con la búsqueda.
     */
    static async search(query) {
        const searchTerm = `%${query.toLowerCase()}%`; // Convertir a minúsculas para búsqueda insensible a mayúsculas/minúsculas
        const [rows] = await pool.query(
            'SELECT * FROM productos WHERE LOWER(titulo) LIKE ?',
            [searchTerm]
        );
        return rows.map(row => {
            row.detalles = row.detalles ? JSON.parse(row.detalles) : {};
            row.acercaDe = row.acercaDe ? JSON.parse(row.acercaDe) : [];
            return new Producto(
                row.id,
                row.titulo,
                row.imagen,
                row.precio,
                row.ratingCount,
                row.bestSeller,
                row.detalles,
                row.acercaDe,
                row.id_categoria,
                row.stock
            );
        });
    }
}

module.exports = Producto;
