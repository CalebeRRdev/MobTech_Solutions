const express = require('express');
const router = express.Router();

const linha_onibus_router = require('./linha_onibus')
const paradas_router = require('./pontoParada')

// router.get('/', (requisicao, resposta) => {
//     resposta.send('todas as rotas aqui')
// })

router.use('/linha_onibus', linha_onibus_router)
router.use('/paradas', paradas_router)

module.exports = router