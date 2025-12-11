# Testes de Backend (MobTech Solutions)

## Ambiente de teste

- Banco: `mobtech_test` (PostgreSQL + PostGIS)
- Ferramentas:
  - Jest
  - Supertest
- Arquivo de configuração:
  - `.env.test` com usuário/senha próprios de teste
- Comando de execução:

```bash
npm test -- --coverage

## Escopo dos testes automatizados

1. Testes de sanidade (Jest)
2. Testes de desempenho / integração do endpoint `/rotas`
3. (Opcional) Testes unitários de funções utilitárias (geoUtils)

## 1. Sanidade

Arquivo: `tests/sanity.test.js`  
Objetivo: validar ambiente de teste (Jest funcionando).

## 2. Desempenho /rotas

Arquivo: `tests/performance/rotas.performance.test.js`  
Cenário:
- 5 chamadas consecutivas ao endpoint `POST /rotas`
- Corpo com origem e destino em Anápolis
- Meta: tempo médio < 800ms e status 200 em todas as respostas

Última execução (DATA):
- Tempos individuais (ms): [379, 11, 11, 10, 10]
- Tempo médio: 84,2 ms
- Status HTTP: 200 em 5/5 requisições

## 3. Cobertura

Comando: `npm test -- --coverage`

Última execução (DATA):
- Cobertura global (statements): 42%
- Controllers: ~51%
- Models: 100%
- Routes: 100%
- Utils: 75%