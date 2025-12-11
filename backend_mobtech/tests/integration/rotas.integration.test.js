// backend_mobtech/tests/integration/rotas.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/sequelize');

jest.setTimeout(10000); // até 10s pra evitar timeout bobo

describe('Integração - /rotas (cálculo de rotas geoespaciais)', () => {
  // Fecha a conexão com o banco depois dos testes
  afterAll(async () => {
    await sequelize.close();
  });

  it('deve retornar pelo menos uma opção de rota para um par origem/destino válido', async () => {
    const payload = {
      origem: {
        latitude: -16.328,
        longitude: -48.953,
      },
      destino: {
        latitude: -16.33,
        longitude: -48.95,
      },
    };

    const inicio = Date.now();

    const res = await request(app)
      .post('/rotas')
      .send(payload);

    const fim = Date.now();
    const tempo = fim - inicio;

    console.log(
      '[Integração /rotas] status:',
      res.status,
      '| tempo(ms):',
      tempo
    );

    console.log(
      '[Integração /rotas] body:',
      JSON.stringify(res.body, null, 2)
    );

    // 1) Status tem que ser OK
    expect(res.status).toBe(200);

    // 2) Validar campos de alto nível
    expect(res.body).toHaveProperty('origem');
    expect(res.body).toHaveProperty('destino');
    expect(res.body).toHaveProperty('opcoes');

    const { origem, destino, opcoes } = res.body;

    expect(typeof origem).toBe('string');
    expect(typeof destino).toBe('string');

    // 3) opcoes deve ser um array com pelo menos 1 opção
    expect(Array.isArray(opcoes)).toBe(true);
    expect(opcoes.length).toBeGreaterThan(0);

    const primeira = opcoes[0];

    console.log(
      '[Integração /rotas] primeira opção:',
      JSON.stringify(primeira, null, 2)
    );

    // 4) Validar estrutura mínima da primeira opção
    expect(primeira).toHaveProperty('tipo'); // 'direta' ou 'baldeacao'
    expect(primeira).toHaveProperty('linhas');
    expect(primeira).toHaveProperty('distancia_ate_parada');
    expect(primeira).toHaveProperty('embarque_eta_minutos');
    expect(primeira).toHaveProperty('hora_prevista_chegada');

    expect(Array.isArray(primeira.linhas)).toBe(true);
    expect(primeira.linhas.length).toBeGreaterThan(0);

    expect(typeof primeira.distancia_ate_parada).toBe('number');
    expect(typeof primeira.embarque_eta_minutos).toBe('number');
    expect(typeof primeira.hora_prevista_chegada).toBe('string');
  });
});