import axios from 'axios';

// TU IP (Revísala con ifconfig si cambió)
const API_URL = 'http://192.168.0.13:8000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;