// backend_mobtech/index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const routers = require('./src/routes');
const { sequelize } = require('./src/models');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// 🔹 Logger simples pra ver se as requisições estão chegando
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// 🔹 Rota de saúde (pra testar se o servidor está respondendo)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 🔹 Rotas principais da API
app.use('/', routers);

// 🔹 Apenas testa a conexão com o banco (sem mexer em schema)
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Conectado com o banco de dados (sequelize.authenticate).');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no banco de dados:', err);
  });

// 🔹 Porta com fallback pra 3000 (caso PORTA não esteja definida no .env)
const port = process.env.PORTA || 3000;

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});