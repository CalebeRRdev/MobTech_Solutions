'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Intencionalmente vazio.
    // A coluna "sentido" já é definida no model LinhaParada
    // e será criada via sequelize.sync().
  },

  async down(queryInterface, Sequelize) {
    // Intencionalmente vazio.
  }
};