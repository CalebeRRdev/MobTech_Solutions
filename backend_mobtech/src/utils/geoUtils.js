// src/utils/geoUtils.js
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distância em km
}

function estimarTempoCaminhada(distanciaKm) {
  const metros = distanciaKm * 1000;
  const velocidadeMedia = 83; // metros por minuto (≈ 5 km/h)
  return metros / velocidadeMedia; // minutos
}

function calcularTempoChegada(distanciaKm, velocidadeKmH = 25) {
  const tempoHoras = distanciaKm / velocidadeKmH;
  return Math.round(tempoHoras * 60); // em minutos
}

module.exports = { calcularDistancia, estimarTempoCaminhada, calcularTempoChegada };
