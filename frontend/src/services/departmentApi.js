import apiClient from './api';

export const createDepartmentApi = async (code, name, description) => {
  try {
    const response = await apiClient.post('/department', {
      department_code: code,
      department_name: name,
      department_description: description,
    });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Create department failed.' };
    }

    const d = body.data;

    const department = {
      id: d.department_id,
      code: d.department_code,
      name: d.department_name,
      description: d.department_description || '',
    };

    return { success: true, message: body.message, department };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Create department failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchDepartmentsApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };

    // If search query is provided, add it to params
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/department/search', { params });
    const body = response.data;

    // If backend returns result: false, return empty data
    if (!body.result) {
      return { success: false, departments: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend department list and map to frontend format
    const departments = list.map((d) => ({
      id: d.department_id,
      code: d.department_code,
      name: d.department_name,
      description: d.department_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, departments, pagination };
  } catch (err) {
    // If API returns 404, endpoint doesn't exist yet
    if (err.response && err.response.status === 404) {
      return { success: true, departments: [], pagination: null };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, departments: [], pagination: null, message: 'Cannot connect to server.' };
    }

    return { success: false, departments: [], pagination: null, message: err.message };
  }
};

export const getDepartmentApi = async (id) => {
  try {
    const response = await apiClient.get('/department', { params: { id } });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Get department failed.' };
    }

    const d = body.data;

    const department = {
      id: d.department_id,
      code: d.department_code,
      name: d.department_name,
      description: d.department_description || '',
    };

    return { success: true, department };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Get department failed.';
      return { success: false, message: msg };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateDepartmentApi = async (id, code, name, description) => {
  try {
    const response = await apiClient.put(
      '/department',
      {
        department_code: code,
        department_name: name,
        department_description: description,
      },
      { params: { id } }
    );
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Update department failed.' };
    }

    const d = body.data;

    const department = {
      id: d.department_id,
      code: d.department_code,
      name: d.department_name,
      description: d.department_description || '',
    };

    return { success: true, message: body.message, department };
  } catch (err) {
    // If server returned an error response
    if (err.response) {
      const msg = err.response.data?.message || 'Update department failed.';
      return { success: false, message: msg };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteDepartmentApi = async (id) => {
  try {
    const response = await apiClient.delete('/department', { params: { id } });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Delete department failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    // If server returned an error response
    if (err.response) {
      const msg = err.response.data?.message || 'Delete department failed.';
      return { success: false, message: msg };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};