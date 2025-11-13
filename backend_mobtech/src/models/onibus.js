module.exports = (sequelize, DataTypes) => {
    const Onibus = sequelize.define('Onibus', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        placa: {
            type: DataTypes.STRING(8),
            unique: true,
            allowNull: false
        },
        linha_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'onibus',
        timestamps: false
    })

    return Onibus
}
