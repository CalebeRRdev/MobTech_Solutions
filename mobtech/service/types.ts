// services/types.ts
export interface Linha {
  id: number;
  numero: string;
  nome: string;
  cor: string;
}

export interface Parada {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
}

export interface LinhaParada {
  linhaId: number;
  paradaId: number;
  ordem: number;
  horario?: string;
}

export interface Trajeto {
  id: number;
  linhaId: number;
  pontos: { latitude: number; longitude: number }[];
}

export interface LocalizacaoOnibus {
  id: number;
  linhaId: number;
  latitude: number;
  longitude: number;
  ultimoUpdate: string;
}

export type SearchResult =
  | { type: 'stop'; id: number; nome: string; latitude: number; longitude: number }
  | { type: 'line'; id: number; numero: string; nome: string };