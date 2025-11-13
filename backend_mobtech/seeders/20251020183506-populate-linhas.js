'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const linhas = [
      {
        numero: 11,
        nome: 'TROPICAL',
      },
      {
        numero: 2,
        nome: 'FORMOSA / VIA SHELL',
      }
    ];

    await queryInterface.bulkInsert('linhas', linhas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('linhas', null, {});
  }
};