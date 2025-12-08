// src/services/api.js  (ou service/api.js se for esse o caminho certo)
import axios from 'axios';
import { Platform } from 'react-native';

// iOS Simulator enxerga o host como "localhost"
// Android Emulator usa 10.0.2.2 para acessar o host
const HOST =
  Platform.OS === 'android'
    ? '10.0.2.2'
    : 'localhost';

const api = axios.create({
  baseURL: `http://${HOST}:3000`, // MESMA PORTA do backend (node index.js)
  timeout: 15000,
});

console.log('[API] baseURL =>', api.defaults.baseURL);

export default api;