import apiClient from './api';

export const createLevelApi = async (code, name, description) => {
  try {
    const response = await apiClient.post('/level', {
      level_code: code,
      level_name: name,
      level_description: description,
    });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create level failed.' };
    }

    const d = body.data;
    const level = {
      id: d.level_id,
      code: d.level_code,
      name: d.level_name,
      description: d.level_description || '',
    };

    return { success: true, message: body.message, level };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Create level failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchLevelsApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/level/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, levels: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend level list and map to frontend format
    const levels = list.map((d) => ({
      id: d.level_id,
      code: d.level_code,
      name: d.level_name,
      description: d.level_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, levels, pagination };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, levels: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, levels: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, levels: [], pagination: null, message: err.message };
  }
};

export const getLevelApi = async (id) => {
  try {
    const response = await apiClient.get('/level', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get level failed.' };
    }

    const d = body.data;
    const level = {
      id: d.level_id,
      code: d.level_code,
      name: d.level_name,
      description: d.level_description || '',
    };

    return { success: true, level };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get level failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateLevelApi = async (id, code, name, description) => {
  try {
    const response = await apiClient.put(
      '/level',
      {
        level_code: code,
        level_name: name,
        level_description: description,
      },
      { params: { id } }
    );
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update level failed.' };
    }

    const d = body.data;
    const level = {
      id: d.level_id,
      code: d.level_code,
      name: d.level_name,
      description: d.level_description || '',
    };

    return { success: true, message: body.message, level };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Update level failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteLevelApi = async (id) => {
  try {
    const response = await apiClient.delete('/level', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete level failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete level failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};