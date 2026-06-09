import apiClient from './api';

export const requestService = {
  getAll: async (params) => {
    const { data } = await apiClient.get('/recruitment-requests', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await apiClient.get(`/recruitment-requests/${id}`);
    return data;
  },

  create: async (request) => {
    const { data } = await apiClient.post('/recruitment-requests', request);
    return data;
  },

  update: async (id, updates) => {
    const { data } = await apiClient.put(`/recruitment-requests/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    await apiClient.delete(`/recruitment-requests/${id}`);
  },
};

