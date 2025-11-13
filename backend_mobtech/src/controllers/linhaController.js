const { Linha, Trajeto, Parada } = require('../models');
const { Sequelize } = require('sequelize');

async function listarLinhas(req, res) {
    try {
        const linhas = await Linha.findAll({
            attributes: ['id', 'numero', 'nome']
        });

        return res.json(linhas);
    } catch (error) {
        console.error('Erro ao listar linhas:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar linhas' });
    }
}

async function obterLinhaPorId(req, res) {
    try {
        const { id } = req.params;

        const linha = await Linha.findByPk(id, {
            attributes: ['id', 'numero', 'nome'] // <-- Apenas atributos da linha
        });

        if (!linha) {
            return res.status(404).json({ error: 'Linha não encontrada' });
        }

        return res.json(linha);
    } catch (error) {
        console.error('Erro ao buscar linha:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar linha' });
    }
}

async function listarParadasDaLinha(req, res) {
    try {
        const { id } = req.params;

        const linha = await Linha.findByPk(id, {
            include: [{
                model: Parada,
                attributes: ['id', 'nome', 'localizacao'],
                through: { attributes: ['sequencia', 'sentido'] },
            }],
        });

        if (!linha) {
            return res.status(404).json({ error: 'Linha não encontrada.' });
        }

        // Ordena as paradas pela sequência
        const paradasOrdenadas = linha.Paradas.sort(
            (a, b) => a.LinhaParada.sequencia - b.LinhaParada.sequencia
        );

        return res.json({
            linha: {
                id: linha.id,
                numero: linha.numero,
                nome: linha.nome,
                paradas: paradasOrdenadas
            }
        });
    } catch (error) {
        console.error('Erro ao listar paradas da linha:', error);
        return res.status(500).json({ error: 'Erro interno ao listar paradas da linha.' });
    }
}

module.exports = {
    listarLinhas,
    obterLinhaPorId,
    listarParadasDaLinha
};
