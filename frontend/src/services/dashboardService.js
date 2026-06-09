import apiClient from './api';

export const dashboardService = {
  getStats: async () => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  },

  getRecentCandidates: async (limit = 10) => {
    const { data } = await apiClient.get('/dashboard/recent-candidates', {
      params: { limit },
    });
    return data;
  },

  getCandidatesByStatus: async () => {
    const { data } = await apiClient.get('/dashboard/candidates-by-status');
    return data;
  },

  getOpenPositions: async () => {
    const { data } = await apiClient.get('/dashboard/open-positions');
    return data;
  },
};

