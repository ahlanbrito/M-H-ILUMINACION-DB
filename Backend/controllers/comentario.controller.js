const Comentario = require('../models/comentario.model'); // Importar el modelo de Comentario

exports.addComment = async (req, res) => {
    const { nombre, correo, comentario } = req.body; // Los nombres de los campos deben coincidir con el frontend

    // Validación básica de los datos
    if (!nombre || !correo || !comentario) {
        return res.status(400).json({ success: false, message: 'Nombre, correo y comentario son campos requeridos.' });
    }

    try {
        const newComment = await Comentario.createComment(nombre, correo, comentario);
        res.status(201).json({ success: true, message: 'Comentario enviado exitosamente.', commentId: newComment.id_comentario });
    } catch (error) {
        console.error('Error en el controlador al añadir comentario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al enviar el comentario.', error: error.message });
    }
};
