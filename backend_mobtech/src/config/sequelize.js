const { Sequelize } = require('sequelize');
const configDatabase = require('./database');

// se não tiver NODE_ENV, assume 'development'
const env = process.env.NODE_ENV || 'development';
const currentConfig = configDatabase[env];

let sequelize;

// se vier url (DATABASE_URL), usa ela
if (currentConfig.url) {
  sequelize = new Sequelize(currentConfig.url, {
    dialect: currentConfig.dialect,
    logging: currentConfig.logging,
  });
} else {
  // fallback: usa os campos separados PG_*
  sequelize = new Sequelize(
    currentConfig.database,
    currentConfig.username,
    currentConfig.password,
    currentConfig
  );
}

module.exports = sequelize;