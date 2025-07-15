const { pool } = require('./db');
const Producto = require('./producto.model'); // Importar el modelo de Producto para stock

class Carrito {
    constructor(id_carrito, id_usuario, id_producto, cantidad) {
        this.id_carrito = id_carrito;
        this.id_usuario = id_usuario;
        this.id_producto = id_producto;
        this.cantidad = cantidad;
    }

    static async agregarProducto(id_usuario, id_producto, cantidad) {
        // 1. Obtener stock actual del producto
        const producto = await Producto.findById(id_producto);
        if (!producto) {
            throw new Error('Producto no encontrado.');
        }
        const stockDisponible = producto.stock;

        // 2. Verificar si el producto ya existe en el carrito para este usuario
        const [existingItem] = await pool.query(
            'SELECT * FROM carrito WHERE id_usuario = ? AND id_producto = ?',
            [id_usuario, id_producto]
        );

        let newCantidadEnCarrito = cantidad;
        if (existingItem.length > 0) {
            newCantidadEnCarrito += existingItem[0].cantidad;
        }

        // 3. Validar si la cantidad total en carrito excede el stock
        if (newCantidadEnCarrito > stockDisponible) {
            throw new Error(`Cantidad solicitada (${newCantidadEnCarrito}) excede el stock disponible (${stockDisponible}).`);
        }

        if (existingItem.length > 0) {
            // Si el producto ya existe, actualiza la cantidad
            const [result] = await pool.query(
                'UPDATE carrito SET cantidad = ? WHERE id_usuario = ? AND id_producto = ?',
                [newCantidadEnCarrito, id_usuario, id_producto]
            );
            return { message: 'Cantidad de producto actualizada en el carrito', id_carrito: existingItem[0].id_carrito };
        } else {
            // Si el producto no existe, insértalo
            const [result] = await pool.query(
                'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)',
                [id_usuario, id_producto, cantidad]
            );
            return { message: 'Producto agregado al carrito', id_carrito: result.insertId };
        }
    }

    static async obtenerProductos(id_usuario) {
        // Unir con la tabla de productos para obtener detalles y precio real
        const [rows] = await pool.query(
            `SELECT c.id_carrito, c.id_usuario, c.id_producto, c.cantidad,
                    p.titulo, p.imagen, p.precio, p.detalles, p.acercaDe, p.stock
             FROM carrito c
             JOIN productos p ON c.id_producto = p.id
             WHERE c.id_usuario = ?`,
            [id_usuario]
        );
        return rows.map(row => {
            row.detalles = row.detalles ? JSON.parse(row.detalles) : {};
            row.acercaDe = row.acercaDe ? JSON.parse(row.acercaDe) : [];
            row.precio = parseFloat(row.precio); // Ensure price is a number
            return row;
        });
    }

    static async actualizarCantidad(id_usuario, id_producto, nuevaCantidad) {
        if (nuevaCantidad <= 0) {
            return this.eliminarProducto(id_usuario, id_producto); // Eliminar si la cantidad es 0 o menos
        }

        // 1. Obtener stock actual del producto
        const producto = await Producto.findById(id_producto);
        if (!producto) {
            throw new Error('Producto no encontrado.');
        }
        const stockDisponible = producto.stock;

        // 2. Validar si la nueva cantidad excede el stock
        if (nuevaCantidad > stockDisponible) {
            throw new Error(`Cantidad solicitada (${nuevaCantidad}) excede el stock disponible (${stockDisponible}).`);
        }

        const [result] = await pool.query(
            'UPDATE carrito SET cantidad = ? WHERE id_usuario = ? AND id_producto = ?',
            [nuevaCantidad, id_usuario, id_producto]
        );
        return result.affectedRows > 0;
    }

    static async eliminarProducto(id_usuario, id_producto) {
        const [result] = await pool.query(
            'DELETE FROM carrito WHERE id_usuario = ? AND id_producto = ?',
            [id_usuario, id_producto]
        );
        return result.affectedRows > 0;
    }

    /**
     * Limpia todos los productos del carrito de un usuario.
     * @param {number} id_usuario - El ID del usuario.
     * @returns {Promise<boolean>} True si se eliminaron productos, false de lo contrario.
     */
    static async clearCart(id_usuario) {
        const [result] = await pool.query('DELETE FROM carrito WHERE id_usuario = ?', [id_usuario]);
        return result.affectedRows > 0;
    }
}

module.exports = Carrito;
