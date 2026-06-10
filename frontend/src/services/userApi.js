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