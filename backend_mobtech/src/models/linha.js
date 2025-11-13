module.exports = (sequelize, DataTypes) => {
    const Linha = sequelize.define('Linha', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        numero: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'linhas',
        timestamps: false
    })

    return Linha
}
