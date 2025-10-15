require('dotenv').config(); 

module.exports = {
    dialect: 'postgres',
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_NAME,
    username: process.env.PG_USER,
    password: process.env.PG_PASS,
}