// backend_mobtech/tests/integration/linhas-paradas.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/sequelize');

describe('Integração básica - /linhas e /paradas', () => {
  // fecha a conexão depois de todos os testes
  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /linhas deve responder 200 e retornar um array com pelo menos 1 linha', async () => {
    const inicio = Date.now();

    const res = await request(app).get('/linhas');

    const fim = Date.now();
    const tempoMs = fim - inicio;

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const primeira = res.body[0];
    expect(primeira).toHaveProperty('id');
    expect(primeira).toHaveProperty('numero');
    expect(primeira).toHaveProperty('nome');

    console.log(
      '[Integração] /linhas -> quantidade:',
      res.body.length,
      ' | tempo(ms):',
      tempoMs
    );
  });

  it('GET /paradas deve responder 200 e retornar array com paradas geoespaciais (lat/lng)', async () => {
    const inicio = Date.now();

    const res = await request(app).get('/paradas');

    const fim = Date.now();
    const tempoMs = fim - inicio;

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const primeira = res.body[0];

    expect(primeira).toHaveProperty('id');
    expect(primeira).toHaveProperty('nome');

    // formato atual da sua API: latitude/longitude separados
    expect(primeira).toHaveProperty('lat');
    expect(primeira).toHaveProperty('lng');
    expect(typeof primeira.lat).toBe('number');
    expect(typeof primeira.lng).toBe('number');

    console.log(
      '[Integração] /paradas -> quantidade:',
      res.body.length,
      ' | tempo(ms):',
      tempoMs
    );
  });
});