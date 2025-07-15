const Compra = require('../models/compra.model');
const Carrito = require('../models/carrito.model');
const Producto = require('../models/producto.model');
const Usuario = require('../models/usuario.model'); // Para obtener datos del usuario para la factura
const { pool } = require('../models/db'); // *** ESTA ES LA LÍNEA CRÍTICA QUE FALTABA O ESTABA MAL UBICADA ***
const PDFDocument = require('pdfkit'); // Para generar PDF
const fs = require('fs'); // Para guardar el PDF

exports.procesarCompra = async (req, res) => {
    console.log('procesarCompra: Iniciando procesamiento de compra...');
    const { userId, subtotal, envio, total, items } = req.body;

    if (!userId || !items || items.length === 0 || total === undefined) {
        console.error('procesarCompra: Datos de compra inválidos recibidos:', { userId, subtotal, envio, total, items });
        return res.status(400).json({ message: 'Datos de compra inválidos.' });
    }
    console.log('procesarCompra: Datos de entrada válidos. userId:', userId, 'Total:', total);

    let connection; // Declare connection outside try block for finally access
    try {
        connection = await pool.getConnection(); // *** USAR EL 'pool' IMPORTADO DIRECTAMENTE AQUÍ ***
        console.log('procesarCompra: Conexión a la base de datos obtenida.');
        await connection.beginTransaction(); // Iniciar transacción
        console.log('procesarCompra: Transacción iniciada.');

        // Obtener la información completa del usuario desde la base de datos
        // Usamos userId que viene del frontend y el método findById del modelo Usuario
        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            console.error(`procesarCompra: Usuario con ID ${userId} no encontrado en la DB.`);
            throw new Error('Usuario no encontrado para procesar la compra.');
        }
        console.log('procesarCompra: Información del usuario obtenida:', usuario.nombre_usuario, usuario.email);

        // 1. Validar stock final y obtener precios reales (doble verificación de seguridad)
        let totalCalculado = 0;
        const itemsParaCompra = [];
        for (const item of items) {
            console.log(`procesarCompra: Verificando producto ID: ${item.id_producto}`);
            const productoDB = await Producto.findById(item.id_producto);
            if (!productoDB) {
                console.error(`procesarCompra: Producto con ID ${item.id_producto} no encontrado en la DB.`);
                throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
            }
            console.log(`procesarCompra: Producto ${productoDB.titulo} encontrado. Stock: ${productoDB.stock}, Solicitado: ${item.cantidad}`);

            if (productoDB.stock < item.cantidad) {
                console.error(`procesarCompra: Stock insuficiente para ${productoDB.titulo}. Disponible: ${productoDB.stock}, Solicitado: ${item.cantidad}`);
                throw new Error(`Stock insuficiente para el producto ${productoDB.titulo}. Disponible: ${productoDB.stock}, Solicitado: ${item.cantidad}`);
            }
            // Usar el precio real de la base de datos
            item.precio_unitario = parseFloat(productoDB.precio);
            totalCalculado += item.precio_unitario * item.cantidad;
            itemsParaCompra.push(item); // Usar los items con precios reales
        }
        console.log('procesarCompra: Validación de stock y precios completada. Total calculado hasta ahora:', totalCalculado);

        // Añadir costo de envío al total calculado
        totalCalculado += parseFloat(envio);
        console.log('procesarCompra: Total calculado con envío:', totalCalculado);


        // Opcional: Comparar totalCalculado con el total enviado desde el frontend para evitar manipulaciones
        if (Math.abs(totalCalculado - parseFloat(total)) > 0.01) { // Pequeña tolerancia para flotantes
            console.error(`procesarCompra: Discrepancia en el total. Frontend: ${total}, Backend: ${totalCalculado}`);
            throw new Error('Discrepancia en el total de la compra. Por favor, inténtalo de nuevo.');
        }

        // 2. Crear la compra en la tabla 'compras'
        console.log('procesarCompra: Creando compra en la tabla compras...');
        const id_compra = await Compra.createCompra(userId, totalCalculado, 'COMPLETADA'); // Estado 'COMPLETADA'
        console.log(`procesarCompra: Compra ${id_compra} creada para el usuario ${userId}`);

        // 3. Registrar cada producto en 'detalle_compra' y actualizar stock
        console.log('procesarCompra: Registrando detalles de compra y actualizando stock...');
        for (const item of itemsParaCompra) {
            await Compra.addDetalleCompra(id_compra, item.id_producto, item.cantidad, item.precio_unitario);
            await Producto.updateStock(item.id_producto, -item.cantidad); // Decrementar stock
            console.log(`procesarCompra: Detalle de compra para producto ${item.id_producto} añadido. Stock de ${item.id_producto} actualizado.`);
        }

        // 4. Limpiar el carrito del usuario
        console.log(`procesarCompra: Limpiando carrito del usuario ${userId}...`);
        await Carrito.clearCart(userId);
        console.log(`procesarCompra: Carrito del usuario ${userId} limpiado.`);

        // 5. Generar Comprobante (PDF)
        console.log('procesarCompra: Generando factura PDF...');
        // Ahora pasamos el objeto 'usuario' que ya obtuvimos de la base de datos
        const facturaPath = await generateInvoicePDF(id_compra, usuario, itemsParaCompra, subtotal, envio, totalCalculado);
        console.log(`procesarCompra: Factura generada en: ${facturaPath}`);

        await connection.commit(); // Confirmar transacción
        console.log('procesarCompra: Transacción confirmada (commit).');

        res.status(200).json({
            message: 'Compra procesada exitosamente.',
            id_compra: id_compra,
            facturaPath: facturaPath // Puedes devolver la ruta para que el cliente la descargue
        });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Revertir transacción en caso de error
            console.error('procesarCompra: Transacción revertida (rollback).');
        }
        console.error('procesarCompra: Error al procesar la compra:', error);
        // Asegúrate de que el mensaje de error sea JSON
        res.status(500).json({ message: 'Error al procesar la compra.', error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión
            console.log('procesarCompra: Conexión a la base de datos liberada.');
        }
    }
};

/**
 * Generates an invoice receipt in PDF format.
 * @param {number} id_compra - Purchase ID.
 * @param {object} usuario - User object ({nombre_usuario, email}).
 * @param {Array<object>} items - Array of purchased products ({titulo, cantidad, precio_unitario}).
 * @param {number} subtotal - Purchase subtotal.
 * @param {number} envio - Shipping cost.
 * @param {number} total - Final purchase total.
 * @returns {Promise<string>} The path to the generated PDF file.
 */
async function generateInvoicePDF(id_compra, usuario, items, subtotal, envio, total) {
    const doc = new PDFDocument();
    const fileName = `factura_${id_compra}.pdf`;
    const filePath = `./facturas/${fileName}`; // Directory to save invoices

    // Ensure the directory exists
    if (!fs.existsSync('./facturas')) {
        fs.mkdirSync('./facturas');
    }

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(25).text('Factura de Compra', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
        .text(`ID de Compra: ${id_compra}`)
        .text(`Fecha: ${new Date().toLocaleDateString()}`)
        .text(`Cliente: ${usuario ? usuario.nombre_usuario : 'N/A'}`)
        .text(`Email: ${usuario ? usuario.email : 'N/A'}`)
        .moveDown();

    doc.fontSize(15).text('Detalles del Pedido:', { underline: true }).moveDown();

    // Table headers
    doc.fontSize(10)
        .text('Producto', 50, doc.y, { width: 250, align: 'left' })
        .text('Cantidad', 300, doc.y, { width: 80, align: 'center' })
        .text('Precio Unitario', 380, doc.y, { width: 100, align: 'right' })
        .text('Subtotal', 490, doc.y, { width: 70, align: 'right' })
        .moveDown();

    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    items.forEach(item => {
        doc.text(item.titulo, 50, doc.y, { width: 250, align: 'left' })
            .text(item.cantidad.toString(), 300, doc.y, { width: 80, align: 'center' })
            .text(`$${item.precio_unitario.toFixed(2)}`, 380, doc.y, { width: 100, align: 'right' })
            .text(`$${(item.cantidad * item.precio_unitario).toFixed(2)}`, 490, doc.y, { width: 70, align: 'right' })
            .moveDown(0.5);
    });

    doc.moveDown();
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(12)
        .text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })
        .text(`Envío: ${envio === 0 ? 'Gratis' : `$${envio.toFixed(2)}`}`, { align: 'right' })
        .moveDown(0.5)
        .fontSize(14)
        .text(`Total del Pedido: $${total.toFixed(2)}`, { align: 'right', font: 'Helvetica-Bold' });

    doc.end();

    return filePath;
}
