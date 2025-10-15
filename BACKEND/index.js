const express = require('express')
const dotenv = require('dotenv')
const routers = require('./src/routes')
const { sequelize } = require('./src/models')

const app = express()

dotenv.config()
app.use(express.json())

const port = process.env.PORTA

sequelize.sync().then(() => {
    console.log(`Conectado com o banco de dados.`)
})

app.use('/', routers)

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})