const QuienesSomos = require('../models/quienes.model'); // Importar el nuevo modelo

exports.getContenido = async (req, res) => {
    try {
        const data = await QuienesSomos.getQuienesSomosData();
        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: 'No se encontró información de "Quiénes Somos".' });
        }
    } catch (error) {
        console.error('Error en el controlador de Quienes Somos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener contenido de "Quiénes Somos".', error: error.message });
    }
};
