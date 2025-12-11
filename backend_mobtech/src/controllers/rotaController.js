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
    return {
      latitude: localizacao.coordinates[1],
      longitude: localizacao.coordinates[0],
    };
  }
  // objeto estilo { latitude: x, longitude: y }
  if (
    typeof localizacao.latitude === 'number' &&
    typeof localizacao.longitude === 'number'
  ) {
    return {
      latitude: localizacao.latitude,
      longitude: localizacao.longitude,
    };
  }
  return null;
}

/* Helper: carrega as paradas de uma linha (e opcionalmente sentido), ordenadas por sequencia */
async function obterParadasDaLinhaOrdenadas(linhaId, sentido = null) {
  const where = { linha_id: linhaId };
  if (sentido) where.sentido = sentido;

  const linhaParadas = await LinhaParada.findAll({
    where,
    attributes: ['parada_id', 'sequencia'],
    raw: true,
  });

  if (!linhaParadas.length) return [];

  const paradaIds = Array.from(new Set(linhaParadas.map((lp) => lp.parada_id)));

  const paradas = await Parada.findAll({
    where: { id: paradaIds },
    attributes: ['id', 'nome', 'localizacao'],
    raw: true,
  });

  const paradaMap = new Map(paradas.map((p) => [p.id, p]));

  const stops = linhaParadas
    .map((lp) => {
      const parada = paradaMap.get(lp.parada_id);
      if (!parada) return null;
      const coords = extrairLatLngFromLocalizacao(parada.localizacao);
      if (!coords) return null;
      return {
        id: parada.id,
        nome: parada.nome,
        latitude: coords.latitude,
        longitude: coords.longitude,
        sequencia: lp.sequencia ?? 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sequencia - b.sequencia);

  return stops;
}

/* Busca parada mais próxima dentro do raio */
async function encontrarParadaMaisProxima(lat, lng, raioMetros = RAIO_METROS) {
  const paradas = await Parada.findAll({
    attributes: ['id', 'nome', 'localizacao'],
    raw: true,
  });

  let melhor = null;
  let menorDist = Infinity;

  for (const p of paradas) {
    const coords = extrairLatLngFromLocalizacao(p.localizacao);
    if (!coords) continue;

    const distKm = calcularDistancia(lat, lng, coords.latitude, coords.longitude); // km
    const distMetros = distKm * 1000;

    if (distMetros < menorDist && distMetros <= raioMetros) {
      menorDist = distMetros;
      melhor = {
        id: p.id,
        nome: p.nome,
        distancia: distMetros,
        localizacao: p.localizacao,
      };
    }
  }

  return melhor;
}

/* Busca ids de linhas que passam por uma parada (com possibilidade de filtrar por sentido) */
async function buscarLinhasPorParada(paradaId, sentido = null) {
  const where = { parada_id: paradaId };
  if (sentido) where.sentido = sentido;

  const rows = await LinhaParada.findAll({
    where,
    attributes: ['linha_id'],
    raw: true,
  });

  return rows.map((r) => r.linha_id);
}

/* Verifica se linha passa também pela parada destino com mesmo sentido */
async function linhaPossuiDestino(linhaId, paradaDestinoId, sentido) {
  const where = { linha_id: linhaId, parada_id: paradaDestinoId };
  if (sentido) where.sentido = sentido;

  const found = await LinhaParada.findOne({ where, raw: true });
  return !!found;
}

/* Busca ETA e distância do ônibus mais próximo de uma linha até a parada de embarque,
 * considerando a ordem das paradas na rota (rota cíclica).
 */
async function calcularETAParaLinha(linhaId, paradaEmbarque, sentido = null) {
  // 1) Ônibus da linha
  const onibus = await Onibus.findAll({
    where: { linha_id: linhaId },
    attributes: ['id'],
    raw: true,
  });
  if (!onibus || onibus.length === 0) return null;

  const onibusIds = onibus.map((o) => o.id);
  const localizacoes = await LocalizacaoOnibus.findAll({
    where: { onibus_id: onibusIds },
    attributes: ['onibus_id', 'localizacao', 'timestamp_atualizacao'],
    raw: true,
  });

  if (!localizacoes || localizacoes.length === 0) {
    // sem dados de posição
    return null;
  }

  // 2) Carrega as paradas da linha (no sentido correto, se informado)
  const stops = await obterParadasDaLinhaOrdenadas(linhaId, sentido);
  if (!stops.length) {
    // fallback para lógica antiga se não conseguirmos montar a rota
    const paradaCoords = extrairLatLngFromLocalizacao(paradaEmbarque.localizacao);
    if (!paradaCoords) return null;

    let melhorBruto = null;
    for (const loc of localizacoes) {
      const locCoords = extrairLatLngFromLocalizacao(loc.localizacao);
      if (!locCoords) continue;

      const distKm = calcularDistancia(
        locCoords.latitude,
        locCoords.longitude,
        paradaCoords.latitude,
        paradaCoords.longitude
      );
      const distMetros = Math.round(distKm * 1000);
      const etaMin = calcularTempoChegada(distKm, VELOCIDADE_PADRAO_KMH);

      if (!melhorBruto || distMetros < melhorBruto.distancia_m) {
        melhorBruto = {
          onibus_id: loc.onibus_id,
          distancia_m: distMetros,
          eta_min: etaMin,
          atualizado_em: loc.timestamp_atualizacao,
        };
      }
    }
    return melhorBruto;
  }

  // 3) Índice da parada de embarque na rota
  const idxBoard = stops.findIndex((s) => s.id === paradaEmbarque.id);
  if (idxBoard === -1) {
    // se, por algum motivo, a parada de embarque não estiver na lista, aborta
    return null;
  }

  // 4) Pré-calcula distâncias entre paradas consecutivas
  const segmentDistancesKm = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    segmentDistancesKm[i] = calcularDistancia(
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude
    );
  }

  const distanciaAoLongoDaRota = (fromIndex, toIndex) => {
    let total = 0;
    for (let i = fromIndex; i < toIndex; i++) {
      total += segmentDistancesKm[i];
    }
    return total;
  };

  // Distância para "fechar o ciclo" (última parada -> primeira)
  const closingDistKm =
    stops.length > 1
      ? calcularDistancia(
          stops[stops.length - 1].latitude,
          stops[stops.length - 1].longitude,
          stops[0].latitude,
          stops[0].longitude
        )
      : 0;

  let melhor = null;

  for (const loc of localizacoes) {
    const locCoords = extrairLatLngFromLocalizacao(loc.localizacao);
    if (!locCoords) continue;

    // 5) acha a parada da linha mais próxima do ônibus
    let idxBus = 0;
    let menorDistBusKm = Infinity;

    stops.forEach((stop, index) => {
      const dKm = calcularDistancia(
        locCoords.latitude,
        locCoords.longitude,
        stop.latitude,
        stop.longitude
      );
      if (dKm < menorDistBusKm) {
        menorDistBusKm = dKm;
        idxBus = index;
      }
    });

    // 6) calcula distância ao longo da rota até a parada de embarque
    let distKmRota;
    if (idxBus <= idxBoard) {
      // ônibus ainda não passou do ponto nesse "ciclo"
      distKmRota = distanciaAoLongoDaRota(idxBus, idxBoard);
    } else {
      // ônibus já passou do ponto -> precisa completar o ciclo e voltar até ele
      distKmRota =
        distanciaAoLongoDaRota(idxBus, stops.length - 1) + // até a última
        closingDistKm + // fecha ciclo last -> first
        distanciaAoLongoDaRota(0, idxBoard); // do início até o ponto
    }

    // segurança: se deu zero ou algo estranho, usa distância direta
    if (!Number.isFinite(distKmRota) || distKmRota <= 0) {
      distKmRota = calcularDistancia(
        locCoords.latitude,
        locCoords.longitude,
        stops[idxBoard].latitude,
        stops[idxBoard].longitude
      );
    }

    const etaMin = calcularTempoChegada(distKmRota, VELOCIDADE_PADRAO_KMH);
    const distMetros = Math.round(distKmRota * 1000);

    if (!melhor || etaMin < melhor.eta_min) {
      melhor = {
        onibus_id: loc.onibus_id,
        distancia_m: distMetros,
        eta_min: etaMin,
        atualizado_em: loc.timestamp_atualizacao,
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
      return res
        .status(400)
        .json({ error: 'Envie origem e destino (latitude/longitude).' });
    }

    const origemLat = Number(origem.latitude);
    const origemLng = Number(origem.longitude);
    const destinoLat = Number(destino.latitude);
    const destinoLng = Number(destino.longitude);

    if ([origemLat, origemLng, destinoLat, destinoLng].some((v) => Number.isNaN(v))) {
      return res.status(400).json({ error: 'Coordenadas inválidas.' });
    }

    // 1) encontrar paradas próximas
    const paradaOrigem = await encontrarParadaMaisProxima(
      origemLat,
      origemLng,
      RAIO_METROS
    );
    const paradaDestino = await encontrarParadaMaisProxima(
      destinoLat,
      destinoLng,
      RAIO_METROS
    );

    if (!paradaOrigem || !paradaDestino) {
      return res.status(404).json({
        error: 'Não foi possível localizar paradas próximas (origem ou destino).',
      });
    }

    const opcoes = [];

    // 2) buscar linhas que passam pela parada de origem (considera ambos os sentidos)
    const linhasOrigemAll = await LinhaParada.findAll({
      where: { parada_id: paradaOrigem.id },
      attributes: ['linha_id', 'sentido'],
      raw: true,
    });

    // tentar cada par (linha, sentido) e verificar se a mesma linha (mesmo sentido) atinge o destino
    const avaliados = new Set();
    for (const lp of linhasOrigemAll) {
      const key = `${lp.linha_id}-${lp.sentido}`;
      if (avaliados.has(key)) continue;
      avaliados.add(key);

      const temDestino = await linhaPossuiDestino(
        lp.linha_id,
        paradaDestino.id,
        lp.sentido
      );

      if (temDestino) {
        // opção direta
        const linha = await Linha.findByPk(lp.linha_id, {
          attributes: ['numero', 'nome'],
          raw: true,
        });

        const etaInfo = await calcularETAParaLinha(
          lp.linha_id,
          paradaOrigem,
          lp.sentido
        );

        opcoes.push({
          tipo: 'direta',
          linhas: [String(linha.numero)],
          distancia_ate_parada: Math.round(paradaOrigem.distancia),
          embarque_eta_minutos: etaInfo ? etaInfo.eta_min : null,
          hora_prevista_chegada: etaInfo
            ? new Date(Date.now() + etaInfo.eta_min * 60000).toLocaleTimeString(
                'pt-BR',
                { hour: '2-digit', minute: '2-digit' }
              )
            : null,
        });
      }
    }

    // 3) Gerar baldeação via terminal (se fizer sentido)
    // Linhas que podem ir de paradaOrigem -> TERMINAL
    const linhasQueChegamTerminal = [];
    const rowsOrigem = await LinhaParada.findAll({
      where: { parada_id: paradaOrigem.id },
      attributes: ['linha_id', 'parada_id', 'sequencia', 'sentido'],
      raw: true,
    });

    for (const lp of rowsOrigem) {
      // verifica se a mesma linha possui o terminal
      const terminalRow = await LinhaParada.findOne({
        where: { linha_id: lp.linha_id, parada_id: TERMINAL_ID },
        attributes: ['parada_id', 'sequencia', 'sentido'],
        raw: true,
      });
      if (!terminalRow) continue;

      // checa ordem (defensivo)
      const seqOrig = lp.sequencia;
      const seqTerm = terminalRow ? terminalRow.sequencia : null;
      let ordemValida = true;

      if (typeof seqOrig === 'number' && typeof seqTerm === 'number') {
        // aqui só garantimos que não é o mesmo índice
        ordemValida = seqOrig !== seqTerm;
        // mais estrito seria: ordemValida = seqOrig < seqTerm;
      }

      if (ordemValida) {
        linhasQueChegamTerminal.push({
          linha_id: lp.linha_id,
          sequencia_origem: seqOrig,
          sentido: lp.sentido,
        });
      }
    }

    // Linhas que podem ir de TERMINAL -> paradaDestino
    const linhasTerminalParaDestino = [];
    const rowsTerminal = await LinhaParada.findAll({
      where: { parada_id: TERMINAL_ID },
      attributes: ['linha_id', 'parada_id', 'sequencia', 'sentido'],
      raw: true,
    });

    for (const lp of rowsTerminal) {
      const destinoRow = await LinhaParada.findOne({
        where: { linha_id: lp.linha_id, parada_id: paradaDestino.id },
        attributes: ['parada_id', 'sequencia', 'sentido'],
        raw: true,
      });
      if (!destinoRow) continue;

      const seqTerm = lp.sequencia;
      const seqDest = destinoRow ? destinoRow.sequencia : null;
      let ordemValida = true;

      if (typeof seqTerm === 'number' && typeof seqDest === 'number') {
        ordemValida = seqTerm !== seqDest;
        // mais estrito: ordemValida = seqTerm < seqDest;
      }

      if (ordemValida) {
        linhasTerminalParaDestino.push({
          linha_id: lp.linha_id,
          sequencia_destino: seqDest,
        });
      }
    }

    // combinar pares (A -> terminal) x (terminal -> B)
    for (const a of linhasQueChegamTerminal) {
      for (const b of linhasTerminalParaDestino) {
        if (a.linha_id === b.linha_id) continue; // se for mesma linha já estaria na opção direta

        const linhaA = await Linha.findByPk(a.linha_id, {
          attributes: ['numero'],
          raw: true,
        });
        const linhaB = await Linha.findByPk(b.linha_id, {
          attributes: ['numero'],
          raw: true,
        });

        // calcular ETA com base no ônibus da primeira perna (a.linha_id)
        const etaInfo = await calcularETAParaLinha(
          a.linha_id,
          paradaOrigem,
          a.sentido
        );

        opcoes.push({
          tipo: 'baldeacao',
          linhas: [String(linhaA.numero), String(linhaB.numero)],
          distancia_ate_parada: Math.round(paradaOrigem.distancia),
          embarque_eta_minutos: etaInfo ? etaInfo.eta_min : null,
          hora_prevista_chegada: etaInfo
            ? new Date(Date.now() + etaInfo.eta_min * 60000).toLocaleTimeString(
                'pt-BR',
                { hour: '2-digit', minute: '2-digit' }
              )
            : null,
        });
      }
    }

    // 4) se não encontrar nada
    if (opcoes.length === 0) {
      return res.json({
        origem: paradaOrigem.nome,
        destino: paradaDestino.nome,
        opcoes: [],
      });
    }

    // ordenar por ETA (nulls no final)
    opcoes.sort((a, b) => {
      const ta =
        a.embarque_eta_minutos === null ? Infinity : a.embarque_eta_minutos;
      const tb =
        b.embarque_eta_minutos === null ? Infinity : b.embarque_eta_minutos;
      return ta - tb;
    });

    // formato final
    return res.json({
      origem: paradaOrigem.nome,
      destino: paradaDestino.nome,
      opcoes,
    });
  } catch (err) {
    console.error('Erro buscarRotas:', err);
    return res
      .status(500)
      .json({ error: 'Erro interno ao buscar rotas.' });
  }
}

module.exports = { buscarRotas };