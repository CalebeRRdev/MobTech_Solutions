# 🚌 MobTech Solutions - Bus App

Aplicativo **mobile multiplataforma** para **rastreamento em tempo real de ônibus do transporte público urbano**.  
Este projeto faz parte do **TCC de graduação** e apresenta um protótipo funcional **validado em um piloto municipal em Anápolis-GO**, com arquitetura **SaaS-ready**, podendo ser adaptado para outras cidades/operadoras.  
O app reduz a imprevisibilidade da viagem ao exibir no mapa **localização do ônibus, status do trajeto e ETA dinâmico**, além de suportar notificações quando necessário. 

---

## 🚀 Tecnologias Utilizadas

### Frontend
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/) (com Expo Router v5)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) (coleta de posição do usuário)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps) + Google Maps
- [Google Maps Platform](https://developers.google.com/maps) (geocodificação, rotas e visualização)
- [Axios](https://axios-http.com/) (consumo da API)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)

### Backend
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) *(API REST atual do protótipo)*
- [PostgreSQL](https://www.postgresql.org/) + [PostGIS](https://postgis.net/) *(armazenamento e consultas espaciais)*
- [Sequelize ORM](https://sequelize.org/) *(modelagem e acesso ao banco)*
- [@turf/turf](https://turfjs.org/) *(operações geoespaciais auxiliares no backend)*
- Atualização de dados via **polling periódico** *(sincronização frequente de posições e ETA)* 

> **Observação:** módulos como autenticação/gestão administrativa e notificações push completas podem ser incorporados em evoluções futuras do SaaS.

---

## 📂 Estrutura do Projeto

```bash
MobTech_Solutions/
│
├── backend_mobtech/          # API REST do protótipo
│   ├── index.js              # Entry point do servidor (Node.js / Express)
│   ├── package.json          # Dependências e scripts do backend
│   ├── package-lock.json
│   └── .gitignore
│
└── mobtech/                  # Aplicativo mobile (Expo + React Native)
    ├── app/                  # Telas principais e rotas (Expo Router)
    │   └── (tabs)/           # Navegação em abas
    │       ├── index.tsx
    │       ├── profile.tsx
    │       ├── ticket.tsx
    │       └── _layout.tsx
    │
    ├── assets/               # Ícones, imagens e splash
    ├── components/           # Componentes reutilizáveis (ex.: SearchForm)
    ├── service/              # Integração com API
    ├── ios/                  # Build iOS (gerado pelo expo run:ios)
    ├── node_modules/         # Dependências instaladas
    ├── types/                # Tipagens auxiliares (TypeScript)
    ├── .expo/                # Configurações internas do Expo
    ├── .vscode/              # Configurações do VSCode
    ├── app.json              # Configuração do app Expo
    ├── eas.json              # Configuração para builds com EAS
    ├── package.json          # Dependências do frontend
    ├── tsconfig.json         # Configuração TypeScript
    ├── eslint.config.js      # Regras de lint
    └── README.md             # Documentação do frontend
```

---

## ⚙️ Pré-requisitos
-	Node.js >= 18
-	npm ou yarn
-	Expo CLI
-	Xcode (para iOS) ou Android Studio (para Android)

---

## ▶️ Como Rodar:


1º passo: Clone o repositório e entre no frontend:
```
git clone https://github.com/seu-usuario/mobtech-solutions.git
cd mobtech-solutions/MobTech_Solutions/mobtech
```
2º passo: Instale as dependências do frontend:
```
npm install
# ou
yarn install
```
3º passo: Rode o aplicativo

➡️ Expo Go (mais simples, sem recursos nativos)
```
npx expo start -c
```

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

4º passo: Rode o backend (em outro terminal)

Entre na pasta BACKEND:
```
cd ../backend_mobtech
npm install
npm start
```
---

## ✨ Roadmap
-	Ampliar a validação prática com usuários em diferentes linhas e horários.
-	Evoluir a estratégia de atualização para comunicação em tempo real quando necessário (além do polling).
-	Incluir filtros avançados de rotas, histórico do usuário e recursos de acessibilidade.
-	Consolidar o modelo SaaS para adoção por outras cidades/operadoras.

---

## Autores ✍️  
- [CalebeRRdev](https://github.com/CalebeRRdev)  
- [Amulvhor](https://github.com/Amulvhor)  
- [Gabrielrc1](https://github.com/Gabrielrc1)
