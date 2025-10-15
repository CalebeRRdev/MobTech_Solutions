const express = require('express');
const router = express.Router();
const LinhaController = require('../controllers/linha_onibus');

// Rota 1: GET /api/v1/linhas
// Função: Listar todas as linhas ou buscar por nome/número.
// Exemplo: GET /api/v1/linhas?termo=centro
router.get('/', LinhaController.listarLinhas);

// Rota 2: GET /api/v1/linhas/:id
// Função: Buscar os detalhes de uma linha específica pelo seu ID.
// Exemplo: GET /api/v1/linhas/10
router.get('/:id', LinhaController.buscarLinhaPorId);

module.exports = router