// src/services/api.js
import axios from 'axios';

const API_URL = '10.160.201.28'; // ← SEU IP AQUI

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export default api;