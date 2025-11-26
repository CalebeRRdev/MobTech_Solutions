// services/endpoints.ts
export const ENDPOINTS = {
  LINHAS: '/linhas',
  LOCALIZACAO_ONIBUS: '/localizacaoOnibus',
  PARADAS: '/paradas',
  LINHA_PARADAS: (id: number) => `/linhas/${id}/paradas`,
  ROTAS: '/rotas',
};



// // services/endpoints.ts
// export const ENDPOINTS = {
//   LINHAS: 'http://192.168.1.107:3000/linhas',
//   PARADAS: 'http://192.168.1.107:3000/paradas',
//   LINHA_PARADA: 'http://192.168.1.107:3000/linhaParada',
//   TRAJETOS: 'http://192.168.1.107:3000/trajetos',
//   LOCALIZACAO_ONIBUS: 'http://192.168.1.107:3000/localizacaoOnibus',
// };