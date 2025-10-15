const { linha_onibus } = require(".");

const linhaPonto = (sequelize, DataTypes) => {
    const LinhaPonto = sequelize.define('LinhaPonto', {
        linhaPontoID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        linha_id: {
            type: DataTypes.INTEGER,
            references: {
            model: 'linha_onibus',
            key: 'linha_id'
            }
        },
        pontoID: {
            type: DataTypes.INTEGER,
            references: {
            model: 'pontoParada',
            key: 'pontoID'
            }
        },
        ordemParada: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
        }, {
        tableName: 'linhasPonto',
        freezeTableName: true, // Garante que o Sequelize não pluralize o nome da tabela
        timestamps: false
        })

        return LinhaPonto
};

module.exports = linhaPonto;