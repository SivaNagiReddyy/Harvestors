import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://munagala-harvestors-api.vercel.app';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const machineOwnerAPI = {
  getAll: () => api.get('/machine-owners'),
  getById: (id) => api.get(`/machine-owners/${id}`),
  create: (data) => api.post('/machine-owners', data),
  update: (id, data) => api.put(`/machine-owners/${id}`, data),
  delete: (id) => api.delete(`/machine-owners/${id}`),
};

export const machineAPI = {
  getAll: () => api.get('/machines'),
  getById: (id) => api.get(`/machines/${id}`),
  getByOwner: (ownerId) => api.get(`/machines/owner/${ownerId}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
};

export const farmerAPI = {
  getAll: () => api.get('/farmers'),
  getById: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  delete: (id) => api.delete(`/farmers/${id}`),
};

export const fieldAPI = {
  getAll: () => api.get('/fields'),
  getById: (id) => api.get(`/fields/${id}`),
  getByFarmer: (farmerId) => api.get(`/fields/farmer/${farmerId}`),
  create: (data) => api.post('/fields', data),
  update: (id, data) => api.put(`/fields/${id}`, data),
  delete: (id) => api.delete(`/fields/${id}`),
};

export const jobAPI = {
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  getByMachineOwner: (ownerId) => api.get(`/jobs/machine-owner/${ownerId}`),
  getByFarmer: (farmerId) => api.get(`/jobs/farmer/${farmerId}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getByType: (type) => api.get(`/payments/type/${type}`),
  getByMachineOwner: (ownerId) => api.get(`/payments/machine-owner/${ownerId}`),
  getByFarmer: (farmerId) => api.get(`/payments/farmer/${farmerId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

export const advanceAPI = {
  getAll: () => api.get('/advances'),
  getById: (id) => api.get(`/advances/${id}`),
  getByMachine: (machineId) => api.get(`/advances/machine/${machineId}`),
  create: (data) => api.post('/advances', data),
  update: (id, data) => api.put(`/advances/${id}`, data),
  delete: (id) => api.delete(`/advances/${id}`),
};

export const dashboardAPI = {
  getStats: (queryParam = '') => api.get(`/dashboard/stats${queryParam}`),
};

export default api;
