module.exports = (sequelize, DataTypes) => {
  const Parada = sequelize.define('Parada', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    localizacao: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false,
    },
  }, {
    tableName: 'paradas',
    timestamps: false,
  });

  return Parada;
};
