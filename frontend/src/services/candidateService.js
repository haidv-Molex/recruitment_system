import apiClient from './api';

export const candidateService = {
  getAll: async (params) => {
    const { data } = await apiClient.get('/candidates', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await apiClient.get(`/candidates/${id}`);
    return data;
  },

  create: async (candidate) => {
    const { data } = await apiClient.post('/candidates', candidate);
    return data;
  },

  update: async (id, updates) => {
    const { data } = await apiClient.put(`/candidates/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    await apiClient.delete(`/candidates/${id}`);
  },

  uploadCV: async (candidateId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/candidates/${candidateId}/cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

