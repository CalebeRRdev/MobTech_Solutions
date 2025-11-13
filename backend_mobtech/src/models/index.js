const Sequelize = require('sequelize')
const sequelize = require('../config/sequelize')
const { Op } = Sequelize;

const LinhaModel = require('./Linha')
const ParadaModel = require('./Parada')
const LinhaParadaModel = require('./linhaParada')
const OnibusModel = require('./onibus')
const LocalizacaoOnibusModel = require('./localizacaoOnibus')

const Linha = LinhaModel(sequelize, Sequelize.DataTypes)
const Parada = ParadaModel(sequelize, Sequelize.DataTypes)
const LinhaParada = LinhaParadaModel(sequelize, Sequelize.DataTypes)
const Onibus = OnibusModel(sequelize, Sequelize.DataTypes)
const LocalizacaoOnibus = LocalizacaoOnibusModel(sequelize, Sequelize.DataTypes)

// 🔗 Relacionamentos
Linha.belongsToMany(Parada, { through: LinhaParada, foreignKey: 'linha_id', otherKey: 'parada_id' })
Parada.belongsToMany(Linha, { through: LinhaParada, foreignKey: 'parada_id', otherKey: 'linha_id' })

LinhaParada.belongsTo(Linha, { foreignKey: 'linha_id' });
LinhaParada.belongsTo(Parada, { foreignKey: 'parada_id' });

Linha.hasMany(Onibus, { foreignKey: 'linha_id' })
Onibus.belongsTo(Linha, { foreignKey: 'linha_id' })

Onibus.hasOne(LocalizacaoOnibus, { foreignKey: 'onibus_id' })
LocalizacaoOnibus.belongsTo(Onibus, { foreignKey: 'onibus_id' })

const db = {
    sequelize,
    Op,
    Linha,
    Parada,
    LinhaParada,
    Onibus,
    LocalizacaoOnibus
}

module.exports = db
