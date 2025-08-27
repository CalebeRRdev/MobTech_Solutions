const express = require('express')
const dotenv = require('dotenv')
const app = express()

app.use(express.json())
dotenv.config()

const port = process.env.PORTA

const usuarios = []

// Rota para listar todos os usuários cadastrados
// Rota: http://localhost:3000/usuarios
app.get('/usuarios', (requisicao, resposta) => {
    try {
        if (usuarios.length === 0){
            return resposta.status(200).json({mensagem: "Banco de dados vazio!"})
        } else {
            return resposta.status(200).json(usuarios)
        }
        
    } catch (error) {
        resposta.status(500).json({mensagem:"Erro ao listar usuários", erro: error.message})
    }
})

// ROTA para cadastrar usuários
// http://localhost:3000/usuarios
app.post('/usuarios', (requisicao, resposta) => {
    try {
        const {id, nome, cpf, cidade} = requisicao.body
        const novo_usuario = {id, nome, cpf, cidade}
        const usuario_existe = usuarios.some( usuario => usuario.cpf === cpf )

        if (usuario_existe) {
            return resposta.status(200).json({mensagem: "Esse usuário já existe!"})
        } else {
            usuarios.push(novo_usuario)
            return resposta.status(201).json({mensagem: "Usuário cadastrado com sucesso!"})
        }

    } catch (error) {
        resposta.status(500).json({mensagem:"Erro ao criar usuários", erro: error.message})
    }
})


app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`)
})