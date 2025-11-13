// src/controllers/paradaController.js
const { Parada, Linha } = require('../models');
const { Op } = require('sequelize');

const ParadaController = {
  async listarParadas(req, res) {
    try {
      const paradas = await Parada.findAll();
      const formatadas = paradas.map(p => ({
        id: p.id,
        nome: p.nome,
        lat: p.localizacao.coordinates[1],
        lng: p.localizacao.coordinates[0]
    }));
    res.json(formatadas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar paradas' });
    }
    // try {
    //   const todasParadas = await Parada.findAll({
    //     attributes: ['id', 'nome', 'localizacao'],
    //     order: [['id', 'ASC']],
    //   });
    //   return res.status(200).json(todasParadas);
    // } catch (error) {
    //   console.error('Erro ao listar paradas:', error);
    //   return res.status(500).json({ error: 'Erro interno do servidor.' });
    // }
  },

  async detalhesParada(req, res) {
    try {
      const { id } = req.params;
      const parada = await Parada.findByPk(id);
      if (!parada) {
        return res.status(404).json({ message: 'Parada não encontrada.' });
      }
      return res.status(200).json(parada);
    } catch (error) {
      console.error('Erro ao buscar detalhes da parada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  async listarLinhasDaParada(req, res) {
    try {
      const { id } = req.params;
      const parada = await Parada.findByPk(id, {
        include: [{
          model: Linha,
          attributes: ['id', 'numero', 'nome'],
          through: { attributes: ['sequencia', 'sentido'] },
        }],
      });

      if (!parada) {
        return res.status(404).json({ error: 'Parada não encontrada.' });
      }

      const linhasOrdenadas = parada.Linhas
        ? parada.Linhas.sort((a, b) => a.LinhaParada.sequencia - b.LinhaParada.sequencia)
        : [];

      return res.status(200).json({
        parada: {
          id: parada.id,
          nome: parada.nome,
          linhas: linhasOrdenadas,
        },
      });
    } catch (error) {
      console.error('Erro ao listar linhas da parada:', error);
      return res.status(500).json({ error: 'Erro interno ao listar linhas da parada.' });
    }
  },

  async buscarPorNome(req, res) {
      try {
          const { nome } = req.query;

          if (!nome || nome.trim() === '') {
              return res.status(400).json({ error: 'Parâmetro "nome" é obrigatório para a busca.' });
          }

          const paradas = await Parada.findAll({
              where: {
                  nome: {
                      [Op.iLike]: `%${nome}%` // busca parcial, sem diferenciar maiúsculas/minúsculas
                  }
              },
              attributes: ['id', 'nome', 'localizacao'],
              order: [['nome', 'ASC']]
          });

          return res.json(paradas);
      } catch (error) {
          console.error('Erro ao buscar paradas pelo nome:', error);
          return res.status(500).json({ error: 'Erro interno ao buscar paradas.' });
      }
  }
};

module.exports = ParadaController;



// const { Sequelize } = require('sequelize');
// const { paradas, Linha } = require('../models');

// const ParadaController = {
//   // Listar todas as paradas
//   async listarParadas(req, res) {
//     try {
//       const todasParadas = await paradas.findAll({
//         attributes: ['id', 'nome', 'localizacao'],
//         order: [['id', 'ASC']],
//       });
//       return res.status(200).json(todasParadas);
//     } catch (error) {
//       console.error('Erro ao listar paradas:', error);
//       return res.status(500).json({ error: 'Erro interno do servidor.' });
//     }
//   },

//   // Detalhes de uma parada específica
//   async detalhesParada(req, res) {
//     try {
//       const { id } = req.params;
//       const parada = await paradas.findByPk(id);
//       if (!parada) {
//         return res.status(404).json({ message: 'Parada não encontrada.' });
//       }
//       return res.status(200).json(parada);
//     } catch (error) {
//       console.error('Erro ao buscar detalhes da parada:', error);
//       return res.status(500).json({ error: 'Erro interno do servidor.' });
//     }
//   },

//   // Listar linhas associadas a uma parada
//   async listarLinhasDaParada(req, res) {
//     try {
//       const { id } = req.params;

//       const parada = await paradas.findByPk(id, {
//         include: [{
//           model: Linha,
//           attributes: ['id', 'numero', 'nome'],
//           through: { attributes: ['sequencia'] },
//         }],
//       });

//       if (!parada) {
//         return res.status(404).json({ error: 'Parada não encontrada.' });
//       }

//       // Ordena linhas pela sequência (opcional)
//       const linhasOrdenadas = parada.Linhas ? parada.Linhas.sort((a, b) => a.LinhaParada.sequencia - b.LinhaParada.sequencia) : [];

//       return res.status(200).json({
//         parada: {
//           id: parada.id,
//           nome: parada.nome,
//           linhas: linhasOrdenadas,
//         },
//       });
//     } catch (error) {
//       console.error('Erro ao listar linhas da parada:', error);
//       return res.status(500).json({ error: 'Erro interno ao listar linhas da parada.' });
//     }
//   },
// };

// module.exports = ParadaController;