'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove a tabela (e a FK automaticamente por causa do CASCADE)
    await queryInterface.dropTable('trajetos');
  },

  down: async (queryInterface, Sequelize) => {
    // Reverte: recria a tabela
    await queryInterface.createTable('trajetos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      linha_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'linhas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sequencia: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      localizacao: {
        type: Sequelize.GEOMETRY('POINT', 4326),
        allowNull: false
      }
    });
  }
};





// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//   }
// };
