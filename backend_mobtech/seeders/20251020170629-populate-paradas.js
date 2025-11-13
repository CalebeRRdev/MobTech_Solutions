'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const paradas = [
      {
        nome: 'Terminal Urbano',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95681263, -16.32344070),
          4326
        )
      },
      {
        nome: 'Av. Xavier de almeida',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95464476, -16.32335440),
          4326
        )
      },
      {
        nome: 'Av. Sen. José Lourenço Dias, 764',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95121722, -16.32540049),
          4326
        )
      },
      {
        nome: 'Rua Barão do rio branco, 26',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94695818, -16.32777846),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 272-320',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94372629, -16.32745778),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 626',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94045065, -16.32670743),
          4326
        )
      },
      {
        nome: 'R. José Neto Paranhos, 2-144',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93809730, -16.32644148),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 1028-1114',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93703556, -16.32592099),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 1158',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93503553, -16.32536289),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1172-1188',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93324839, -16.32503829),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1218-1224',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92977133, -16.32505271),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1254-1260',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92696630, -16.32526319),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1280-1286',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92492408, -16.32538869),
          4326
        )
      },
      {
        nome: 'Av. PB 1, 220 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91915893, -16.32564051),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 414-662 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91888836, -16.32628229),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 664-724 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91894370, -16.32857621),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 278-300 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92049263, -16.33049659),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 590 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92046450, -16.33320967),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 740 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92029537, -16.33562259),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 934-1142 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92022096, -16.33709572),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 1144-1360 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92013998, -16.33905306),
          4326
        )
      },
      {
        nome: 'Av. Bandeirante, 1362-1570 - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92001806, -16.34095569),
          4326
        )
      },
      {
        nome: 'R. Victor Antônio Braga, 275 - Parque Res. Ander',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92175090, -16.34341443),
          4326
        )
      },
      {
        nome: 'R. Maria Inês de Jesus',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92275490, -16.34718447),
          4326
        )
      },
      {
        nome: 'R. Jovina Maria Oliveira, 256',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92381350, -16.34883143),
          4326
        )
      },
      {
        nome: 'Rua Jarbas G. Lobô, 2-284',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92155239, -16.34969122),
          4326
        )
      },
      {
        nome: 'Rua 20 Quadra 80 13',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92003756, -16.34965370),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 2391 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91816723, -16.34686616),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 2183 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91824426, -16.34489147),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 1981 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91833943, -16.34292197),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 1343 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91862473, -16.33710007),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 1119-1267 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91869519, -16.33585308),
          4326
        )
      },
      {
        nome: 'Praça da Igreja Feira Coberta - Lourdes',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91795620, -16.33270098),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 911 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91888933, -16.33072609),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 663 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91894510, -16.32859748),
          4326
        )
      },
      {
        nome: 'Av. Comercial, 413 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.91887843, -16.32627346),
          4326
        )
      },
      {
        nome: 'Av. PB 1, 51 - Parque Brasilia 2A Etapa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92058785, -16.32552248),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 1279 - Anápolis City',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92494143, -16.32525879),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 1253 - Anápolis City',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.92696090, -16.32514398),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1197 - Vila DOS SARGENTOS',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93124583, -16.32487478),
          4326
        )
      },
      {
        nome: 'Av. Eng. Geraldo de Pina, 1171 - Anápolis City',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93325090, -16.32480398),
          4326
        )
      },
      {
        nome: 'Av. Perimetral Oeste, 1381 - Anápolis City',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93492000, -16.32520378),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 1057 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93685600, -16.32577965),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 793 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93891173, -16.32631639),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 595 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94059168, -16.32662578),
          4326
        )
      },
      {
        nome: 'Av. Mato Grosso, 191 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94449860, -16.32755359),
          4326
        )
      },
      {
        nome: 'R. Manoel Demóstenes, 26 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94700759, -16.32781584),
          4326
        )
      },
      {
        nome: 'Rua Senador Alfredo Nasser, 88',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94779245, -16.32842309),
          4326
        )
      },
      {
        nome: 'Ponto de integração - Praça Do Ancião',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95050109, -16.32879970),
          4326
        )
      },
      {
        nome: 'Ponto Goiás',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95373574, -16.32861302),
          4326
        )
      },
      {
        nome: 'Praça Bom Jesus B/C',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95762763, -16.32769243),
          4326
        )
      },
      {
        nome: 'Terminal Central',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95709874, -16.32369511),
          4326
        )
      },
      {
        nome: 'R. Des. Jaime - St. Central',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95329284, -16.32665283),
          4326
        )
      },
      {
        nome: 'Ponto Antesina Santana',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.95344482, -16.32769403),
          4326
        )
      },
      {
        nome: 'Av. Minas Gerais, 240 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94806381, -16.33190205),
          4326
        )
      },
      {
        nome: 'Av. Pres. Wilson, 14 - Vila Industrial',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94948000, -16.33458236),
          4326
        )
      },
      {
        nome: 'Av. Pres. Wilson, 324 - Vila Industrial',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94964400, -16.33730268),
          4326
        )
      },
      {
        nome: 'Av. Pres. Wilson, 478 - Vila Industrial',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94950450, -16.33867158),
          4326
        )
      },
      {
        nome: 'Av. Pres. Wilson, 772 - Vila Industrial',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94858600, -16.34135759),
          4326
        )
      },
      {
        nome: 'Av. Sebastião Pedro Junqueira, 19 - Vila Industrial',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94762131, -16.34276774),
          4326
        )
      },
      {
        nome: 'Av. Anderson Clayton, 194 - Eldorado',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94513257, -16.34637424),
          4326
        )
      },
      {
        nome: 'Av. Anderson Clayton, 440 - Eldorado',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94433062, -16.34817010),
          4326
        )
      },
      {
        nome: 'Av. Anderson Clayton, 900 - Eldorado',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94250684, -16.35254053),
          4326
        )
      },
      {
        nome: 'Rua Frei J Vogel/R. 09, 314 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94111897, -16.35374648),
          4326
        )
      },
      {
        nome: 'Rua Frei J Vogel/R. 09, 522 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93940168, -16.35306579),
          4326
        )
      },
      {
        nome: 'Rua 25, 150-194 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93823093, -16.35443896),
          4326
        )
      },
      {
        nome: 'Rua 25, 1284-1350 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93735042, -16.35653211),
          4326
        )
      },
      {
        nome: 'Rua 120, 111-163 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93832873, -16.35711057),
          4326
        )
      },
      {
        nome: 'Rua 113, 391-433 - Vila Formosa',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93745642, -16.35832036),
          4326
        )
      },
      {
        nome: 'Av. Paraguai, 3039 - Alto da Bela Vista',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93577830, -16.35780575),
          4326
        )
      },
      {
        nome: 'Av. Paraguai, 551-1101 - Alto da Bela Vista',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93643754, -16.35624749),
          4326
        )
      },
      {
        nome: 'Av. Paraguai, 241-401 - Alto da Bela Vista',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93669692, -16.35506685),
          4326
        )
      },
      {
        nome: 'Rua 17-A, 135 - Alto da Bela Vista',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93571258, -16.35463289),
          4326
        )
      },
      {
        nome: 'R. Goiânia, 233 - Jardim Eldorado',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93361843, -16.35445930),
          4326
        )
      },
      {
        nome: 'Avenida Jucelino Kubitscheck - C/B',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93092096, -16.35323330),
          4326
        )
      },
      {
        nome: 'Avenida Jucelino Kubitscheck - B/C',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93126428, -16.35272885),
          4326
        )
      },
      {
        nome: 'Av. Jamel Cecílio, 2879',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93512617, -16.34908523),
          4326
        )
      },
      {
        nome: 'Av. Jamel Cecílio, 2575',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93551449, -16.34592548),
          4326
        )
      },
      {
        nome: 'Av. Jamel Cecílio, 425-645',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93648173, -16.33967326),
          4326
        )
      },
      {
        nome: 'Av. Jamel Cecílio, 77 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93750951, -16.33467247),
          4326
        )
      },
      {
        nome: 'Praça Bartolomeu de Gusmão, 87-175 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93726055, -16.33386608),
          4326
        )
      },
      {
        nome: 'R. Cônego Ramiro, 345 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93792204, -16.33265210),
          4326
        )
      },
      {
        nome: 'Santa Casa (Sentido centro)',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.93892655, -16.33098833),
          4326
        )
      },
      {
        nome: 'Av. Santos Dumont, 691 - Jundiaí',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94191223, -16.32951904),
          4326
        )
      },
      {
        nome: 'Av. Santos Dumont, 309 - Vila Santana',
        localizacao: Sequelize.fn(
          'ST_SetSRID',
          Sequelize.fn('ST_MakePoint', -48.94531665, -16.32944234),
          4326
        )
      }
    ];
    await queryInterface.bulkInsert('paradas', paradas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('paradas', null, {});
  }
};


// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add seed commands here.
//      *
//      * Example:
//      * await queryInterface.bulkInsert('People', [{
//      *   name: 'John Doe',
//      *   isBetaMember: false
//      * }], {});
//     */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add commands to revert seed here.
//      *
//      * Example:
//      * await queryInterface.bulkDelete('People', null, {});
//      */
//   }
// };