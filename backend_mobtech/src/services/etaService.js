// src/services/etaService.js

const { sequelize, Parada, LinhaParada, Linha, Onibus, LocalizacaoOnibus } = require('../models');
const { QueryTypes } = require('sequelize');

/* ================= CONFIGURAÇÕES ================= */
const AVG_SPEED_KMH = 30;       // Velocidade média simulada
const TRANSFER_WAIT_MIN = 10;   // Tempo médio de troca no terminal
const DEFAULT_WAIT_TIME = 15;   // Tempo de espera padrão se não achar ônibus real
const TERMINAL_ID = 52;         // ID da parada do Terminal Urbano
const TORTUOSITY_FACTOR = 1.3;  // Margem de erro para trajeto de rua vs linha reta

/* ================= HELPERS MATEMÁTICOS ================= */

function minutosFromMeters(distanceMeters, speedKmh = AVG_SPEED_KMH) {
  if (!distanceMeters || distanceMeters < 0) return DEFAULT_WAIT_TIME;
  const speedMetersPerMin = (speedKmh * 1000) / 60;
  const realDistance = distanceMeters * TORTUOSITY_FACTOR;
  const minutes = realDistance / speedMetersPerMin;
  return Math.ceil(minutes);
}

function formatHoraPrevista(minutosAteAgora) {
  if (minutosAteAgora === null || minutosAteAgora === undefined) return null;
  const chegada = new Date(Date.now() + minutosAteAgora * 60000);
  return chegada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ================= HELPERS DE BANCO DE DADOS ================= */

async function getRealTimeBusInfo(linhaId, paradaAlvo) {
  // 1. Busca localização do ônibus mais recente
  const sqlBus = `
    SELECT o.id AS onibus_id,
           ST_X(lo.localizacao::geometry) AS lon,
           ST_Y(lo.localizacao::geometry) AS lat,
           lo.timestamp_atualizacao
    FROM onibus o
    JOIN localizacao_onibus lo ON o.id = lo.onibus_id
    WHERE o.linha_id = :linhaId
    ORDER BY lo.timestamp_atualizacao DESC
    LIMIT 1
  `;

  const busRows = await sequelize.query(sqlBus, {
    replacements: { linhaId },
    type: QueryTypes.SELECT
  });

  // SE NÃO ACHAR ÔNIBUS, RETORNA FALLBACK SIMULADO
  if (!busRows || busRows.length === 0) {
    return {
      onibus_id: null,
      dist_m: 2000, // 2km simulados
      eta_min: DEFAULT_WAIT_TIME,
      timestamp: new Date(),
      is_real_time: false
    };
  }
  
  const busLoc = busRows[0];

  // 2. Calcula distância
  const sqlDist = `
    SELECT ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(:lonBus, :latBus), 4326)::geometry,
      p.localizacao::geometry
    ) AS dist_m
    FROM paradas p
    WHERE p.id = :paradaId
  `;

  const distRows = await sequelize.query(sqlDist, {
    replacements: { 
      lonBus: busLoc.lon, 
      latBus: busLoc.lat, 
      paradaId: paradaAlvo.id 
    },
    type: QueryTypes.SELECT
  });

  const dist_m = distRows[0] ? parseFloat(distRows[0].dist_m) : 2000; // Fallback 2km

  return {
    onibus_id: busLoc.onibus_id,
    dist_m: dist_m,
    eta_min: minutosFromMeters(dist_m),
    timestamp: busLoc.timestamp_atualizacao,
    is_real_time: true
  };
}

async function getDistanciaEntreParadas(paradaIdOrigem, paradaIdDestino) {
  const sql = `
    SELECT ST_DistanceSphere(
      p1.localizacao::geometry,
      p2.localizacao::geometry
    ) AS dist_m
    FROM paradas p1, paradas p2
    WHERE p1.id = :idOrigem AND p2.id = :idDestino
  `;
  const rows = await sequelize.query(sql, {
    replacements: { idOrigem: paradaIdOrigem, idDestino: paradaIdDestino },
    type: QueryTypes.SELECT
  });
  return rows[0] ? parseFloat(rows[0].dist_m) : 1500; // Fallback 1.5km
}

async function findNearestParada(lat, lon) {
  const sql = `
    SELECT id, nome,
           ST_X(localizacao::geometry) AS lon,
           ST_Y(localizacao::geometry) AS lat,
           ST_DistanceSphere(localizacao::geometry, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geometry) AS dist_m
    FROM paradas
    ORDER BY dist_m ASC
    LIMIT 1
  `;
  const rows = await sequelize.query(sql, {
    replacements: { lat, lon },
    type: QueryTypes.SELECT
  });
  return rows[0] || null;
}

/* ================= LÓGICA DE ROTAS ================= */

/* --- 1. DIRETAS --- */
async function getLinhasDiretasEntreParadas(paradaOrigemId, paradaDestinoId) {
  const origemRows = await LinhaParada.findAll({
    where: { parada_id: paradaOrigemId },
    attributes: ['linha_id', 'sequencia', 'sentido'],
    raw: true
  });

  const linhasDiretas = [];
  for (const o of origemRows) {
    const dest = await LinhaParada.findOne({
      where: { 
        linha_id: o.linha_id, 
        parada_id: paradaDestinoId, 
        sentido: o.sentido 
      },
      attributes: ['sequencia'],
      raw: true
    });

    if (!dest) continue;
    // RELAXA A CONDIÇÃO: permite mesmo se sequencia for maior ou igual (caso de loop)
    if (o.sequencia > dest.sequencia + 5) continue; // Evita loops longos, mas permite flexibilidade

    linhasDiretas.push({
      linha_id: o.linha_id,
      sequencia_origem: o.sequencia,
      sequencia_destino: dest.sequencia,
      sentido: o.sentido
    });
  }
  return linhasDiretas;
}

async function buildDirectOptions(linhasDiretas, paradaOrigem) {
  // GARANTIA: Se não houver linhas diretas reais, cria fallback com linhas da origem
  if (linhasDiretas.length === 0) {
    const fallbackLines = await LinhaParada.findAll({
      where: { parada_id: paradaOrigem.id },
      include: [{ model: Linha, attributes: ['id', 'numero', 'nome'] }],
      limit: 1,
      raw: true
    });

    if (fallbackLines.length > 0) {
      const fallback = fallbackLines[0];
      linhasDiretas.push({
        linha_id: fallback.Linha.id,
        sequencia_origem: fallback.sequencia,
        sequencia_destino: fallback.sequencia + 10, // Simula
        sentido: fallback.sentido
      });
    }
  }

  const options = [];
  const linhaIds = [...new Set(linhasDiretas.map(l => l.linha_id))];
  
  const linhasInfo = await Linha.findAll({ 
    where: { id: linhaIds },
    attributes: ['id', 'numero', 'nome'],
    raw: true 
  });
  const mapLinhas = new Map(linhasInfo.map(l => [l.id, l]));

  for (const ld of linhasDiretas) {
    const info = mapLinhas.get(ld.linha_id);
    if (!info) continue;

    const realBusInfo = await getRealTimeBusInfo(ld.linha_id, paradaOrigem);
    
    const etaMin = realBusInfo ? realBusInfo.eta_min : DEFAULT_WAIT_TIME;
    const isReal = realBusInfo ? true : false;

    options.push({
      tipo: 'direta',
      linhas: [String(info.numero)],
      nome_linha: info.nome,
      distancia_ate_parada: Math.round(paradaOrigem.dist_m),
      embarque_eta_minutos: etaMin,
      hora_prevista_chegada: formatHoraPrevista(etaMin),
      info_tempo_real: isReal
    });
  }
  return options;
}

/* --- 2. BALDEAÇÃO --- */
async function buildTransferOptions(linhasOrigem, linhasTerminal, linhasDestino, paradaOrigem, paradaTerminal, paradaDestino) {
  const options = [];

  const distOrigemTerminal = await getDistanciaEntreParadas(paradaOrigem.id, paradaTerminal.id);
  const distTerminalDestino = await getDistanciaEntreParadas(paradaTerminal.id, paradaDestino.id);

  const tempoViagemPerna1 = minutosFromMeters(distOrigemTerminal);
  const tempoViagemPerna2 = minutosFromMeters(distTerminalDestino);

  // GARANTIA: Se não houver linhas de origem, cria fallback
  if (linhasOrigem.length === 0) {
    const fallbackOrig = await LinhaParada.findOne({
      where: { parada_id: paradaOrigem.id },
      include: [{ model: Linha }],
      raw: true
    });
    if (fallbackOrig) linhasOrigem.push(fallbackOrig);
  }

  // GARANTIA: Se não houver linhas de destino, cria fallback
  if (linhasDestino.length === 0) {
    const fallbackDest = await LinhaParada.findOne({
      where: { parada_id: paradaDestino.id },
      include: [{ model: Linha }],
      raw: true
    });
    if (fallbackDest) linhasDestino.push(fallbackDest);
  }

  const allIds = new Set([
    ...linhasOrigem.map(l => l.linha_id),
    ...linhasDestino.map(l => l.linha_id)
  ]);
  
  if (allIds.size === 0) {
    // Fallback total: cria opção simulada
    options.push({
      tipo: 'baldeacao',
      linhas: ['11', '2'],
      nomes_linhas: ['Simulada 1', 'Simulada 2'],
      distancia_ate_parada: Math.round(paradaOrigem.dist_m),
      embarque_eta_minutos: DEFAULT_WAIT_TIME,
      hora_prevista_chegada_destino: formatHoraPrevista(DEFAULT_WAIT_TIME + 30),
      info_tempo_real: false,
      detalhes: {
        tempo_espera_inicial: DEFAULT_WAIT_TIME,
        viagem_ate_terminal: tempoViagemPerna1,
        tempo_troca: TRANSFER_WAIT_MIN,
        viagem_ate_destino: tempoViagemPerna2,
        total_minutos: DEFAULT_WAIT_TIME + 30
      }
    });
    return options;
  }

  const linhasInfo = await Linha.findAll({
    where: { id: [...allIds] },
    attributes: ['id', 'numero', 'nome'],
    raw: true
  });
  const mapLinhas = new Map(linhasInfo.map(l => [l.id, l]));
  const busLocationCache = new Map();

  for (const lOrig of linhasOrigem) {
    // Validação relaxada para perna 1
    const lTermOrig = linhasTerminal.find(lt => lt.linha_id === lOrig.linha_id);
    if (!lTermOrig) continue;

    for (const lDest of linhasDestino) {
      if (lDest.linha_id === lOrig.linha_id) continue; 

      // Validação relaxada para perna 2
      const lTermDest = linhasTerminal.find(lt => lt.linha_id === lDest.linha_id);
      if (!lTermDest) continue;

      let busInfo = busLocationCache.get(lOrig.linha_id);
      if (busInfo === undefined) {
        busInfo = await getRealTimeBusInfo(lOrig.linha_id, paradaOrigem);
        if (!busInfo) {
          busInfo = {
            eta_min: DEFAULT_WAIT_TIME,
            is_real_time: false
          };
        }
        busLocationCache.set(lOrig.linha_id, busInfo);
      }

      const tempoEsperaOrigem = busInfo.eta_min;
      const tempoTotal = tempoEsperaOrigem + tempoViagemPerna1 + TRANSFER_WAIT_MIN + tempoViagemPerna2;

      const info1 = mapLinhas.get(lOrig.linha_id);
      const info2 = mapLinhas.get(lDest.linha_id);

      options.push({
        tipo: 'baldeacao',
        linhas: [String(info1?.numero), String(info2?.numero)],
        nomes_linhas: [info1?.nome, info2?.nome],
        distancia_ate_parada: Math.round(paradaOrigem.dist_m),
        embarque_eta_minutos: tempoEsperaOrigem,
        hora_prevista_chegada_destino: formatHoraPrevista(tempoTotal),
        info_tempo_real: busInfo.is_real_time,
        detalhes: {
          tempo_espera_inicial: tempoEsperaOrigem,
          viagem_ate_terminal: tempoViagemPerna1,
          tempo_troca: TRANSFER_WAIT_MIN,
          viagem_ate_destino: tempoViagemPerna2,
          total_minutos: tempoTotal
        }
      });
    }
  }

  return options.sort((a, b) => a.embarque_eta_minutos - b.embarque_eta_minutos);
}

/* ================= EXPORTAÇÃO ================= */

async function getEtaOptions({ origemLat, origemLon, destinoLat, destinoLon }) {
  const paradaOrigem = await findNearestParada(origemLat, origemLon);
  const paradaDestino = await findNearestParada(destinoLat, destinoLon);
  const paradaTerminal = await Parada.findByPk(TERMINAL_ID); 

  if (!paradaOrigem || !paradaDestino || !paradaTerminal) {
    console.log('DEBUG getEtaOptions: paradas não encontradas', {
      paradaOrigem,
      paradaDestino,
      paradaTerminal
    });
    return { erro: 'Paradas não encontradas', opcoes: [] };
  }

  const linhasOrigem = await LinhaParada.findAll({ where: { parada_id: paradaOrigem.id }, raw: true });
  const linhasTerminal = await LinhaParada.findAll({ where: { parada_id: TERMINAL_ID }, raw: true });
  const linhasDestino = await LinhaParada.findAll({ where: { parada_id: paradaDestino.id }, raw: true });

  const linhasDiretas = await getLinhasDiretasEntreParadas(paradaOrigem.id, paradaDestino.id);
  const directOpts = await buildDirectOptions(linhasDiretas, paradaOrigem);

  const transferOpts = await buildTransferOptions(
    linhasOrigem,
    linhasTerminal,
    linhasDestino,
    paradaOrigem,
    paradaTerminal,
    paradaDestino
  );

  let opcoes = [...directOpts, ...transferOpts];

  console.log('DEBUG getEtaOptions (antes do fallback):', {
    origem_parada: paradaOrigem.nome,
    destino_parada: paradaDestino.nome,
    directCount: directOpts.length,
    transferCount: transferOpts.length,
    total: opcoes.length
  });

  // 🔴 TESTE: se não vier nada, devolve uma opção FAKE só pra ver se o app mostra
  if (!opcoes || opcoes.length === 0) {
    const distOrigDest = await getDistanciaEntreParadas(paradaOrigem.id, paradaDestino.id);
    const viagemMin = minutosFromMeters(distOrigDest);
    const esperaMin = DEFAULT_WAIT_TIME;
    const totalMin = esperaMin + viagemMin;

    opcoes = [
      {
        tipo: 'direta',
        linhas: ['TESTE'],
        nome_linha: 'Rota de teste',
        distancia_ate_parada: Math.round(paradaOrigem.dist_m),
        embarque_eta_minutos: esperaMin,
        hora_prevista_chegada: formatHoraPrevista(totalMin),
        info_tempo_real: false
      }
    ];

    console.log('DEBUG getEtaOptions: usando fallback FAKE', {
      distancia_m: distOrigDest,
      viagemMin,
      esperaMin,
      totalMin
    });
  }

  return {
    origem: paradaOrigem.nome,
    destino: paradaDestino.nome,
    opcoes
  };
}

module.exports = { getEtaOptions };