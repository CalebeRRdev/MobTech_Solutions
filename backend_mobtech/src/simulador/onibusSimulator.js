/*
  src/simulador/onibusSimulator.js

  Simulador de ônibus (versão revisada)
  - Baseado nas paradas reais (linha_parada -> paradas.localizacao)
  - Usa carregamento por sentido (campo `sentido` em linha_parada)
  - Interpola entre paradas e atualiza a tabela localizacao_onibus
  - Atualização feita via query raw usando ST_GeomFromGeoJSON com replacements
  - Código limpo de imports não usados e com stop/start corretos

  Execução:
    node src/simulador/onibusSimulator.js
  Ou iniciar a partir do index.js do servidor:
    const { startSimulator } = require('./src/simulador/onibusSimulator');
    startSimulator({ STEP_COUNT: 10, STEP_INTERVAL_MS: 2500 });
*/

const { Onibus, LinhaParada, Parada, LocalizacaoOnibus, sequelize } = require('../models');

const DEFAULTS = {
  STEP_COUNT: 8,            // passos entre duas paradas
  STEP_INTERVAL_MS: 3000,   // ms entre passos
  STAGGER_MS: 600,          // delay inicial por ônibus para espalhar updates
  UPDATE_DB_EVERY_STEP: true, // se false -> atualiza no DB apenas ao final do segmento
  MAX_RETRY_ON_ERROR: 3
};

let running = false;
const simulators = new Map(); // onibusId -> controller

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function interp(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t
  };
}

async function carregarParadasPorLinha(linhaId) {
  const registros = await LinhaParada.findAll({
    where: { linha_id: linhaId },
    include: [{ model: Parada, attributes: ['id', 'nome', 'localizacao'] }],
    order: [['sequencia', 'ASC']],
    raw: false
  });

  const porSentido = {};
  for (const reg of registros) {
    const sentido = reg.sentido || 'ida';
    if (!porSentido[sentido]) porSentido[sentido] = [];
    if (!reg.Parada || !reg.Parada.localizacao || !reg.Parada.localizacao.coordinates) continue;
    const [lng, lat] = reg.Parada.localizacao.coordinates;
    porSentido[sentido].push({
      parada_id: reg.parada_id,
      sequencia: reg.sequencia,
      nome: reg.Parada.nome,
      localizacao: { lat, lng }
    });
  }

  return porSentido;
}

// Atualiza localizacao_onibus via query raw (ST_GeomFromGeoJSON)
async function atualizarLocalizacaoNoBanco(onibusId, latitude, longitude) {
  try {
    const geojson = JSON.stringify({
      type: 'Point',
      coordinates: [longitude, latitude], // Ordem correta para PostGIS
    });

    await sequelize.query(`
      INSERT INTO localizacao_onibus (onibus_id, localizacao, timestamp_atualizacao)
      VALUES (:id, ST_GeomFromGeoJSON(:geojson), NOW())
      ON CONFLICT (onibus_id)
      DO UPDATE SET
        localizacao = EXCLUDED.localizacao,
        timestamp_atualizacao = EXCLUDED.timestamp_atualizacao
    `, {
      replacements: { id: onibusId, geojson },
    });

    console.log(`🟢 Localização atualizada com sucesso para ônibus ${onibusId}`);
  } catch (err) {
    console.error(`🚨 Erro ao atualizar localização do ônibus ${onibusId}:`, err);
  }
}

async function iniciarSimuladorParaOnibus(onibus, config) {
  const { STEP_COUNT, STEP_INTERVAL_MS, UPDATE_DB_EVERY_STEP } = config;
  const linhaId = onibus.linha_id;

  const porSentido = await carregarParadasPorLinha(linhaId);
  const sentidos = Object.keys(porSentido);
  if (sentidos.length === 0) {
    console.warn(`Linha ${linhaId} sem paradas válidas. Pulando ônibus ${onibus.id}`);
    return;
  }

  let sentidoAtual = sentidos.includes('ida') ? 'ida' : sentidos[0];
  let routeParadas = porSentido[sentidoAtual];
  if (!routeParadas || routeParadas.length < 2) {
    console.warn(`Linha ${linhaId} sentido ${sentidoAtual} tem menos de 2 paradas. Pulando ônibus ${onibus.id}`);
    return;
  }

  // determinar posição inicial com base em localizacao_onibus se houver
  const lastLoc = await LocalizacaoOnibus.findOne({ where: { onibus_id: onibus.id }, raw: true });
  let indexAtual = 0;
  let stepStart = 0;

  if (lastLoc && lastLoc.localizacao && lastLoc.localizacao.coordinates) {
    const [lng, lat] = lastLoc.localizacao.coordinates;
    // achar parada mais proxima
    let melhorIdx = 0;
    let menorDist = Infinity;
    for (let i = 0; i < routeParadas.length; i++) {
      const p = routeParadas[i].localizacao;
      const dlat = p.lat - lat;
      const dlng = p.lng - lng;
      const d = Math.sqrt(dlat * dlat + dlng * dlng);
      if (d < menorDist) { menorDist = d; melhorIdx = i; }
    }
    indexAtual = Math.max(0, Math.min(routeParadas.length - 2, melhorIdx));
    stepStart = 0;
  }

  // stagger inicial
  const startDelay = (onibus.id % 10) * config.STAGGER_MS;
  await sleep(startDelay);

  const controller = { stop: false };
  simulators.set(onibus.id, controller);
  console.log(`Simulador: iniciado ônibus ${onibus.id} (linha ${linhaId}, sentido ${sentidoAtual}).`);

  let retryCount = 0;

  while (!controller.stop && running) {
    try {
      // recarregar paradas (caso tenham sido alteradas)
      const fresh = await carregarParadasPorLinha(linhaId);
      if (!fresh[sentidoAtual] || fresh[sentidoAtual].length < 2) {
        const alt = Object.keys(fresh).find(s => fresh[s] && fresh[s].length >= 2);
        if (!alt) throw new Error(`Linha ${linhaId} sem rotas válidas.`);
        sentidoAtual = alt;
      }
      routeParadas = fresh[sentidoAtual];

      if (indexAtual >= routeParadas.length - 1) indexAtual = routeParadas.length - 2;

      const origem = routeParadas[indexAtual].localizacao;
      const destino = routeParadas[indexAtual + 1].localizacao;

      // passos entre origem e destino
      for (let step = stepStart; step <= STEP_COUNT; step++) {
        if (controller.stop || !running) break;

        const t = step / STEP_COUNT;
        const pos = interp(origem, destino, t);

        // atualizar no banco conforme política
        if (UPDATE_DB_EVERY_STEP || step === STEP_COUNT) {
          await atualizarLocalizacaoNoBanco(onibus.id, pos.lat, pos.lng, new Date());
        }

        await sleep(STEP_INTERVAL_MS);
      }

      // avançar para próxima parada
      indexAtual += 1;
      stepStart = 0;

      // se chegou ao fim da rota, inverte sentido e reinicia
      if (indexAtual >= routeParadas.length - 1) {
        sentidoAtual = (sentidoAtual === 'ida') ? 'volta' : 'ida';
        const newPor = await carregarParadasPorLinha(linhaId);
        if (newPor[sentidoAtual] && newPor[sentidoAtual].length >= 2) {
          routeParadas = newPor[sentidoAtual];
          indexAtual = 0;
        } else {
          // se não houver outro sentido, recomeça do início do mesmo sentido
          indexAtual = 0;
        }
      }

      retryCount = 0;
    } catch (err) {
      console.error(`Simulador ônibus ${onibus.id} erro:`, err && err.message ? err.message : err);
      retryCount++;
      if (retryCount >= DEFAULTS.MAX_RETRY_ON_ERROR) {
        console.error(`Simulador ônibus ${onibus.id} parando após erros repetidos.`);
        controller.stop = true;
        break;
      }
      await sleep(2000);
    }
  }

  console.log(`Simulador: parado ônibus ${onibus.id}.`);
}

async function startSimulator(userConfig = {}) {
  if (running) return console.warn('Simulador já rodando.');
  running = true;
  const config = { ...DEFAULTS, ...userConfig };

  console.log('Inicializando simulador (config):', {
    STEP_COUNT: config.STEP_COUNT,
    STEP_INTERVAL_MS: config.STEP_INTERVAL_MS,
    STAGGER_MS: config.STAGGER_MS,
    UPDATE_DB_EVERY_STEP: config.UPDATE_DB_EVERY_STEP
  });

  try {
    const onibusList = await Onibus.findAll({ attributes: ['id', 'linha_id'], raw: true });
    if (!onibusList || onibusList.length === 0) {
      console.warn('Nenhum ônibus cadastrado.');
      return;
    }

    for (const b of onibusList) {
      // iniciar simulador sem await para rodar em paralelo
      (async () => {
        try {
          await iniciarSimuladorParaOnibus(b, config);
        } catch (err) {
          console.error(`Falha ao iniciar simulador ônibus ${b.id}:`, err);
        }
      })();

      // pequeno throttle
      await sleep(config.STAGGER_MS / 2);
    }
  } catch (err) {
    console.error('Erro ao iniciar simulador:', err);
    running = false;
    throw err;
  }
}

async function stopSimulator() {
  running = false;
  for (const controller of simulators.values()) {
    controller.stop = true;
  }
  simulators.clear();
  console.log('Simulador: parada solicitada para todos os ônibus.');
}

module.exports = { startSimulator, stopSimulator, DEFAULTS };

// execução standalone
if (require.main === module) {
  (async () => {
    try {
      await startSimulator();
      console.log('Simulador rodando (CTRL+C para parar).');
      process.on('SIGINT', async () => {
        console.log('SIGINT recebido — parando simulador...');
        await stopSimulator();
        process.exit(0);
      });
    } catch (err) {
      console.error('Falha ao executar simulador:', err);
      process.exit(1);
    }
  })();
}
