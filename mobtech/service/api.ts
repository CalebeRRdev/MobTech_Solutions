// src/services/api.js
import axios from 'axios';

const API_URL = 'http://192.168.1.106:3000'; // ← SEU IP AQUI

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export default api;