# MobTech Solutions 🚌💻  
**MobTech Solutions** é uma plataforma web responsiva desenvolvida para oferecer **rastreamento em tempo real de viagens rodoviárias**, além de permitir que empresas de ônibus gerenciem suas frotas de forma eficiente. Este projeto faz parte do nosso **Trabalho de Conclusão de Curso (TCC)** em Engenharia de Software.

## Objetivo do Projeto 🎯  
Criar uma solução tecnológica para modernizar o transporte rodoviário de passageiros, oferecendo:  
- Visualização em tempo real da localização do ônibus.  
- Tempo estimado de chegada ao destino (ETA).  
- Status da viagem: em andamento, atrasado, concluído.  
- Integração com serviços complementares ao final da viagem (Uber, restaurantes, hotéis).  
- Dashboard para empresas cadastrarem e monitorarem suas viagens.

## Tecnologias Utilizadas 🛠️  
- **Frontend**: HTML, CSS, JavaScript  
- **Mapa Interativo**: Google Maps API  
- **Backend (em desenvolvimento)**: Node.js ou Python (FastAPI/Django)  
- **Banco de Dados (em planejamento)**: PostgreSQL com PostGIS  
- **Notificações**: Firebase Cloud Messaging (planejado)  

## Estrutura do Projeto 📁  
```
mobtech/
├── assets/              # Imagens, ícones e arquivos estáticos
├── css/                 # Estilos da interface
│   └── style.css
├── js/                  # Scripts de interação
│   └── script.js
├── data/                # Arquivos simulados de viagens e rotas
│   └── trips.json
├── index.html           # Página principal do sistema
├── admin.html           # Dashboard administrativo (em desenvolvimento)
├── viagem.html          # Página de rastreamento da viagem (em desenvolvimento)
└── README.md            # Documentação do projeto
```

## Funcionalidades 🚀  
- Mapa interativo com a posição do ônibus.  
- Detalhes da viagem em tempo real.  
- Integração com APIs para cálculo de rota e tempo.  
- Interface pensada para empresas e passageiros.  
- Planejamento para sugestões de mobilidade no destino.  

## Como Executar o Projeto 🖥️  
1. Clone o repositório:  
   ```bash
   git clone https://github.com/CalebeRRdev/mobtech-solutions.git
   ```
2. Abra o arquivo `index.html` no navegador para simular o funcionamento inicial.  
3. As páginas `admin.html` e `viagem.html` estão sendo desenvolvidas nas próximas etapas do projeto.

## Próximos Passos 🛤️  
- Carregar e exibir os dados simulados de viagens do arquivo `trips.json` na página `admin.html`.  
- Criar a interface da página `viagem.html` com mapa e dados da viagem simulada.  
- Simular localização do ônibus usando JavaScript, com movimentação no mapa.  
- Criar sistema de login e autenticação para empresas.  
- Desenvolver o painel administrativo completo.  
- Integrar localização via GPS com base em dados reais.  
- Criar sistema de notificações ao passageiro.  
- Implementar painel com sugestões ao fim da viagem.

## Autores ✍️  
- [CalebeRRdev](https://github.com/CalebeRRdev)  
- [Amulvhor](https://github.com/Amulvhor)  
- [Gabrielrc1](https://github.com/Gabrielrc1)