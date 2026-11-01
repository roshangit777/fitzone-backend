const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // DATE columns come back as 'YYYY-MM-DD' strings
  decimalNumbers: true,  // DECIMAL / SUM() come back as numbers, not strings
});

module.exports = pool;
