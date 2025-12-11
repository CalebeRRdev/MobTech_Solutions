const path = require('path');
const dotenv = require('dotenv');

// escolhe qual arquivo .env carregar
const envFile =
  process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env';

// carrega as variáveis de ambiente a partir da raiz do backend
dotenv.config({
  path: path.resolve(__dirname, '..', '..', envFile),
});

// monta a config base a partir de DATABASE_URL ou dos campos PG_*
const buildConfig = () => {
  // se tiver DATABASE_URL, usa ela (caso do .env.test que você já criou)
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      logging: false,
    };
  }

  // fallback: usa as variáveis PG_* (seu .env atual)
  return {
    dialect: 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_NAME,
    username: process.env.PG_USER,
    password: process.env.PG_PASS,
    logging: false,
  };
};

const baseConfig = buildConfig();

module.exports = {
  development: { ...baseConfig },
  test: { ...baseConfig },
  production: { ...baseConfig },
};