// src/controllers/etaController.js

const { getEtaOptions } = require('../services/etaService');

async function buscarEta(req, res) {
  try {
    const { origemLat, origemLon, destinoLat, destinoLon } = req.body;

    // Validação básica
    if (
      origemLat === undefined || origemLon === undefined ||
      destinoLat === undefined || destinoLon === undefined
    ) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos. Informe: origemLat, origemLon, destinoLat, destinoLon' 
      });
    }

    const result = await getEtaOptions({ origemLat, origemLon, destinoLat, destinoLon });

    return res.json(result);

  } catch (err) {
    console.error('Erro crítico no ETA Controller:', err);
    return res.status(500).json({ 
        error: 'Erro ao calcular rota.',
        details: err.message 
    });
  }
}

module.exports = { buscarEta };