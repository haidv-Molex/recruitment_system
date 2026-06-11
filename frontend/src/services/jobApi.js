import apiClient from './api';

// Helper: map backend job data to frontend format
const mapJob = (d) => ({
  id: d.job_id,
  code: d.job_code,
  project: d.project,
  candidateRequired: d.candidate_required,
  note: d.note || '',
  requestDate: d.request_date || '',
  createdAt: d.create_at,
  updatedAt: d.update_at,
  file: d.file
    ? {
        id: d.file.file_id,
        path: d.file.file_path,
        url: d.file.file_url,
        name: d.file.file_path ? d.file.file_path.split('/').pop() : 'file',
      }
    : null,
  partners: (d.partners || []).map((p) => ({
    id: p.user_id,
    name: p.user_name,
    role: p.user_role,
  })),
  departments: (d.departments || []).map((dep) => ({
    id: dep.department_id,
    code: dep.department_code,
    name: dep.department_name,
  })),
  segments: (d.segments || []).map((seg) => ({
    id: seg.segment_id,
    code: seg.segment_code,
    name: seg.segment_name,
  })),
  sites: (d.sites || []).map((s) => ({
    id: s.site_id,
    code: s.site_code,
    name: s.site_name,
  })),
  titles: (d.titles || []).map((t) => ({
    id: t.level_id,
    code: t.level_code,
    name: t.level_name,
  })),
  managers: (d.managers || []).map((m) => ({
    id: m.user_id,
    name: m.user_name,
    role: m.user_role,
  })),
  employeeLevels: (d.employee_levels || []).map((el) => ({
    id: el.level_id,
    code: el.level_code,
    name: el.level_name,
  })),
});

export const createJobApi = async (formData) => {
  try {
    // Build FormData for multipart/form-data (supports file upload)
    const fd = new FormData();
    fd.append('job_code', formData.jobCode);
    fd.append('project', formData.project);
    fd.append('candidate_required', String(formData.candidateRequired));

    // If note is provided, add it
    if (formData.note) {
      fd.append('note', formData.note);
    }

    
    if (formData.requestDate) {
        fd.append('request_date', formData.requestDate);
        }


    // If file is provided, add it
    if (formData.file) {
      fd.append('file', formData.file);
    }

    // If partner IDs are provided, add each one
    if (formData.partners?.length) {
      formData.partners.forEach((id) => fd.append('partners', String(id)));
    }

    // If department IDs are provided, add each one
    if (formData.departments?.length) {
      formData.departments.forEach((id) => fd.append('departments', String(id)));
    }

    // If segment IDs are provided, add each one
    if (formData.segments?.length) {
      formData.segments.forEach((id) => fd.append('segments', String(id)));
    }

    // If site IDs are provided, add each one
    if (formData.sites?.length) {
      formData.sites.forEach((id) => fd.append('sites', String(id)));
    }

    // If title IDs are provided, add each one
    if (formData.titles?.length) {
      formData.titles.forEach((id) => fd.append('titles', String(id)));
    }

    // If manager IDs are provided, add each one
    if (formData.managers?.length) {
      formData.managers.forEach((id) => fd.append('managers', String(id)));
    }

    // If employee level IDs are provided, add each one
    if (formData.employeeLevels?.length) {
      formData.employeeLevels.forEach((id) => fd.append('employee_levels', String(id)));
    }

    // Do NOT set Content-Type manually — api.js interceptor handles it
    const response = await apiClient.post('/job', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create job failed.', details: body.details };
    }

    return { success: true, message: body.message, job: mapJob(body.data) };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      // If validation error with details array, join them
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Create job failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchJobsApi = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const params = { page, limit };
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/job/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, jobs: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];
    const jobs = list.map(mapJob);

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, jobs, pagination };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, jobs: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, jobs: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, jobs: [], pagination: null, message: err.message };
  }
};

export const getJobApi = async (id) => {
  try {
    const response = await apiClient.get('/job', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get job failed.' };
    }

    return { success: true, job: mapJob(body.data) };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get job failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteJobApi = async (id) => {
  try {
    const response = await apiClient.delete('/job', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete job failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete job failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateJobApi = async (id, formData) => {
  try {
    const fd = new FormData();
    fd.append('job_code', formData.jobCode);
    fd.append('project', formData.project);
    fd.append('candidate_required', String(formData.candidateRequired));

    if (formData.note) fd.append('note', formData.note);
    if (formData.requestDate) fd.append('request_date', formData.requestDate);
    if (formData.file) fd.append('file', formData.file);

    // Array fields — send as JSON string e.g. [8] or [2,3]
    if (formData.partners?.length) fd.append('partners', JSON.stringify(formData.partners));
    if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
    if (formData.segments?.length) fd.append('segments', JSON.stringify(formData.segments));
    if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
    if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
    if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
    if (formData.employeeLevels?.length) fd.append('employee_levels', JSON.stringify(formData.employeeLevels));

    const response = await apiClient.put('/job', fd, { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update job failed.', details: body.details };
    }

    return { success: true, message: body.message, job: mapJob(body.data) };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Update job failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const parseJobSheetApi = async (file) => {
  try {
    const fd = new FormData();
    fd.append('file', file);

    const response = await apiClient.post('/file/parse-job-sheet', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Parse job sheet failed.', jobs: [] };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Map parsed data to frontend format (IDs may be null for new entities)
    const jobs = list.map((d) => ({
      jobCode: d.job_code || '',
      project: d.project || '',
      candidateRequired: d.candidate_required || 1,
      note: d.note || '',
      requestDate: d.request_date ? d.request_date.slice(0, 10) : '',
      file: d.file || null,
      // Names only (IDs may be null — backend will create if needed)
      partners: (d.partners || []).map((p) => ({
        id: p.user_id,
        name: p.user_name,
      })),
      departments: (d.departments || []).map((dep) => ({
        id: dep.department_id,
        code: dep.department_code,
        name: dep.department_name,
      })),
      segments: (d.segments || []).map((seg) => ({
        id: seg.segment_id,
        code: seg.segment_code,
        name: seg.segment_name,
      })),
      sites: (d.sites || []).map((s) => ({
        id: s.site_id,
        code: s.site_code,
        name: s.site_name,
      })),
      titles: (d.titles || []).map((t) => ({
        id: t.level_id,
        code: t.level_code,
        name: t.level_name,
      })),
      managers: (d.managers || []).map((m) => ({
        id: m.user_id,
        name: m.user_name,
      })),
      employeeLevels: (d.employee_levels || []).map((el) => ({
        id: el.level_id,
        code: el.level_code,
        name: el.level_name,
      })),
    }));

    return { success: true, message: body.message, jobs };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Parse job sheet failed.';
      return { success: false, message: msg, jobs: [] };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.', jobs: [] };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.', jobs: [] };
  }
};

export const createJobExtendedApi = async (formData) => {
  try {
    const fd = new FormData();

    // Required fields
    fd.append('job_code', formData.jobCode);
    fd.append('project', formData.project);
    fd.append('candidate_required', String(formData.candidateRequired));

    // Optional fields
    if (formData.note) fd.append('note', formData.note);
    if (formData.requestDate) fd.append('request_date', formData.requestDate);
    if (formData.file) fd.append('file', formData.file);

    // Existing IDs — send as JSON array string e.g. "[1,2]"
    if (formData.partners?.length) fd.append('partners', JSON.stringify(formData.partners));
    if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
    if (formData.segments?.length) fd.append('segments', JSON.stringify(formData.segments));
    if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
    if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
    if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
    if (formData.employeeLevels?.length) fd.append('employee_levels', JSON.stringify(formData.employeeLevels));

    // New names — backend auto-creates records, send as JSON array string e.g. '["Cloud Engineering"]'
    if (formData.partnersName?.length) fd.append('partners_name', JSON.stringify(formData.partnersName));
    if (formData.managersName?.length) fd.append('managers_name', JSON.stringify(formData.managersName));
    if (formData.departmentsName?.length) fd.append('departments_name', JSON.stringify(formData.departmentsName));
    if (formData.segmentsName?.length) fd.append('segments_name', JSON.stringify(formData.segmentsName));
    if (formData.sitesName?.length) fd.append('sites_name', JSON.stringify(formData.sitesName));
    if (formData.titlesName?.length) fd.append('titles_name', JSON.stringify(formData.titlesName));
    if (formData.employeeLevelsName?.length) fd.append('employee_levels_name', JSON.stringify(formData.employeeLevelsName));

    const response = await apiClient.post('/job/extended', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create job failed.', details: body.details };
    }

    return { success: true, message: body.message, job: mapJob(body.data) };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Create job failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};