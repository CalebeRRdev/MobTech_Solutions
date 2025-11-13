// src/routes/rotaRoutes.js
const express = require('express');
const router = express.Router();
const rotaController = require('../controllers/rotaController');

router.post('/', rotaController.buscarRotas);

module.exports = router;
