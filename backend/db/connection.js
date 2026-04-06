/*  creates a pool of reusable database connections. Instead of opening and closing a connection for every query, 
the pool keeps connections alive and reuses them — much more efficient for a web server. */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // add this line
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;