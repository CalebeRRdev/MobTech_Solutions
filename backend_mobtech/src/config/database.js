const dotenv = require('dotenv');
dotenv.config()
// module.exports = {
//     dialect: 'postgres',
//     host: process.env.PG_HOST,
//     port: process.env.PG_PORT,
//     database: process.env.PG_NAME,
//     username: process.env.PG_USER,
//     password: process.env.PG_PASS,
// }

const config = {
  dialect: 'postgres',
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_NAME,
  username: process.env.PG_USER,
  password: process.env.PG_PASS,
};

module.exports = {
  development: config,
  test: config,
  production: config
};