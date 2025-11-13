// src/controllers/rotaController.js
const { Parada, LinhaParada, Linha, Onibus, LocalizacaoOnibus } = require('../models');
const { calcularDistancia, calcularTempoChegada } = require('../utils/geoUtils');

// configuração
const RAIO_METROS = 500;
const TERMINAL_ID = 52; // id fixo de baldeação (conforme acordado)
const VELOCIDADE_PADRAO_KMH = 30; // fallback quando não houver localizacao_onibus

/* Helper: extrai lat/lng de diferentes formatos de localizacao */
function extrairLatLngFromLocalizacao(localizacao) {
  if (!localizacao) return null;
  // PostGIS GEOMETRY: { type: 'Point', coordinates: [lng, lat] } ou objeto com coordinates
  if (localizacao.coordinates && Array.isArray(localizacao.coordinates)) {
    return { latitude: localizacao.coordinates[1], longitude: localizacao.coordinates[0] };
  }
  // objeto estilo { latitude: x, longitude: y }
  if (typeof localizacao.latitude === 'number' && typeof localizacao.longitude === 'number') {
    return { latitude: localizacao.latitude, longitude: localizacao.longitude };
  }
  return null;
}

/* Busca parada mais próxima dentro do raio */
async function encontrarParadaMaisProxima(lat, lng, raioMetros = RAIO_METROS) {
  const paradas = await Parada.findAll({ attributes: ['id', 'nome', 'localizacao'], raw: true });
  let melhor = null;
  let menorDist = Infinity;
  for (const p of paradas) {
    const coords = extrairLatLngFromLocalizacao(p.localizacao);
    if (!coords) continue;
    const distKm = calcularDistancia(lat, lng, coords.latitude, coords.longitude); // km
    const distMetros = distKm * 1000;
    if (distMetros < menorDist && distMetros <= raioMetros) {
      menorDist = distMetros;
      melhor = { id: p.id, nome: p.nome, distancia: distMetros, localizacao: p.localizacao };
    }
  }
  return melhor;
}

/* Busca ids de linhas que passam por uma parada (com possibilidade de filtrar por sentido) */
async function buscarLinhasPorParada(paradaId, sentido = null) {
  const where = { parada_id: paradaId };
  if (sentido) where.sentido = sentido;
  const rows = await LinhaParada.findAll({ where, attributes: ['linha_id'], raw: true });
  return rows.map(r => r.linha_id);
}

/* Verifica se linha passa também pela parada destino com mesmo sentido */
async function linhaPossuiDestino(linhaId, paradaDestinoId, sentido) {
  const where = { linha_id: linhaId, parada_id: paradaDestinoId };
  if (sentido) where.sentido = sentido;
  const found = await LinhaParada.findOne({ where, raw: true });
  return !!found;
}

/* Busca ETA e distância do ônibus mais próximo de uma linha até a parada de embarque */
async function calcularETAParaLinha(linhaId, paradaEmbarque) {
  // pega onibus(s) da linha
  const onibus = await Onibus.findAll({ where: { linha_id: linhaId }, attributes: ['id'], raw: true });
  if (!onibus || onibus.length === 0) return null;

  // busca localizacoes dos onibus dessa linha
  const onibusIds = onibus.map(o => o.id);
  const localizacoes = await LocalizacaoOnibus.findAll({
    where: { onibus_id: onibusIds },
    attributes: ['onibus_id', 'localizacao', 'timestamp_atualizacao'],
    raw: true
  });

  if (!localizacoes || localizacoes.length === 0) {
    // sem dados de posição
    return null;
  }

  // converte coords da parada
  const paradaCoords = extrairLatLngFromLocalizacao(paradaEmbarque.localizacao);
  if (!paradaCoords) return null;

  // calcula distância e tempo para cada ônibus; pega o mais próximo
  let melhor = null;
  for (const loc of localizacoes) {
    const locCoords = extrairLatLngFromLocalizacao(loc.localizacao);
    if (!locCoords) continue;
    const distKm = calcularDistancia(locCoords.latitude, locCoords.longitude, paradaCoords.latitude, paradaCoords.longitude);
    const distMetros = Math.round(distKm * 1000);
    // tempo estimado em minutos (usa calcularTempoChegada que retorna minutos)
    const etaMin = calcularTempoChegada(distKm, VELOCIDADE_PADRAO_KMH);
    if (!melhor || distMetros < melhor.distancia_m) {
      melhor = {
        onibus_id: loc.onibus_id,
        distancia_m: distMetros,
        eta_min: etaMin,
        atualizado_em: loc.timestamp_atualizacao
      };
    }
  }
  return melhor;
}

/* Rota principal: retorna opções (direta ou baldeacao via terminal) */
async function buscarRotas(req, res) {
  try {
    const body = req.body || {};
    const origem = body.origem;
    const destino = body.destino;

    if (!origem || !destino) {
      return res.status(400).json({ error: 'Envie origem e destino (latitude/longitude).' });
    }
    const origemLat = Number(origem.latitude);
    const origemLng = Number(origem.longitude);
    const destinoLat = Number(destino.latitude);
    const destinoLng = Number(destino.longitude);

    if ([origemLat, origemLng, destinoLat, destinoLng].some(v => Number.isNaN(v))) {
      return res.status(400).json({ error: 'Coordenadas inválidas.' });
    }

    // 1) encontrar paradas próximas
    const paradaOrigem = await encontrarParadaMaisProxima(origemLat, origemLng, RAIO_METROS);
    const paradaDestino = await encontrarParadaMaisProxima(destinoLat, destinoLng, RAIO_METROS);

    if (!paradaOrigem || !paradaDestino) {
      return res.status(404).json({ error: 'Não foi possível localizar paradas próximas (origem ou destino).' });
    }

    const opcoes = [];

    // 2) buscar linhas que passam pela parada de origem (considera ambos os sentidos)
    const linhasOrigemAll = await LinhaParada.findAll({ where: { parada_id: paradaOrigem.id }, attributes: ['linha_id', 'sentido'], raw: true });

    // tentar cada par (linha, sentido) e verificar se a mesma linha (mesmo sentido) atinge o destino
    const avaliados = new Set();
    for (const lp of linhasOrigemAll) {
      const key = `${lp.linha_id}-${lp.sentido}`;
      if (avaliados.has(key)) continue;
      avaliados.add(key);

      const temDestino = await linhaPossuiDestino(lp.linha_id, paradaDestino.id, lp.sentido);
      if (temDestino) {
        // opção direta
        const linha = await Linha.findByPk(lp.linha_id, { attributes: ['numero', 'nome'], raw: true });
        const etaInfo = await calcularETAParaLinha(lp.linha_id, paradaOrigem);
        opcoes.push({
          tipo: 'direta',
          linhas: [String(linha.numero)],
          distancia_ate_parada: Math.round(paradaOrigem.distancia),
          embarque_eta_minutos: etaInfo ? etaInfo.eta_min : null,
          hora_prevista_chegada: etaInfo ? (new Date(Date.now() + etaInfo.eta_min * 60000)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null
        });
      }
    }

    // 3) Se não tiver diretas (ou mesmo que tenha — opcional: incluir baldeacao adicional), gerar baldeacao via terminal
    // Regras: baldeacao só faz sentido se: existe linha que leva da origem até o terminal (mesmo sentido) AND existe linha que sai do terminal até destino (mesmo sentido adequado).
    // Vamos listar linhas que passam pela paradaOrigem -> terminal e linhas que passam terminal -> paradaDestino.
    const linhasQueChegamTerminal = [];
    const rowsOrigem = await LinhaParada.findAll({
      where: { parada_id: paradaOrigem.id },
      attributes: ['linha_id', 'parada_id', 'sequencia', 'sentido'],
      raw: true
    });

    for (const lp of rowsOrigem) {
      // verifica se a mesma linha possui o terminal (independente do sentido)
      const terminalRow = await LinhaParada.findOne({
        where: { linha_id: lp.linha_id, parada_id: TERMINAL_ID },
        attributes: ['parada_id', 'sequencia', 'sentido'],
        raw: true
      });
      if (!terminalRow) continue;

      // se existirem sequencias, garantir que o movimento vai no sentido correto:
      // aceitaremos se a sequência do terminal for diferente (ex.: terminal depois de origem)
      // ou se não houver sequencia (defensivo).
      const seqOrig = lp.sequencia;
      const seqTerm = terminalRow ? terminalRow.sequencia : null;
      let ordemValida = true;
      if (typeof seqOrig === 'number' && typeof seqTerm === 'number') {
        // queremos que o ônibus 'poderia' ir de origem -> terminal (seqOrig < seqTerm)
        // ou (seqOrig > seqTerm) dependendo do cadastro; aqui aceitamos qualquer uma,
        // mas preferimos seqOrig < seqTerm (indicando movimento 'para frente').
        ordemValida = (seqOrig !== seqTerm); // aceita enquanto não forem o mesmo índice
        // se quiser mais estrito: ordemValida = seqOrig < seqTerm;
      }

      if (ordemValida) linhasQueChegamTerminal.push({ linha_id: lp.linha_id, sequencia_origem: seqOrig });
    }

    // linhas que partem do terminal e chegam ao destino
    const linhasTerminalParaDestino = [];
    const rowsTerminal = await LinhaParada.findAll({
      where: { parada_id: TERMINAL_ID },
      attributes: ['linha_id', 'parada_id', 'sequencia', 'sentido'],
      raw: true
    });

    for (const lp of rowsTerminal) {
      const destinoRow = await LinhaParada.findOne({
        where: { linha_id: lp.linha_id, parada_id: paradaDestino.id },
        attributes: ['parada_id', 'sequencia', 'sentido'],
        raw: true
      });
      if (!destinoRow) continue;

      const seqTerm = lp.sequencia;
      const seqDest = destinoRow ? destinoRow.sequencia : null;
      let ordemValida = true;
      if (typeof seqTerm === 'number' && typeof seqDest === 'number') {
        ordemValida = (seqTerm !== seqDest);
        // para ser mais restritivo: ordemValida = seqTerm < seqDest;
      }

      if (ordemValida) linhasTerminalParaDestino.push({ linha_id: lp.linha_id, sequencia_destino: seqDest });
    }

    // combinar pares (A -> terminal) x (terminal -> B)
    for (const a of linhasQueChegamTerminal) {
      for (const b of linhasTerminalParaDestino) {
        if (a.linha_id === b.linha_id) continue; // se for mesma linha já estaria em direta
        const linhaA = await Linha.findByPk(a.linha_id, { attributes: ['numero'], raw: true });
        const linhaB = await Linha.findByPk(b.linha_id, { attributes: ['numero'], raw: true });

        // calcular ETA com base no onibus da primeira perna (a.linha_id)
        const etaInfo = await calcularETAParaLinha(a.linha_id, paradaOrigem);

        opcoes.push({
          tipo: 'baldeacao',
          linhas: [String(linhaA.numero), String(linhaB.numero)],
          // parada_embarque: { id: paradaOrigem.id, nome: paradaOrigem.nome },
          // parada_baldeacao: { id: TERMINAL_ID, nome: 'Terminal Central' },
          distancia_ate_parada: Math.round(paradaOrigem.distancia),
          embarque_eta_minutos: etaInfo ? etaInfo.eta_min : null,
          hora_prevista_chegada: etaInfo ? (new Date(Date.now() + etaInfo.eta_min * 60000)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null
        });
      }
    }

    // 4) se não encontrar nada
    if (opcoes.length === 0) {
      return res.json({
        origem: paradaOrigem.nome,
        destino: paradaDestino.nome,
        opcoes: []
      });
    }

    // ordenar por ETA (nulls no final)
    opcoes.sort((a, b) => {
      const ta = a.embarque_eta_minutos === null ? Infinity : a.embarque_eta_minutos;
      const tb = b.embarque_eta_minutos === null ? Infinity : b.embarque_eta_minutos;
      return ta - tb;
    });

    // formato final
    return res.json({
      origem: paradaOrigem.nome,
      destino: paradaDestino.nome,
      opcoes
    });

  } catch (err) {
    console.error('Erro buscarRotas:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar rotas.' });
  }
}

module.exports = { buscarRotas };





// // src/controllers/rotaController.js
// const { Parada, LinhaParada, Linha, Onibus, LocalizacaoOnibus } = require('../models');
// const { calcularDistancia, calcularTempoChegada } = require('../utils/geoUtils');

// // Configs
// const TERMINAL_ID = 52; // ponto de baldeação conforme combinado
// const VELOCIDADE_MEDIA_KMH = 30; // usada no cálculo do ETA

// function formatHHMM(date) {
//   return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
// }

// module.exports = {
//   async buscarRotas(req, res) {
//     try {
//       const { origem, destino } = req.body;

//       if (!origem || !destino) {
//         return res.status(400).json({ erro: 'Informe origem e destino.' });
//       }
//       if (typeof origem.latitude !== 'number' || typeof origem.longitude !== 'number' ||
//           typeof destino.latitude !== 'number' || typeof destino.longitude !== 'number') {
//         return res.status(400).json({ erro: 'Origem/destino devem conter latitude e longitude numéricos.' });
//       }

//       // 1) carregar todas as paradas (tem poucas — ok fazer em memória)
//       const paradas = await Parada.findAll({ attributes: ['id', 'nome', 'localizacao'], raw: true });
//       if (!paradas || paradas.length === 0) {
//         return res.status(404).json({ erro: 'Nenhuma parada cadastrada.' });
//       }

//       // 2) achar parada mais próxima da origem e do destino
//       let paradaOrigem = null;
//       let paradaDestino = null;
//       let menorDistOrig = Infinity;
//       let menorDistDest = Infinity;

//       for (const p of paradas) {
//         if (!p.localizacao || !p.localizacao.coordinates) continue;
//         const [lng, lat] = p.localizacao.coordinates;
//         const distOrigKm = calcularDistancia(origem.latitude, origem.longitude, lat, lng);
//         const distDestKm = calcularDistancia(destino.latitude, destino.longitude, lat, lng);

//         if (distOrigKm < menorDistOrig) {
//           menorDistOrig = distOrigKm;
//           paradaOrigem = { id: p.id, nome: p.nome, localizacao: p.localizacao, distancia_m: Math.round(distOrigKm * 1000) };
//         }
//         if (distDestKm < menorDistDest) {
//           menorDistDest = distDestKm;
//           paradaDestino = { id: p.id, nome: p.nome, localizacao: p.localizacao, distancia_m: Math.round(distDestKm * 1000) };
//         }
//       }

//       if (!paradaOrigem || !paradaDestino) {
//         return res.status(404).json({ erro: 'Não foi possível localizar paradas próximas.' });
//       }

//       // 3) buscar entradas de linha_parada para origem, destino e terminal
//       const lpOrigem = await LinhaParada.findAll({ where: { parada_id: paradaOrigem.id }, raw: true });
//       const lpDestino = await LinhaParada.findAll({ where: { parada_id: paradaDestino.id }, raw: true });
//       const lpTerminal = await LinhaParada.findAll({ where: { parada_id: TERMINAL_ID }, raw: true });

//       const mapOrigem = new Map(); // linha_id -> sentido (último encontrado)
//       lpOrigem.forEach(r => mapOrigem.set(r.linha_id, r.sentido));
//       const mapDestino = new Map();
//       lpDestino.forEach(r => mapDestino.set(r.linha_id, r.sentido));
//       const linhasTerminal = lpTerminal.map(r => r.linha_id);

//       // 4) encontrar linhas diretas (mesma linha passando nas duas paradas e mesmo sentido)
//       const linhasDiretasIds = [];
//       for (const [linhaId, sentido] of mapOrigem.entries()) {
//         if (mapDestino.has(linhaId) && mapDestino.get(linhaId) === sentido) {
//           linhasDiretasIds.push({ linha_id: linhaId, sentido });
//         }
//       }

//       // 5) encontrar pares para baldeacao via terminal:
//       // linhas que vão da origem até o terminal (mesmo sentido) e linhas que vão do terminal até o destino (mesmo sentido)
//       const mapTerminal = new Map(); // linha_id -> sentidos in terminal set (could be multiple)
//       lpTerminal.forEach(r => {
//         if (!mapTerminal.has(r.linha_id)) mapTerminal.set(r.linha_id, new Set());
//         mapTerminal.get(r.linha_id).add(r.sentido);
//       });

//       const baldeacoes = []; // array de [linhaA, linhaB] ids (linhaA: origem->terminal, linhaB: terminal->destino)
//       for (const [linhaA, sentidoA] of mapOrigem.entries()) {
//         // linhaA must also pass terminal with same sentido
//         if (!mapTerminal.has(linhaA) || !mapTerminal.get(linhaA).has(sentidoA)) continue;

//         // find lineB that passes terminal and destination (and has matching sentido at the terminal -> but to simplify, accept any sentido that passes terminal and destination)
//         for (const [linhaB, sentidoB] of mapDestino.entries()) {
//           if (linhaA === linhaB) continue;
//           // linhaB must also pass terminal
//           if (!mapTerminal.has(linhaB)) continue;
//           // optionally we can require sentidoB === sentido at terminal but data may vary; we'll accept lines that pass terminal
//           baldeacoes.push({ linha_origem: linhaA, linha_destino: linhaB, sentido_origem: sentidoA, sentido_destino: sentidoB });
//         }
//       }

//       // 6) carregar dados de linhas (número e nome) e, opcionalmente, localização do ônibus mais próximo.
//       // vamos carregar todas as linhas que apareceram para evitar múltiplas queries
//       const idsParaCarregar = new Set();
//       linhasDiretasIds.forEach(x => idsParaCarregar.add(x.linha_id));
//       baldeacoes.forEach(x => { idsParaCarregar.add(x.linha_origem); idsParaCarregar.add(x.linha_destino); });

//       const linhasDados = await Linha.findAll({
//         where: { id: Array.from(idsParaCarregar) },
//         attributes: ['id', 'numero', 'nome'],
//         raw: true
//       });
//       const mapaLinha = new Map(linhasDados.map(l => [l.id, l]));

//       // 7) buscar localização atual de ônibus (se existir) para linhas relevantes (um ônibus por linha como definido)
//       const linhasIdsArray = Array.from(idsParaCarregar);
//       let onibusLocations = [];
//       if (linhasIdsArray.length > 0) {
//         // join Onibus + LocalizacaoOnibus to fetch active location for each line (may be none)
//         onibusLocations = await Onibus.findAll({
//           where: { linha_id: linhasIdsArray },
//           include: [{ model: LocalizacaoOnibus }],
//           attributes: ['id', 'placa', 'linha_id'],
//           raw: false
//         });
//       }

//       // build map: linha_id -> nearestOnibusLoc (if any)
//       const mapaOnibusPorLinha = new Map();
//       for (const o of onibusLocations) {
//         const loc = o.LocalizacaoOnibus;
//         if (loc && loc.localizacao && loc.localizacao.coordinates) {
//           mapaOnibusPorLinha.set(o.linha_id, {
//             onibus_id: o.id,
//             placa: o.placa,
//             longitude: loc.localizacao.coordinates[0],
//             latitude: loc.localizacao.coordinates[1],
//             atualizado_em: loc.timestamp_atualizacao
//           });
//         }
//       }

//       // 8) montar opcoes: diretas
//       const opcoes = [];

//       for (const item of linhasDiretasIds) {
//         const linhaId = item.linha_id;
//         const linhaInfo = mapaLinha.get(linhaId) || { numero: String(linhaId), nome: null };

//         const onibusInfo = mapaOnibusPorLinha.get(linhaId) || null;

//         // distância user -> parada de embarque (em metros) já calculada: paradaOrigem.distancia_m
//         const distanciaMetros = paradaOrigem.distancia_m;

//         // eta de chegada do ônibus até a parada de embarque:
//         let etaMin = null;
//         if (onibusInfo) {
//           const distKm = calcularDistancia(onibusInfo.latitude, onibusInfo.longitude,
//                                            paradaOrigem.localizacao.coordinates[1], paradaOrigem.localizacao.coordinates[0]);
//           etaMin = calcularTempoChegada(distKm, VELOCIDADE_MEDIA_KMH); // usa util
//         }

//         // se não há onibus, etaMin fica null (frontend mostrará que não há ônibus próximo)
//         const totalETAmin = etaMin !== null ? etaMin : null;

//         const horaPrev = totalETAmin !== null ? formatHHMM(new Date(Date.now() + totalETAmin * 60000)) : null;

//         opcoes.push({
//           tipo: 'direta',
//           linhas: [String(linhaInfo.numero)],
//           distancia_ate_parada: distanciaMetros,
//           embarque_eta_minutos: totalETAmin,
//           hora_prevista_chegada: horaPrev
//         });
//       }

//       // 9) montar opcoes: baldeacao via TERMINAL
//       for (const b of baldeacoes) {
//         const linhaA = mapaLinha.get(b.linha_origem) || { numero: String(b.linha_origem) };
//         const linhaB = mapaLinha.get(b.linha_destino) || { numero: String(b.linha_destino) };

//         // try to compute ETA based on onibus of primeira perna (linha_origem)
//         const onibusInfo = mapaOnibusPorLinha.get(b.linha_origem) || null;
//         let etaMin = null;
//         if (onibusInfo) {
//           const distKm = calcularDistancia(onibusInfo.latitude, onibusInfo.longitude,
//                                            paradaOrigem.localizacao.coordinates[1], paradaOrigem.localizacao.coordinates[0]);
//           etaMin = calcularTempoChegada(distKm, VELOCIDADE_MEDIA_KMH);
//           // add small buffer for baldeacao (tempo até desembarcar no terminal + espera)
//           etaMin = Math.round(etaMin + 10); // +10 minutos para baldeação (ajustável)
//         }

//         opcoes.push({
//           tipo: 'baldeacao',
//           linhas: [String(linhaA.numero), String(linhaB.numero)],
//           distancia_ate_parada: paradaOrigem.distancia_m,
//           embarque_eta_minutos: etaMin,
//           hora_prevista_chegada: etaMin !== null ? formatHHMM(new Date(Date.now() + etaMin * 60000)) : null
//         });
//       }

//       // 10) ordenar opcoes por embarque_eta_minutos (nulls ao final)
//       opcoes.sort((a, b) => {
//         if (a.embarque_eta_minutos === null) return 1;
//         if (b.embarque_eta_minutos === null) return -1;
//         return a.embarque_eta_minutos - b.embarque_eta_minutos;
//       });

//       return res.json({
//         origem: paradaOrigem.nome,
//         destino: paradaDestino.nome,
//         opcoes
//       });

//     } catch (error) {
//       console.error('Erro buscarRotas:', error);
//       return res.status(500).json({ erro: 'Erro interno ao buscar rotas.' });
//     }
//   }
// };
