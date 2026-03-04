const mysql = require('mysql2/promise');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

let pool;

if (process.env.MYSQL_URL) {
    pool = mysql.createPool(process.env.MYSQL_URL);
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}
module.exports = pool;