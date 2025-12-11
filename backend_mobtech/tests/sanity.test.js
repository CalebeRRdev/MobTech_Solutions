// backend_mobtech/tests/sanity.test.js
const sequelize = require('../src/config/sequelize');

describe('Sanidade do ambiente de testes', () => {
  it('2 + 2 deve ser 4 (sanity básico do Jest)', () => {
    expect(2 + 2).toBe(4);
  });

  it('deve conectar no banco de testes via Sequelize', async () => {
    // se não conseguir conectar, esse teste falha
    await expect(sequelize.authenticate()).resolves.toBeUndefined();
  });
});

// fecha a conexão após os testes para não ficar handle aberto
afterAll(async () => {
  await sequelize.close();
});