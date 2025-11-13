module.exports = (sequelize, DataTypes) => {
    const LocalizacaoOnibus = sequelize.define('LocalizacaoOnibus', {
        onibus_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        localizacao: {
            type: DataTypes.GEOMETRY('POINT', 4326),
            allowNull: false
        },
        timestamp_atualizacao: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'localizacao_onibus',
        timestamps: false
    })

    return LocalizacaoOnibus
}
