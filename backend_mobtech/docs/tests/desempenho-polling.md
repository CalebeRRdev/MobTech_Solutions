# Teste de Estabilidade do Polling

Objetivo: verificar se o aplicativo mantém o acompanhamento em tempo real sem erros durante uso prolongado.

Procedimento:
1. Iniciar backend e simulador de ônibus.
2. Abrir o app, selecionar uma rota e entrar na tela de tracking.
3. Deixar a tela aberta por 15 minutos, sem interações.
4. Observar:
   - [ ] Se o marcador do ônibus continua se movendo.
   - [ ] Se não aparecem erros de rede.
   - [ ] Se o app não trava ou fecha.

Resultado (DATA):
- Duração do teste: 15 min
- Erros observados: nenhum / descrição
- Status: ✅ Estável / ❌ Problemas