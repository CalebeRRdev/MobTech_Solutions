const linha_onibus = (sequelize, DataTypes) => {
    const Linha_onibus = sequelize.define('Linha_onibus', {
        linha_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        numero: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        tarifa: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true
        }
    }, {
        tableName: 'linha_onibus',
        freezeTableName: true,
        timestamps: false  
    })

    return Linha_onibus
}

module.exports = linha_onibus