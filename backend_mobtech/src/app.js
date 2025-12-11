// backend_mobtech/src/app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes'); // vai pegar src/routes/index.js

const app = express();

app.use(cors());
app.use(express.json());

// Aqui entram TODAS as rotas reais da API (linha, parada, rotas, etc.)
app.use(routes);

// Rota simples de health-check (útil para teste rápido)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;