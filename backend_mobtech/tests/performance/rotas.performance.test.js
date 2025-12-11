// backend_mobtech/tests/performance/rotas.performance.test.js
const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/sequelize');

// aumenta o timeout do Jest para este arquivo (30 segundos)
jest.setTimeout(30000);

describe('Desempenho - endpoint /rotas', () => {
  // fecha a conexão com o banco depois dos testes
  afterAll(async () => {
    await sequelize.close();
  });

  it('deve responder /rotas em média abaixo de 800 ms (5 chamadas)', async () => {
    const tempos = [];

    // corpo igual ao que o app React Native envia
    const payload = {
      origem: {
        latitude: -16.328, // pode ajustar depois pra um ponto “real” de Anápolis
        longitude: -48.953,
      },
      destino: {
        latitude: -16.330,
        longitude: -48.950,
      },
    };

    for (let i = 0; i < 5; i++) {
      const inicio = Date.now();

      const res = await request(app)
        .post('/rotas')
        .send(payload);

      const fim = Date.now();
      const tempo = fim - inicio;
      tempos.push(tempo);

      // garante que o endpoint respondeu OK
      expect(res.status).toBe(200);
    }

    const soma = tempos.reduce((acc, t) => acc + t, 0);
    const media = soma / tempos.length;

    console.log('Tempos individuais (ms):', tempos);
    console.log('Tempo médio (ms):', media);

    // meta de desempenho (ajusta se quiser ser mais ou menos rigoroso)
    expect(media).toBeLessThan(800);
  });
});