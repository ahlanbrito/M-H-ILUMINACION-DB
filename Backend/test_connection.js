// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

// Importa el módulo mysql2
const mysql = require('mysql2/promise'); // Usamos la versión de promesas para async/await

async function testDatabaseConnection() {
  let connection;
  try {
    // Crea una conexión a la base de datos usando las variables de entorno
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: 3306 // Añadimos explícitamente el puerto, aunque es el predeterminado
    });

    console.log('✅ Conexión exitosa a la base de datos!');

    // Ejecuta la consulta SELECT * FROM productos
    const [rows, fields] = await connection.execute('SELECT * FROM productos');

    console.log('\n--- Productos encontrados ---');
    if (rows.length > 0) {
      console.table(rows); // Muestra los resultados en formato de tabla si hay productos
    } else {
      console.log('No se encontraron productos en la tabla "productos".');
    }

  } catch (error) {
    console.error('❌ Error al conectar o consultar la base de datos:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Asegúrate de que el nombre de la base de datos es correcto y existe.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Verifica el usuario y la contraseña de la base de datos.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EHOSTUNREACH') {
      console.error('   Verifica que el host sea correcto y esté accesible desde tu ubicación.');
    }
  } finally {
    // Cierra la conexión si existe
    if (connection) {
      await connection.end();
      console.log('\nDesconectado de la base de datos.');
    }
  }
}

// Llama a la función para ejecutar la prueba
testDatabaseConnection();