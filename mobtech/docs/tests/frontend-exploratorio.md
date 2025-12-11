# Testes Exploratórios de Frontend

Objetivo: validar comportamento das telas principais (Home, Rotas recomendadas, Detalhes da rota, Tracking) em estados de sucesso, erro e carregamento.

## Cenário 1: Seleção de origem/destino e rotas recomendadas

Passos:
1. Abrir o app.
2. Autorizar o uso da localização.
3. Definir origem atual e destino (Anápolis -> endereço X).
4. Verificar:
   - [ ] Exibe "Buscando rotas..."
   - [ ] Lista de rotas com ETA e distância.
   - [ ] Mensagem amigável se nenhuma rota é encontrada.

Resultado (DATA):  
- Dispositivo: iPhone / Android  
- Status: ✅ Sucesso / ❌ Falha  
- Observações: ...

## Cenário 2: Erro ao carregar rotas (simular backend offline)

Passos:
1. Derrubar o backend (`Ctrl+C` no servidor Express).
2. No app, tentar buscar rotas novamente.
3. Verificar:
   - [ ] Exibe mensagem de erro ("Não foi possível carregar as rotas.")
   - [ ] Spinner some após o erro
   - [ ] Botão de tentar novamente funciona após subir backend

...

## Cenário 3: Tela de tracking

Passos:
1. Selecionar rota.
2. Abrir "Acompanhar viagem".
3. Verificar:
   - [ ] Ônibus aparece no mapa.
   - [ ] Trajeto futuro (azul) e passado (cinza) são exibidos.
   - [ ] Mensagem de fallback se não há localização do ônibus.

Resultado (DATA): ...