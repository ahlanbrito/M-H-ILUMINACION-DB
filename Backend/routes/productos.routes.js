const router = require('express').Router();
const productosController = require('../controllers/productos.controller');

router.get('/', productosController.getAllProducts); // Ruta para obtener todos los productos
router.get('/search', productosController.searchProducts); // NUEVO: Ruta para buscar productos
router.get('/:id', productosController.getProductById); // Ruta para obtener un producto por ID

module.exports = router;
