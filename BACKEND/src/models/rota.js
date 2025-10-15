const rota = (sequelize, DataTypes) => {
    const Rota = sequelize.define('Rota', {
        rotaID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        linha_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        direcao: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        seqOrdem: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
        }
    }, {
        tableName: 'rota', // Define o nome exato da tabela no banco de dados
        freezeTableName: true, // Garante que o Sequelize não pluralize o nome da tabela
        timestamps: false // Desabilita as colunas `createdAt` e `updatedAt`
    });

    return Rota;
};

module.exports = rota;