const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargar variables de entorno

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL exitosamente!');
        connection.release(); // Liberar la conexión
    } catch (error) {
        console.error('Error al conectar a la base de datos MySQL:', error);
        process.exit(1); // Salir de la aplicación si no se puede conectar
    }
}

module.exports = {
    pool,
    testDbConnection
};
