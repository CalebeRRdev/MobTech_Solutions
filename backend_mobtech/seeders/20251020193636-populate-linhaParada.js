'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Linha 011: pontos 1 ao 52
    const linha011 = Array.from({ length: 52 }, (_, i) => ({
      linha_id: 1,          // id da linha 011 (assumindo que seja 1)
      parada_id: i + 1,     // pontos de 1 a 52
      sequencia: i + 1
    }));

    // Linha 002: pontos 1,2; 53 ao 85; depois 49 ao 52
    const linha002 = [
      { linha_id: 2, parada_id: 1, sequencia: 1 },
      { linha_id: 2, parada_id: 2, sequencia: 2 },
      ...Array.from({ length: 33 }, (_, i) => ({
        linha_id: 2,
        parada_id: i + 53,      // pontos 53 a 85
        sequencia: i + 3
      })),
      ...[49, 50, 51, 52].map((ponto, idx) => ({
        linha_id: 2,
        parada_id: ponto,
        sequencia: 36 + idx
      }))
    ];

    const allLinhas = [...linha011, ...linha002];

    await queryInterface.bulkInsert('linha_parada', allLinhas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('linha_parada', null, {});
  }
  
  // async up (queryInterface, Sequelize) {
  //   /**
  //    * Add seed commands here.
  //    *
  //    * Example:
  //    * await queryInterface.bulkInsert('People', [{
  //    *   name: 'John Doe',
  //    *   isBetaMember: false
  //    * }], {});
  //   */
  // },

  // async down (queryInterface, Sequelize) {
  //   /**
  //    * Add commands to revert seed here.
  //    *
  //    * Example:
  //    * await queryInterface.bulkDelete('People', null, {});
  //    */
  // }
};
