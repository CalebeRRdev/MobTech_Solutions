# Testes de Fluxo Ponta a Ponta (E2E)

Objetivo: Exercitar o fluxo completo do passageiro, integrando frontend (Expo) + backend Express + Postgres/PostGIS.

## Cenário E2E-01: Viagem simples com uma linha

Passos:
1. Iniciar o backend (NODE_ENV=development) e simulador de ônibus.
2. Abrir o app MobTech no dispositivo (iOS e Android).
3. Autorizar a localização.
4. Definir origem como "Localização atual".
5. Definir destino como "Ponto de referência X, Anápolis".
6. Selecionar uma rota direta (sem baldeação).
7. Abrir a tela de detalhes da rota.
8. Tocar em "Acompanhar viagem".

Critérios de sucesso:
- [ ] Uma ou mais rotas são exibidas.
- [ ] O ETA dinâmico aparece nos cartões de rota.
- [ ] A tela de detalhes mostra o trajeto (caminhada + ônibus + caminhada).
- [ ] A tela de tracking mostra o ônibus em movimento.

Resultado (DATA):
- Dispositivo iOS: ✅ / ❌
- Dispositivo Android: ✅ / ❌
- Observações: ...

## Cenário E2E-02: Usuário recusa localização

...

## Cenário E2E-03: Baldeação entre duas linhas

...