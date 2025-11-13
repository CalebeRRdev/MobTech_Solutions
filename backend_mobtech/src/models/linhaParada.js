module.exports = (sequelize, DataTypes) => {
    const LinhaParada = sequelize.define('LinhaParada', {
        linha_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        parada_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        sequencia: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sentido: {
            type: DataTypes.ENUM('ida', 'volta'),
            allowNull: true
        }
    }, {
        tableName: 'linha_parada',
        timestamps: false
    })

    return LinhaParada
}
