const Carrito = require('../models/carrito.model'); // Importar el modelo Carrito

exports.agregar = async (req, res) => {
    const { userId, productoId, cantidad } = req.body;

    if (!userId || !productoId || !cantidad || cantidad <= 0) {
        return res.status(400).json({ message: 'Datos de entrada inválidos.' });
    }

    try {
        const result = await Carrito.agregarProducto(userId, productoId, cantidad);
        // Redirigir o indicar al frontend que redirija a la página del carrito
        res.status(200).json({ ...result, redirectTo: '/paginas/carrito.html' });
    } catch (error) {
        console.error('Error al agregar/actualizar producto en el carrito:', error);
        // Devolver un mensaje de error más específico si es de stock
        if (error.message.includes('excede el stock disponible')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al agregar al carrito.', error: error.message });
    }
};

exports.obtener = async (req, res) => {
    const { userId } = req.params;
    try {
        const items = await Carrito.obtenerProductos(userId);
        res.status(200).json(items);
    } catch (error) {
        console.error('Error al obtener productos del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el carrito.', error: error.message });
    }
};

exports.actualizar = async (req, res) => {
    const { userId, productoId, cantidad } = req.body;
    if (!userId || !productoId || cantidad === undefined) { // Cantidad puede ser 0 para eliminar
        return res.status(400).json({ message: 'Datos de entrada inválidos.' });
    }
    try {
        const success = await Carrito.actualizarCantidad(userId, productoId, cantidad);
        if (success) {
            res.status(200).json({ message: 'Cantidad de producto actualizada.' });
        } else {
            res.status(404).json({ message: 'Producto no encontrado en el carrito para actualizar.' });
        }
    } catch (error) {
        console.error('Error al actualizar cantidad del carrito:', error);
        if (error.message.includes('excede el stock disponible')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el carrito.', error: error.message });
    }
};

exports.eliminar = async (req, res) => {
    const { userId, productoId } = req.body; // Usar req.body para DELETE si se envía así
    if (!userId || !productoId) {
        return res.status(400).json({ message: 'Datos de entrada inválidos.' });
    }
    try {
        const success = await Carrito.eliminarProducto(userId, productoId);
        if (success) {
            res.status(200).json({ message: 'Producto eliminado del carrito.' });
        } else {
            res.status(404).json({ message: 'Producto no encontrado en el carrito para eliminar.' });
        }
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar del carrito.', error: error.message });
    }
};
