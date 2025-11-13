// services/endpoints.ts
export const ENDPOINTS = {
  LINHAS: '/linhas',
  LOCALIZACAO_ONIBUS: '/localizacaoOnibus',
  PARADAS: '/paradas',
  LINHA_PARADAS: (id: number) => `/linhas/${id}/paradas`,
  ROTAS: '/rotas',
};