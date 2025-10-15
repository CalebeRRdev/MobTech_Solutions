const pontoParada = (sequelize, DataTypes) => {
    const PontoParada = sequelize.define ('PontoParada', {
        pontoID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        }
    }, {
        tableName: 'pontoParada',
        freezeTableName: true,
        timestamps: false 
    })

    return PontoParada
}

module.exports = pontoParada