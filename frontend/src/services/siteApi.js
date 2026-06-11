import apiClient from './api';

export const createSiteApi = async (code, name, description) => {
  try {
    const response = await apiClient.post('/site', {
      site_code: code,
      site_name: name,
      site_description: description,
    });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create site failed.' };
    }

    const d = body.data;
    const site = {
      id: d.site_id,
      code: d.site_code,
      name: d.site_name,
      description: d.site_description || '',
    };

    return { success: true, message: body.message, site };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Create site failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchSitesApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/site/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, sites: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend site list and map to frontend format
    const sites = list.map((d) => ({
      id: d.site_id,
      code: d.site_code,
      name: d.site_name,
      description: d.site_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, sites, pagination };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, sites: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, sites: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, sites: [], pagination: null, message: err.message };
  }
};

export const getSiteApi = async (id) => {
  try {
    const response = await apiClient.get('/site', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get site failed.' };
    }

    const d = body.data;
    const site = {
      id: d.site_id,
      code: d.site_code,
      name: d.site_name,
      description: d.site_description || '',
    };

    return { success: true, site };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get site failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateSiteApi = async (id, code, name, description) => {
  try {
    const response = await apiClient.put(
      '/site',
      {
        site_code: code,
        site_name: name,
        site_description: description,
      },
      { params: { id } }
    );
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update site failed.' };
    }

    const d = body.data;
    const site = {
      id: d.site_id,
      code: d.site_code,
      name: d.site_name,
      description: d.site_description || '',
    };

    return { success: true, message: body.message, site };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Update site failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteSiteApi = async (id) => {
  try {
    const response = await apiClient.delete('/site', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete site failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete site failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};