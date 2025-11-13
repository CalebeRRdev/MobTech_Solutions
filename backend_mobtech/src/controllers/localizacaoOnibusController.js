const { LocalizacaoOnibus, Onibus, Linha } = require('../models');

const localizacaoOnibusController = {
  // 📍 Atualiza ou registra a posição atual de um ônibus
  async atualizarLocalizacao(req, res) {
    try {
      const { onibus_id, latitude, longitude } = req.body;

      if (!onibus_id || !latitude || !longitude) {
        return res.status(400).json({ error: 'onibus_id, latitude e longitude são obrigatórios.' });
      }

      const localizacao = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      // Upsert (atualiza se já existe, cria se não existir)
      const [registro, created] = await LocalizacaoOnibus.upsert({
        onibus_id,
        localizacao,
        timestamp_atualizacao: new Date(),
      });

      res.status(created ? 201 : 200).json({
        message: created
          ? 'Localização registrada com sucesso.'
          : 'Localização atualizada com sucesso.',
        onibus_id,
        latitude,
        longitude,
      });
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar localização.' });
    }
  },

  // 🚌 Lista todas as localizações atuais dos ônibus
  async listarLocalizacoes(req, res) {
    try {
      const localizacoes = await LocalizacaoOnibus.findAll({
        include: [
          {
            model: Onibus,
            include: [{ model: Linha, attributes: ['id', 'numero', 'nome'] }],
            attributes: ['id', 'placa'],
          },
        ],
      });

      const resultado = localizacoes.map(loc => ({
        onibus_id: loc.onibus_id,
        placa: loc.Onibus.placa,
        linha: loc.Onibus.Linha.nome,
        numero_linha: loc.Onibus.Linha.numero,
        latitude: loc.localizacao.coordinates[1],
        longitude: loc.localizacao.coordinates[0],
        atualizado_em: loc.timestamp_atualizacao,
      }));

      res.json(resultado);
    } catch (error) {
      console.error('Erro ao listar localizações:', error);
      res.status(500).json({ error: 'Erro interno ao listar localizações.' });
    }
  },

  // 🚏 Retorna localização de um ônibus específico
  async buscarPorOnibus(req, res) {
    try {
      const { id } = req.params;

      const localizacao = await LocalizacaoOnibus.findOne({
        where: { onibus_id: id },
        include: [
          {
            model: Onibus,
            include: [{ model: Linha, attributes: ['id', 'numero', 'nome'] }],
            attributes: ['id', 'placa'],
          },
        ],
      });

      if (!localizacao) {
        return res.status(404).json({ error: 'Localização não encontrada para este ônibus.' });
      }

      res.json({
        onibus_id: localizacao.onibus_id,
        placa: localizacao.Onibus.placa,
        linha: localizacao.Onibus.Linha.nome,
        numero_linha: localizacao.Onibus.Linha.numero,
        latitude: localizacao.localizacao.coordinates[1],
        longitude: localizacao.localizacao.coordinates[0],
        atualizado_em: localizacao.timestamp_atualizacao,
      });
    } catch (error) {
      console.error('Erro ao buscar localização do ônibus:', error);
      res.status(500).json({ error: 'Erro interno ao buscar localização do ônibus.' });
    }
  },
};

module.exports = localizacaoOnibusController;
