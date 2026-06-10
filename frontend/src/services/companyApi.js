import apiClient from './api';

export const getCompanyApi = async (id) => {
  try {
    const response = await apiClient.get('/company', { params: { id } });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Get company failed.' };
    }

    const d = body.data;

    const company = {
      id: d.company_id,
      name: d.company_name,
      description: d.company_description || '',
    };

    return { success: true, company };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Get company failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchCompaniesApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };

    // If search query is provided, add it to params
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/company/search', { params });
    const body = response.data;

    // If backend returns result: false, return empty data
    if (!body.result) {
      return { success: false, companies: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend company list and map to frontend format
    const companies = list.map((d) => ({
      id: d.company_id,
      name: d.company_name,
      description: d.company_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, companies, pagination };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Search companies failed.';
      return { success: false, companies: [], pagination: null, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, companies: [], pagination: null, message: 'Cannot connect to server.' };
    }

    return { success: false, companies: [], pagination: null, message: err.message };
  }
};

export const createCompanyApi = async (name, description) => {
  try {
    const response = await apiClient.post('/company', {
      company_name: name,
      company_description: description,
    });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Create company failed.' };
    }

    const d = body.data;

    const company = {
      id: d.company_id,
      name: d.company_name,
      description: d.company_description || '',
    };

    return { success: true, message: body.message, company };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Create company failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteCompanyApi = async (id) => {
  try {
    const response = await apiClient.delete(`/company/${id}`);
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Delete company failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    // If server returned an error response
    if (err.response) {
      const msg = err.response.data?.message || 'Delete company failed.';
      return { success: false, message: msg };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateCompanyApi = async (id, name, description) => {
  try {
    const response = await apiClient.put(`/company/${id}`, {
      company_name: name,
      company_description: description,
    });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Update company failed.' };
    }

    const d = body.data;

    const company = {
      id: d.company_id,
      name: d.company_name,
      description: d.company_description || '',
    };

    return { success: true, message: body.message, company };
  } catch (err) {
    // If server returned an error response
    if (err.response) {
      const msg = err.response.data?.message || 'Update company failed.';
      return { success: false, message: msg };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};