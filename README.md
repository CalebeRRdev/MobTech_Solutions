# 🚌 MobTech Solutions - Bus App

Aplicativo **mobile multiplataforma** para rastreamento de viagens rodoviárias e gestão de ônibus intermunicipais.  
Este projeto faz parte do TCC de graduação e tem como objetivo demonstrar a viabilidade técnica de um **SaaS adaptável** para empresas de transporte rodoviário.
---
## 🚀 Tecnologias Utilizadas

### Frontend
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/) (com Expo Router v5)
- [TypeScript](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Maps](https://docs.expo.dev/versions/latest/sdk/maps/)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [PostgreSQL](https://www.postgresql.org/) + [PostGIS](https://postgis.net/) (para geolocalização)
- Firebase (notificações e autenticação futura)
---
## Estrutura do Projeto 📁   
```
MobTech_Solutions/
│
├── BACKEND/                  # API para suporte ao app
│   ├── index.js              # Entry point do servidor (Node.js / Express ou similar)
│   ├── package.json          # Dependências e scripts do backend
│   ├── package-lock.json
│   └── .gitignore
│
└── FRONTEND/
    └── bus-app/              # Aplicativo mobile (Expo + React Native)
        ├── app/              # Telas principais e rotas (Expo Router)
        │   └── (tabs)/       # Navegação em abas (Home, Tickets, Profile)
        │       ├── index.tsx
        │       ├── profile.tsx
        │       ├── ticket.tsx
        │       └── _layout.tsx
        │
        ├── assets/           # Ícones, imagens e splash
        ├── components/       # Componentes reutilizáveis (ex.: SearchForm)
        │   └── searchForm.tsx
        │
        ├── ios/              # Build iOS (gerado pelo expo run:ios)
        ├── node_modules/     # Dependências instaladas
        ├── types/            # Tipagens auxiliares (TypeScript)
        ├── .expo/            # Configurações internas do Expo
        ├── .vscode/          # Configurações do VSCode
        ├── app.json          # Configuração do app Expo
        ├── eas.json          # Configuração para builds com Expo Application Services
        ├── package.json      # Dependências do frontend
        ├── tsconfig.json     # Configuração TypeScript
        ├── eslint.config.js  # Regras de lint
        └── README.md         # Documentação do frontend
```
---
⚙️ Pré-requisitos
	•	Node.js >= 18
	•	npm ou yarn
	•	Expo CLI
	•	Xcode (para iOS) ou Android Studio (para Android)
---
▶️ Como Rodar:

1º passo: Clone o repositório
```
git clone https://github.com/seu-usuario/mobtech-solutions.git
cd mobtech-solutions/MobTech_Solutions/FRONTEND/bus-app
```
2º passo: Instale as dependências
```
npm install
# ou
yarn install
```
3º passo: Rodar o aplicativo
Existem algumas opções:

➡️ Expo Go (mais simples, sem recursos nativos)
1.	Inicie o servidor Metro:
```
npx expo start -c
```
2.	Escaneie o QR Code com o app Expo Go (disponível na App Store e Google Play).

➡️ Emulador Android
	1.	Configure o Android Studio.
	2.	Crie e inicie um dispositivo virtual (AVD).
	3.	Rode:
```
npx expo run:android
```
➡️ Simulador iOS (somente macOS)
	1.	Instale o Xcode.
	2.	Rode:
```
npx expo run:ios
```

4º passo: Rodar o backend
Entre na pasta BACKEND:
```
cd mobtech-solutions/MobTech_Solutions/BACKEND
npm install
npm start
```
---
## Autores ✍️  
- [CalebeRRdev](https://github.com/CalebeRRdev)  
- [Amulvhor](https://github.com/Amulvhor)  
- [Gabrielrc1](https://github.com/Gabrielrc1)
