const Producto = require('../models/producto.model');

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Producto.findAll();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error al obtener todos los productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.', error: error.message });
    }
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Producto.findById(id);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el producto.', error: error.message });
    }
};

// Buscar productos por término
exports.searchProducts = async (req, res) => {
    const { query } = req.query; // La consulta vendrá como un parámetro de query string (ej. /api/productos/search?query=lampara)
    console.log(`Buscando productos con el término: "${query}"`);
    try {
        const products = await Producto.search(query);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al buscar productos.', error: error.message });
    }
};
