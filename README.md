# MobTech Solutions 📱🚌  
**MobTech Solutions** é um **aplicativo mobile multiplataforma** desenvolvido para oferecer **rastreamento em tempo real de viagens rodoviárias**, além de permitir que empresas de ônibus gerenciem suas frotas de forma eficiente. Este projeto faz parte do nosso **Trabalho de Conclusão de Curso (TCC)** em Engenharia de Software.

## Objetivo do Projeto 🎯  
Criar uma solução tecnológica para modernizar o transporte rodoviário de passageiros, oferecendo:  
- Visualização em tempo real da localização do ônibus.  
- Tempo estimado de chegada ao destino (ETA).  
- Status da viagem: em andamento, atrasado, concluído.  
- Integração com serviços complementares ao final da viagem (Uber, restaurantes, hotéis).  
- Dashboard para empresas cadastrarem e monitorarem suas viagens.

## Tecnologias Utilizadas 🛠️  
- **Frontend (Mobile)**: React Native  
- **Backend (API)**: FastAPI (Python)  
- **Banco de Dados**: PostgreSQL com PostGIS  
- **Mapa Interativo**: Google Maps API  
- **Notificações**: Firebase Cloud Messaging (planejado)  
- **Versionamento**: Git e GitHub

## Estrutura do Projeto 📁   
```
mobtech/
├── assets/                   # Ícones, imagens e logos
├── src/
│   ├── components/           # Componentes reutilizáveis (Botões, Cards, etc)
│   ├── screens/              # Telas da aplicação
│   │   ├── HomeScreen.js
│   │   ├── ViagemScreen.js
│   │   └── AdminScreen.js
│   ├── services/             # Requisições à API, hooks
│   │   └── api.js
│   ├── App.js                # Componente principal do app
│   └── navigation.js         # Configuração de navegação (React Navigation)
├── backend/
│   ├── main.py               # Entrada da API FastAPI
│   ├── models.py             # Modelos de dados
│   ├── routes.py             # Rotas/endpoints
│   └── database.py           # Conexão com PostgreSQL
├── database/
│   └── mock_data.json        # Viagens simuladas, se quiser
├── README.md
├── .gitignore
├── package.json
└── requirements.txt          # Dependências do backend (FastAPI, etc)
```

## Funcionalidades 🚀  
- Rastreamento de ônibus com mapa interativo.  
- Detalhes da viagem atual em tempo real.  
- Integração com APIs externas (rota, tempo estimado, notificações).  
- Interface intuitiva para empresas e passageiros.  
- Sugestões de mobilidade e locais ao final da viagem.  

## Como Executar o Projeto 🖥️  

1. Clone o repositório:  
   ```bash
   git clone https://github.com/CalebeRRdev/mobtech-solutions.git
   ```

2.	Navegue até o diretório do projeto e instale as dependências:
   ```bash
   cd mobtech-solutions
   npm install
   ```

3.	Execute o app em modo de desenvolvimento:
   ```bash
   npx expo start
   ```

4.	Use um emulador ou o app do Expo no celular para visualizar.

Próximos Passos 🛤️
	•	Desenvolver telas e navegação no React Native.
	•	Criar endpoints REST com FastAPI para viagens e login.
	•	Integrar GPS e exibir localização real dos ônibus.
	•	Desenvolver painel de empresa com autenticação.
	•	Implementar sugestões baseadas na localização do destino.
	•	Adicionar sistema de notificações com Firebase.

## Autores ✍️  
- [CalebeRRdev](https://github.com/CalebeRRdev)  
- [Amulvhor](https://github.com/Amulvhor)  
- [Gabrielrc1](https://github.com/Gabrielrc1)