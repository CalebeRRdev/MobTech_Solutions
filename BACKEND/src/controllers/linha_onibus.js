const { linha_onibus } = require('../models/index');
const { Op } = require('sequelize'); // Usado para operações como 'LIKE' (busca)

const LinhaOnibusControllers = {

    // Método para listar todas as linhas (ou filtrar por nome/número)
    listarLinhas: async (req, res) => {
        try {
            const { termo } = req.query; // Pega o termo de busca da URL (Ex: /linhas?termo=centro)
            const condicao = {};

            // Se um termo for fornecido, adiciona a condição de busca
            if (termo) {
                condicao[Op.or] = [
                    { nome: { [Op.iLike]: `%${termo}%` } }, // Busca por nome (case insensitive)
                    { numero: { [Op.iLike]: `%${termo}%` } } // Busca por número
                ];
            }

            const linhas = await linha_onibus.findAll({ where: condicao });
            
            // Retorna o status 200 (OK) e os dados em JSON
            return res.status(200).json(linhas);

        } catch (error) {
            console.error("Erro ao listar linhas:", error);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
    },

    // Método para buscar uma linha específica pelo ID
    buscarLinhaPorId: async (req, res) => {
        try {
            const { id } = req.params; // Pega o ID da URL (Ex: /linhas/1)
            
            const linha = await linha_onibus.findByPk(id);

            if (!linha) {
                return res.status(404).json({ error: "Linha não encontrada." });
            }

            // Retorna o status 200 (OK) e os dados em JSON
            return res.status(200).json(linha);
            
        } catch (error) {
            console.error("Erro ao buscar linha por ID:", error);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
    }
    
    // Outros métodos (criarLinha, atualizarLinha, deletarLinha, etc.) seriam adicionados aqui.
};

module.exports = LinhaOnibusControllers