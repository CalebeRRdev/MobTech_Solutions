'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('linha_parada', 'sentido', {
      type: Sequelize.ENUM('ida', 'volta'),
      allowNull: true,
      after: 'sequencia' // opcional, apenas organiza a posição no schema
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('linha_parada', 'sentido');
  }
};
