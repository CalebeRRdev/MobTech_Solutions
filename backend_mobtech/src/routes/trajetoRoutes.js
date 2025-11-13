const express = require('express');
const router = express.Router();
const trajetoController = require('../controllers/trajetoController');

router.get('/:linhaId', trajetoController.getTrajetoPorLinha);

module.exports = router;
