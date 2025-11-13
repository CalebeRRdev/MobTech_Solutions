const express = require('express');
const router = express.Router();
const linhaController = require('../controllers/linhaController');

router.get('/', linhaController.listarLinhas)
router.get('/:id', linhaController.obterLinhaPorId)
router.get('/:id/paradas', linhaController.listarParadasDaLinha);

module.exports = router
