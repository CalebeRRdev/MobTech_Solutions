// backend_mobtech/jest.config.cjs
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/config/**',    // se quiser ignorar configs
      '!src/**/index.js',  // ou outras coisas específicas
    ],
  };