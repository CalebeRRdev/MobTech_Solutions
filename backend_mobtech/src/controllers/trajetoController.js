const { LinhaParada, Parada } = require('../models');

module.exports = {
  async getTrajetoPorLinha(req, res) {
    try {
      const { linhaId } = req.params;

      const paradas = await LinhaParada.findAll({
        where: { linha_id: linhaId },
        include: [
          {
            model: Parada,
            attributes: ['id', 'nome', 'localizacao']
          }
        ],
        order: [['sequencia', 'sentido', 'ASC']]
      });

      if (!paradas || paradas.length === 0) {
        return res.status(404).json({ message: 'Nenhum trajeto encontrado para esta linha.' });
      }

      // Montar estrutura GeoJSON simplificada
      const pontos = paradas.map(item => ({
        id: item.Parada.id,
        nome: item.Parada.nome,
        latitude: item.Parada.localizacao.coordinates[1],
        longitude: item.Parada.localizacao.coordinates[0]
      }));

      res.status(200).json({
        linha_id: linhaId,
        total_pontos: pontos.length,
        pontos
      });
    } catch (error) {
      console.error('Erro ao buscar trajeto:', error);
      res.status(500).json({ message: 'Erro ao buscar trajeto.', error });
    }
  }
};
