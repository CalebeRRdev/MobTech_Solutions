// backend_mobtech/tests/unit/geoUtils.test.js
const { getDistanceFromLatLonInKm } = require('../../src/utils/geoUtils');

describe('geoUtils - getDistanceFromLatLonInKm', () => {
  it('deve calcular distância aproximada correta entre Brasília e Anápolis', () => {
    const brasilia = { lat: -15.793889, lng: -47.882778 };
    const anapolis = { lat: -16.3281, lng: -48.9534 };

    const dist = getDistanceFromLatLonInKm(
      brasilia.lat,
      brasilia.lng,
      anapolis.lat,
      anapolis.lng
    );

    // distância real ~ 130–160 km -> mantemos intervalo confortável
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(200);
  });
});