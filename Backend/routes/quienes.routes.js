const router = require('express').Router();
const controller = require('../controllers/quienes.controller');

router.get('/', controller.getContenido); // Asegúrate de que esta ruta esté activa
module.exports = router;