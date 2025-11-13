const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const routers = require('./src/routes');
const { sequelize } = require('./src/models');

const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());

app.use('/', routers);

sequelize.sync().then(() => {
    console.log(`Conectado com o banco de dados.`)
});

const port = process.env.PORTA;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
});