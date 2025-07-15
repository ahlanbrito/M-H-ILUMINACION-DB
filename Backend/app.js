const express = require('express');
const path = require('path');
const cors = require('cors');
const { testDbConnection } = require('./models/db');
const Producto = require('./models/producto.model'); // Importar el modelo de Producto
// Cargar variables de entorno
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Probar la conexión a la base de datos al iniciar la aplicación
testDbConnection().then(async () => {
    // Verificar si la tabla de productos está vacía e insertar un producto por defecto
    try {
        const productCount = await Producto.count();
        if (productCount === 0) {
            console.log('La tabla de productos está vacía. Insertando producto por defecto...');
            const defaultProduct = {
                titulo: "Lámpara Colgante por Defecto",
                imagen: "f1.jpg", // Asegúrate de que esta imagen exista en public/imagenes
                precio: 35.50,
                ratingCount: "100,000 calificaciones",
                bestSeller: "más vendido en Lámparas de Interior",
                detalles: {
                    "Tipo de material": "Metal y Acrílico",
                    "Dimensiones": "30x30x150 cm",
                    "Fuente de luz": "LED integrado",
                    "Estilo": "Moderno"
                },
                acercaDe: [
                    "Diseño elegante y minimalista, ideal para salones y comedores.",
                    "Iluminación LED de bajo consumo con luz cálida.",
                    "Fácil de instalar y limpiar.",
                    "Construcción robusta con materiales de alta calidad."
                ],
                id_categoria: 1,
                stock: 50 // Añadir stock por defecto
            };
            await Producto.create(defaultProduct);
            console.log('Producto por defecto insertado exitosamente.');
        }
    } catch (error) {
        console.error('Error al verificar o insertar el producto por defecto:', error);
    }
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));
// Servir el directorio de facturas generadas
app.use('/facturas', express.static(path.join(__dirname, 'facturas')));


// Importar rutas
const authRoutes = require('./routes/auth.routes');
const carritoRoutes = require('./routes/carrito.routes');
const productosRoutes = require('./routes/productos.routes');
const quienesRoutes = require('./routes/quienes.routes');
const compraRoutes = require('./routes/compra.routes');
const comentarioRoutes = require('./routes/comentario.routes'); // NUEVO: Importar rutas de comentarios

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/quienes', quienesRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/comentarios', comentarioRoutes); // NUEVO: Usar rutas de comentarios

// Ruta para servir index.html (si el frontend es servido por el backend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Manejo de errores 404
app.use((req, res, next) => {
    console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`); // Log 404s
    res.status(404).send('Página no encontrada');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
