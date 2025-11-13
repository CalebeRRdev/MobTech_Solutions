// src/routes/index.js
const express = require('express');
const router = express.Router();

const linhaRoutes = require('./linhaRoutes');
const paradaRoutes = require('./paradaRoutes');
const trajetoRoutes = require('./trajetoRoutes');
const localizacaoOnibusRoutes = require('./localizacaoOnibusRoutes');
const rotaRoutes = require('./rotaRoutes'); 

// Rota base para o módulo de linhas
router.use('/linhas', linhaRoutes);
router.use('/paradas', paradaRoutes);
router.use('/trajetos', trajetoRoutes);
router.use('/localizacaoOnibus', localizacaoOnibusRoutes);
router.use('/rotas', rotaRoutes);

module.exports = router




// const express = require('express');
// const router = express.Router();

// const linha_onibus_router = require('./linha_onibus')
// const pontoParada_router = require('./pontoParada')
// const linhaPonto_router = require('./linhaPonto')

// // router.get('/', (requisicao, resposta) => {
// //     resposta.send('todas as rotas aqui')
// // })

// router.use('/linha_onibus', linha_onibus_router)
// router.use('/pontoParada', pontoParada_router)
// router.use('/linhaPonto', linhaPonto_router)

// module.exports = router