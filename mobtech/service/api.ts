// src/services/api.js
import axios from 'axios';

const API_URL = ''; // ← SEU IP AQUI

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export default api;