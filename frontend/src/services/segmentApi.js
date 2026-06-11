import apiClient from './api';

export const createSegmentApi = async (code, name, description) => {
  try {
    const response = await apiClient.post('/segment', {
      segment_code: code,
      segment_name: name,
      segment_description: description,
    });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create segment failed.' };
    }

    const d = body.data;
    const segment = {
      id: d.segment_id,
      code: d.segment_code,
      name: d.segment_name,
      description: d.segment_description || '',
    };

    return { success: true, message: body.message, segment };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Create segment failed.' };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchSegmentsApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/segment/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, segments: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Loop through backend segment list and map to frontend format
    const segments = list.map((d) => ({
      id: d.segment_id,
      code: d.segment_code,
      name: d.segment_name,
      description: d.segment_description || '',
    }));

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, segments, pagination };
  } catch (err) {
    // If API returns 404, endpoint doesn't exist yet
    if (err.response && err.response.status === 404) {
      return { success: true, segments: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, segments: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, segments: [], pagination: null, message: err.message };
  }
};

export const getSegmentApi = async (id) => {
  try {
    const response = await apiClient.get('/segment', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get segment failed.' };
    }

    const d = body.data;
    const segment = {
      id: d.segment_id,
      code: d.segment_code,
      name: d.segment_name,
      description: d.segment_description || '',
    };

    return { success: true, segment };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get segment failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateSegmentApi = async (id, code, name, description) => {
  try {
    const response = await apiClient.put(
      '/segment',
      {
        segment_code: code,
        segment_name: name,
        segment_description: description,
      },
      { params: { id } }
    );
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update segment failed.' };
    }

    const d = body.data;
    const segment = {
      id: d.segment_id,
      code: d.segment_code,
      name: d.segment_name,
      description: d.segment_description || '',
    };

    return { success: true, message: body.message, segment };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Update segment failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteSegmentApi = async (id) => {
  try {
    const response = await apiClient.delete('/segment', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete segment failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete segment failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};