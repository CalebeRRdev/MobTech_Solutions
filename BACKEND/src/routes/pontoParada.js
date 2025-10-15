const express = require('express');
const router = express.Router();

router.get('/', (requisicao, resposta) => {
    resposta.send('Lista de paradas de ônibus')
})

module.exports = router