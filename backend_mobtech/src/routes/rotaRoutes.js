// src/routes/rotaRoutes.js
const express = require('express');
const router = express.Router();
const rotaController = require('../controllers/rotaController');
const etaController = require('../controllers/etaController'); 

router.post('/', rotaController.buscarRotas);

// novo endpoint ETA
router.post('/eta', etaController.buscarEta);


module.exports = router;
