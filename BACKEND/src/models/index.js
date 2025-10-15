const sequelize = require('../config/sequelize')
const Sequelize = require('sequelize')

const Linha_onibus = require('./linha_onibus')
const PontoParada = require('./pontoParada')
const Rota = require('./rota')
const LinhaPonto = require('./linhaPonto')


const linha_onibus = Linha_onibus(sequelize, Sequelize.DataTypes)
const pontoParada = PontoParada(sequelize, Sequelize.DataTypes)
const rota = Rota(sequelize, Sequelize.DataTypes)
const linhaPonto = LinhaPonto(sequelize, Sequelize.DataTypes)

// Declaração dos objetos models após instanciação
const models = {
    linha_onibus,
    pontoParada,
    rota,
    linhaPonto,
};

// --- Configuração das Associações ---

// Defina associações APÓS instanciação, usando models.var
// LINHA 1:N ROTA
models.linha_onibus.hasMany(models.rota, { 
    foreignKey: 'linha_id', 
    sourceKey: 'linha_id', 
    as: 'rotas' 
});
models.rota.belongsTo(models.linha_onibus, { 
    foreignKey: 'linha_id', 
    targetKey: 'linha_id' 
});

// LINHA (N) <-> (N) PONTO_PARADA via LINHA_PONTO
linha_onibus.associate = (models) => {
    linha_onibus.belongsToMany(models.pontoParada, { 
        through: models.linhaPonto, 
        foreignKey: 'linha_id', 
        otherKey: 'pontoID', 
        as: 'pontosParada' 
    });
};
pontoParada.associate = (models) => {
    models.pontoParada.belongsToMany(models.linha_onibus, { 
        through: models.linhaPonto, 
        foreignKey: 'pontoID', 
        otherKey: 'linha_id', 
        as: 'linhasAtendidas' 
    });
};
linhaPonto.associate = (models) => {
    // Adicione constraints extras se necessário (ex.: unique [LinhaID, PontoID])
    models.linhaPonto.belongsTo(models.linha_onibus, { foreignKey: 'linha_id' });
    models.linhaPonto.belongsTo(models.pontoParada, { foreignKey: 'pontoID' });
};

const db = {
    linha_onibus,
    pontoParada,
    rota,
    linhaPonto,
    sequelize
}

module.exports = db