const router = require('express').Router();
const compraController = require('../controllers/compra.controller');

// Ruta para procesar la compra
router.post('/procesar', compraController.procesarCompra);

module.exports = router;
