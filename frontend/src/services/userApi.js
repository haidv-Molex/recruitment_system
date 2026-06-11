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

export const fetchUsersApi = async () => {
  try {
    const response = await apiClient.get('/user/list');
    const data = response.data;

    // If backend returns result: false, return empty array
    if (!data.result) {
      return { success: false, users: [], message: data.message };
    }

    // Loop through backend user list and map to frontend format
    const users = data.data.map((d) => ({
      id: d.user_id,
      displayName: d.user_name,
      account: d.user_account || '',
      description: d.user_description || '',
      role: d.user_role,
      departmentId: d.department_id,
    }));

    return { success: true, users };
  } catch (err) {
    // If API returns 404, it means endpoint doesn't exist yet
    if (err.response && err.response.status === 404) {
      console.warn('GET /user/list not available yet.');
      return { success: true, users: [] };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, users: [], message: 'Cannot connect to server.' };
    }
    return { success: false, users: [], message: err.message };
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