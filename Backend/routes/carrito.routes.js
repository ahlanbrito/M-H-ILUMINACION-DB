const router = require('express').Router();
const controller = require('../controllers/carrito.controller');

router.post('/agregar', controller.agregar);
router.get('/:userId', controller.obtener);
router.put('/actualizar', controller.actualizar);
router.delete('/eliminar', controller.eliminar);

module.exports = router;
