// mobtech/jest.config.cjs
module.exports = {
    // ambiente super simples
    testEnvironment: 'node',
  
    // onde procurar testes
    testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  
    // desativa qualquer transformação complicada
    transform: {},
  };