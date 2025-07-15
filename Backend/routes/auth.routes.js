const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register); // Ruta para el registro
router.post('/login', authController.login);     // Ruta para el inicio de sesión

module.exports = router;