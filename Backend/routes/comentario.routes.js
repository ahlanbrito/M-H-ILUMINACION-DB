const router = require('express').Router();
const comentarioController = require('../controllers/comentario.controller');

// Ruta para añadir un nuevo comentario
router.post('/', comentarioController.addComment);

module.exports = router;
