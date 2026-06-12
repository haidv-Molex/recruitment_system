import apiClient from './api';

export const createHRApi = async ({ username, account, password, description, departmentId }) => {
  try {
    const body = { username, account, password };

    // If description is provided, include it in the request body
    if (description) {
      body.description = description;
    }

    // If departmentId is provided, include it in the request body
    if (departmentId) {
      body.departmentId = departmentId;
    }

    const response = await apiClient.post('/user/hr', body);
    const data = response.data;

    // If backend returns result: false, return the error message
    if (!data.result) {
      return { success: false, message: data.message || 'Create account failed.' };
    }

    const d = data.data;

    const newUser = {
      id: d.user_id,
      displayName: d.user_name,
      account: account,
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
      createdAt: d.create_at,
    };

    return { success: true, message: data.message, user: newUser };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Create account failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const fetchUsersApi = async ({ page = 1, limit = 100, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/user/search', { params });
    const data = response.data;

    // If backend returns result: false, return empty array
    if (!data.result) {
      return { success: false, users: [], pagination: null, message: data.message };
    }

    const list = Array.isArray(data.data) ? data.data : [];

    // Loop through backend user list and map to frontend format
    const users = list.map((d) => ({
      id: d.user_id,
      displayName: d.user_name,
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
      createdAt: d.create_at,
      updatedAt: d.update_at,
    }));

    const pagination = data.pagination
      ? {
          currentPage: data.pagination.current_page,
          totalPages: data.pagination.total_pages,
          totalItems: data.pagination.total_items,
        }
      : null;

    return { success: true, users, pagination };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('GET /user/search not available yet.');
      return { success: true, users: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, users: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, users: [], pagination: null, message: err.message };
  }
};

export const getUserApi = async (id) => {
  try {
    const response = await apiClient.get('/user', { params: { id } });
    const data = response.data;

    if (!data.result) {
      return { success: false, message: data.message || 'Get user failed.' };
    }

    const d = data.data;
    const user = {
      id: d.user_id,
      displayName: d.user_name,
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
      createdAt: d.create_at,
      updatedAt: d.update_at,
    };

    return { success: true, user };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get user failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const createUserApi = async ({ username, description, departmentId }) => {
  try {
    const body = { username };

    // If description is provided, include it
    if (description) {
      body.description = description;
    }

    // If departmentId is provided, include it
    if (departmentId) {
      body.departmentId = departmentId;
    }

    const response = await apiClient.post('/user', body);
    const data = response.data;

    if (!data.result) {
      return { success: false, message: data.message || 'Create user failed.' };
    }

    const d = data.data;
    const user = {
      id: d.user_id,
      displayName: d.user_name,
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
      createdAt: d.create_at,
    };

    return { success: true, message: data.message, user };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Create user failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateUserApi = async (id, { username, description, departmentId }) => {
  try {
    const body = {};

    // Only include fields that are provided
    if (username) body.username = username;
    if (description !== undefined) body.description = description;
    if (departmentId !== undefined) body.departmentId = departmentId;

    const response = await apiClient.put('/user', body, { params: { id } });
    const data = response.data;

    if (!data.result) {
      return { success: false, message: data.message || 'Update user failed.' };
    }

    const d = data.data;
    const user = {
      id: d.user_id,
      displayName: d.user_name,
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
      createdAt: d.create_at,
      updatedAt: d.update_at,
    };

    return { success: true, message: data.message, user };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Update user failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteUserApi = async (id) => {
  try {
    const response = await apiClient.delete('/user', { params: { id } });
    const data = response.data;

    if (!data.result) {
      return { success: false, message: data.message || 'Delete user failed.' };
    }

    return { success: true, message: data.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete user failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const changeUserRoleApi = async (id, role) => {
  try {
    const response = await apiClient.patch('/user/role', { role }, { params: { id } });
    const data = response.data;

    if (!data.result) {
      return { success: false, message: data.message || 'Change role failed.' };
    }

    return { success: true, message: data.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Change role failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};