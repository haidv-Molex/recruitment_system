import apiClient from './api';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'recruitment_auth_user';

export const loginApi = async (account, password) => {
  try {
    const response = await apiClient.post('/auth/login', { account, password });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Login failed.' };
    }

    const { user_id, user_name, user_account, user_role, accessToken } = body.data;

    localStorage.setItem(TOKEN_KEY, accessToken);

    const user = {
      id: user_id,
      displayName: user_name,
      username: user_account,
      role: user_role,
    };

    return { success: true, user };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Login failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server. Please check if backend is running.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const changePasswordApi = async (oldPassword, newPassword) => {
  try {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    const body = response.data;

    // If backend returns result: false, return the error message
    if (!body.result) {
      return { success: false, message: body.message || 'Change password failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    // If server returned an error response (4xx, 5xx)
    if (err.response) {
      const msg = err.response.data?.message || 'Change password failed.';
      return { success: false, message: msg };
    }

    // If network error or server not running
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }

    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const logoutApi = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};