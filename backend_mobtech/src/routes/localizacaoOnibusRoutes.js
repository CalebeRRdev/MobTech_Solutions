const express = require('express');
const router = express.Router();
const localizacaoOnibusController = require('../controllers/localizacaoOnibusController');

// 📍 Registrar ou atualizar localização do ônibus
router.post('/', localizacaoOnibusController.atualizarLocalizacao);

// 🚌 Listar todas as localizações atuais
router.get('/', localizacaoOnibusController.listarLocalizacoes);

// 🚏 Buscar localização de um ônibus específico
router.get('/:id', localizacaoOnibusController.buscarPorOnibus);

module.exports = router;
