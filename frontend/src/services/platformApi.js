import apiClient from './api';

export const createPlatformApi = async (name, description) => {
  try {
    const response = await apiClient.post('/platform', {
      platform_name: name,
      platform_description: description,
    });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create platform failed.' };
    }

    const d = body.data;
    const platform = {
      id: d.platform_id,
      name: d.platform_name,
      description: d.platform_description || '',
    };

    return { success: true, message: body.message, platform };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Create platform failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchPlatformsApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/platform/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, platforms: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend platform list and map to frontend format
    const platforms = list.map((d) => ({
      id: d.platform_id,
      name: d.platform_name,
      description: d.platform_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, platforms, pagination };
  } catch (err) {
    // If API returns 404, endpoint doesn't exist yet
    if (err.response && err.response.status === 404) {
      return { success: true, platforms: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, platforms: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, platforms: [], pagination: null, message: err.message };
  }
};

export const getPlatformApi = async (id) => {
  try {
    const response = await apiClient.get('/platform', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get platform failed.' };
    }

    const d = body.data;
    const platform = {
      id: d.platform_id,
      name: d.platform_name,
      description: d.platform_description || '',
    };

    return { success: true, platform };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get platform failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updatePlatformApi = async (id, name, description) => {
  try {
    const response = await apiClient.put(
      '/platform',
      {
        platform_name: name,
        platform_description: description,
      },
      { params: { id } }
    );
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update platform failed.' };
    }

    const d = body.data;
    const platform = {
      id: d.platform_id,
      name: d.platform_name,
      description: d.platform_description || '',
    };

    return { success: true, message: body.message, platform };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Update platform failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deletePlatformApi = async (id) => {
  try {
    const response = await apiClient.delete('/platform', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete platform failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete platform failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};