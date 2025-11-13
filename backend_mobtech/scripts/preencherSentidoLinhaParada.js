// scripts/preencherSentidoLinhaParada.js
const { LinhaParada } = require('../src/models');

async function definirSentidoPorLinha() {
  const linhas = await LinhaParada.findAll({
    attributes: ['linha_id'],
    group: ['linha_id'],
    raw: true
  });

  for (const { linha_id } of linhas) {
    const paradas = await LinhaParada.findAll({
      where: { linha_id },
      order: [['sequencia', 'ASC']],
      raw: true
    });

    if (paradas.length === 0) continue;

    console.log(`🚌 Processando linha ${linha_id}...`);

    // Inicialmente, todas as paradas até a "virada" serão ida
    let sentidoAtual = 'ida';

    for (let i = 0; i < paradas.length; i++) {
      const atual = paradas[i];
      const anterior = paradas[i - 1];

      // Regra base: quando a sequência recomeça (ou parada_id diminui), muda o sentido
      if (i > 0 && atual.parada_id < anterior.parada_id) {
        sentidoAtual = 'volta';
      }

      await LinhaParada.update(
        { sentido: sentidoAtual },
        {
          where: {
            linha_id: atual.linha_id,
            parada_id: atual.parada_id
          }
        }
      );
    }

    console.log(`✅ Linha ${linha_id}: sentidos atribuídos.`);
  }

  console.log('🎯 Atualização de sentidos concluída com sucesso.');
}

definirSentidoPorLinha()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro ao preencher sentidos:', err);
    process.exit(1);
  });
