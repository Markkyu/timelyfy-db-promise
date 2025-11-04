// const mysql = require("mysql");
// require("dotenv").config();

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// connection.connect((err) => {
//   if (err) throw err;
//   console.log("Database Connected");
// });

// module.exports = connection;

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // allows concurrency
  queueLimit: 0,
});

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Database Connected");
    connection.release();
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
  }
})();

module.exports = pool;
