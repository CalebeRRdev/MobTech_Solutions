const express = require('express');
const router = express.Router();
const ParadaController = require('../controllers/paradaController');

router.get('/', ParadaController.listarParadas); // ✅ certo
// Rota de busca por nome
router.get('/buscar', ParadaController.buscarPorNome);
router.get('/:id', ParadaController.detalhesParada); // ✅ certo
router.get('/:id/linhas', ParadaController.listarLinhasDaParada)

module.exports = router;