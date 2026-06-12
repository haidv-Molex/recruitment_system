import apiClient from './api';

// Helper: map backend candidate to frontend format
const mapCandidate = (d) => ({
  id: d.candidate_id,
  code: d.candidate_code,
  name: d.candidate_name,
  email: d.candidate_email || '',
  phone: d.candidate_phone || '',
  agency: d.agency || '',
  offerDate: d.offer_date || '',
  onboardDate: d.onboard_date || '',
  expectedOnboardDate: d.expected_onboard_date || '',
  feedbackDate: d.feedback_date || '',
  currentSalary: d.current_salary || '',
  expectedSalary: d.expected_salary || '',
  status: d.status || '',
  note: d.note || '',
  createdAt: d.create_at,
  updatedAt: d.update_at,
  platform: d.platform ? {
    id: d.platform.platform_id,
    name: d.platform.platform_name,
  } : null,
  recruiter: d.recruiter ? {
    id: d.recruiter.user_id,
    name: d.recruiter.user_name,
    role: d.recruiter.user_role,
  } : null,
  job: d.job ? {
    id: d.job.job_id,
    code: d.job.job_code,
    project: d.job.project,
  } : null,
  targetedCompany: d.targeted_company ? {
    id: d.targeted_company.company_id,
    name: d.targeted_company.company_name,
  } : null,
  reference: d.reference ? {
    id: d.reference.user_id,
    name: d.reference.user_name,
  } : null,
  
    file: d.file
        ? {
            id: d.file.file_id,
            path: d.file.file_path,
            url: d.file.file_url,
            name: d.file.file_path ? d.file.file_path.split('/').pop() : 'file',
        }
        : null,

});

export const createCandidateApi = async (formData) => {
  try {
    const fd = new FormData();

    // Required fields
    fd.append('candidate_name', formData.candidateName);
    fd.append('candidate_code', formData.candidateCode);

    // Optional text fields — only append if provided
    if (formData.candidateEmail) fd.append('candidate_email', formData.candidateEmail);
    if (formData.candidatePhone) fd.append('candidate_phone', formData.candidatePhone);
    if (formData.agency) fd.append('agency', formData.agency);
    if (formData.offerDate) fd.append('offer_date', formData.offerDate);
    if (formData.onboardDate) fd.append('onboard_date', formData.onboardDate);
    if (formData.expectedOnboardDate) fd.append('expected_onboard_date', formData.expectedOnboardDate);
    if (formData.feedbackDate) fd.append('feedback_date', formData.feedbackDate);
    if (formData.currentSalary) fd.append('current_salary', formData.currentSalary);
    if (formData.expectedSalary) fd.append('expected_salary', formData.expectedSalary);
    if (formData.status) fd.append('status', formData.status);
    if (formData.note) fd.append('note', formData.note);

    // FK fields — only append if selected
    if (formData.platformId) fd.append('platform_id', String(formData.platformId));
    if (formData.recruiterId) fd.append('recruiter', String(formData.recruiterId));
    if (formData.jobId) fd.append('job_id', String(formData.jobId));
    if (formData.targetedCompanyId) fd.append('targeted_company', String(formData.targetedCompanyId));
    if (formData.referenceId) fd.append('reference', String(formData.referenceId));

    // File upload
    if (formData.file) fd.append('file', formData.file);

    const response = await apiClient.post('/candidate', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create candidate failed.', details: body.details };
    }

    return { success: true, message: body.message, candidate: mapCandidate(body.data) };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Create candidate failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const searchCandidatesApi = async ({
  page = 1,
  limit = 10,
  search = '',
  searchAt = '',
  status = '',
  offerDateFrom = '',
  offerDateTo = '',
  onboardDateFrom = '',
  onboardDateTo = '',
  expectedOnboardDateFrom = '',
  expectedOnboardDateTo = '',
  feedbackDateFrom = '',
  feedbackDateTo = '',
} = {}) => {
  try {
    const params = { page, limit };

    // Text search filters
    if (search.trim()) params.search = search.trim();
    if (searchAt) params.search_at = searchAt;

    // Status filter
    if (status) params.status = status;

    // Date range filters — only append if provided
    if (offerDateFrom) params.offer_date_from = offerDateFrom;
    if (offerDateTo) params.offer_date_to = offerDateTo;
    if (onboardDateFrom) params.onboard_date_from = onboardDateFrom;
    if (onboardDateTo) params.onboard_date_to = onboardDateTo;
    if (expectedOnboardDateFrom) params.expected_onboard_date_from = expectedOnboardDateFrom;
    if (expectedOnboardDateTo) params.expected_onboard_date_to = expectedOnboardDateTo;
    if (feedbackDateFrom) params.feedback_date_from = feedbackDateFrom;
    if (feedbackDateTo) params.feedback_date_to = feedbackDateTo;

    const response = await apiClient.get('/candidate/search', { params });
    const body = response.data;

    if (!body.result) {
      return { success: false, candidates: [], pagination: null, message: body.message };
    }

    const list = Array.isArray(body.data) ? body.data : [];
    const candidates = list.map(mapCandidate);

    const pagination = body.pagination
      ? {
          currentPage: body.pagination.current_page,
          totalPages: body.pagination.total_pages,
          totalItems: body.pagination.total_items,
        }
      : null;

    return { success: true, candidates, pagination };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, candidates: [], pagination: null };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, candidates: [], pagination: null, message: 'Cannot connect to server.' };
    }
    return { success: false, candidates: [], pagination: null, message: err.message };
  }
};

export const getCandidateApi = async (id) => {
  try {
    const response = await apiClient.get('/candidate', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Get candidate failed.' };
    }

    return { success: true, candidate: mapCandidate(body.data) };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Get candidate failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const deleteCandidateApi = async (id) => {
  try {
    const response = await apiClient.delete('/candidate', { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Delete candidate failed.' };
    }

    return { success: true, message: body.message };
  } catch (err) {
    if (err.response) {
      return { success: false, message: err.response.data?.message || 'Delete candidate failed.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const createCandidateExtendedApi = async (formData) => {
  try {
    const fd = new FormData();

    // Required fields
    fd.append('candidate_name', formData.candidateName);
    fd.append('candidate_code', formData.candidateCode);

    // Optional text fields — only append if provided
    if (formData.candidateEmail) fd.append('candidate_email', formData.candidateEmail);
    if (formData.candidatePhone) fd.append('candidate_phone', formData.candidatePhone);
    if (formData.agency) fd.append('agency', formData.agency);
    if (formData.offerDate) fd.append('offer_date', formData.offerDate);
    if (formData.onboardDate) fd.append('onboard_date', formData.onboardDate);
    if (formData.expectedOnboardDate) fd.append('expected_onboard_date', formData.expectedOnboardDate);
    if (formData.feedbackDate) fd.append('feedback_date', formData.feedbackDate);
    if (formData.currentSalary) fd.append('current_salary', formData.currentSalary);
    if (formData.expectedSalary) fd.append('expected_salary', formData.expectedSalary);
    if (formData.status) fd.append('status', formData.status);
    if (formData.note) fd.append('note', formData.note);

    // FK by ID — use existing record
    if (formData.platformId) fd.append('platform_id', String(formData.platformId));
    if (formData.recruiterId) fd.append('recruiter', String(formData.recruiterId));
    if (formData.jobId) fd.append('job_id', String(formData.jobId));
    if (formData.targetedCompanyId) fd.append('targeted_company', String(formData.targetedCompanyId));
    if (formData.referenceId) fd.append('reference', String(formData.referenceId));

    // FK by Name — backend auto-creates if ID not provided
    if (formData.platformName) fd.append('platform_name', formData.platformName);
    if (formData.recruiterName) fd.append('recruiter_name', formData.recruiterName);
    if (formData.targetedCompanyName) fd.append('targeted_company_name', formData.targetedCompanyName);
    if (formData.referenceName) fd.append('reference_name', formData.referenceName);

    // File upload
    if (formData.file) fd.append('file', formData.file);

    const response = await apiClient.post('/candidate/extended', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Create candidate failed.', details: body.details };
    }

    return { success: true, message: body.message, candidate: mapCandidate(body.data) };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Create candidate failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const updateCandidateApi = async (id, formData) => {
  try {
    const fd = new FormData();

    // Text fields — append all
    fd.append('candidate_name', formData.candidateName);
    fd.append('candidate_code', formData.candidateCode);
    if (formData.candidateEmail) fd.append('candidate_email', formData.candidateEmail);
    if (formData.candidatePhone) fd.append('candidate_phone', formData.candidatePhone);
    if (formData.agency) fd.append('agency', formData.agency);
    if (formData.offerDate) fd.append('offer_date', formData.offerDate);
    if (formData.onboardDate) fd.append('onboard_date', formData.onboardDate);
    if (formData.expectedOnboardDate) fd.append('expected_onboard_date', formData.expectedOnboardDate);
    if (formData.feedbackDate) fd.append('feedback_date', formData.feedbackDate);
    if (formData.currentSalary) fd.append('current_salary', formData.currentSalary);
    if (formData.expectedSalary) fd.append('expected_salary', formData.expectedSalary);
    if (formData.status) fd.append('status', formData.status);
    if (formData.note) fd.append('note', formData.note);

    // FK fields
    if (formData.platformId) fd.append('platform_id', String(formData.platformId));
    if (formData.recruiterId) fd.append('recruiter', String(formData.recruiterId));
    if (formData.jobId) fd.append('job_id', String(formData.jobId));
    if (formData.targetedCompanyId) fd.append('targeted_company', String(formData.targetedCompanyId));

    // Reference can be null
    if (formData.referenceId) {
      fd.append('reference', String(formData.referenceId));
    } else {
      fd.append('reference', 'null');
    }

    // File upload (new file only)
    if (formData.file) fd.append('file', formData.file);

    const response = await apiClient.put('/candidate', fd, { params: { id } });
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Update candidate failed.' };
    }

    return { success: true, message: body.message, candidate: mapCandidate(body.data) };
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.message || 'Update candidate failed.';
      return { success: false, message: msg };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.' };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.' };
  }
};

export const fetchAgenciesApi = async () => {
  try {
    const response = await apiClient.get('/candidate/agencies');
    const data = response.data;

    if (!data.result) {
      return { success: false, agencies: [], message: data.message };
    }

    const agencies = Array.isArray(data.data) ? data.data : [];

    return { success: true, agencies };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, agencies: [] };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, agencies: [], message: 'Cannot connect to server.' };
    }
    return { success: false, agencies: [], message: err.message };
  }
};

export const fetchStatusesApi = async () => {
  try {
    const response = await apiClient.get('/candidate/statuses');
    const data = response.data;

    if (!data.result) {
      return { success: false, statuses: [], message: data.message };
    }

    const statuses = Array.isArray(data.data) ? data.data : [];

    return { success: true, statuses };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { success: true, statuses: [] };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, statuses: [], message: 'Cannot connect to server.' };
    }
    return { success: false, statuses: [], message: err.message };
  }
};

export const parseCandidateSheetApi = async (file) => {
  try {
    const fd = new FormData();
    fd.append('file', file);

    const response = await apiClient.post('/file/parse-candidate-sheet', fd);
    const body = response.data;

    if (!body.result) {
      return { success: false, message: body.message || 'Parse candidate sheet failed.', candidates: [] };
    }

    const list = Array.isArray(body.data) ? body.data : [];

    // Map parsed data to frontend format
    const candidates = list.map((d) => ({
      candidateName: d.candidate_name || '',
      candidateEmail: d.candidate_email || '',
      candidatePhone: d.candidate_phone || '',
      agency: d.agency || '',
      status: d.status || '',
      note: d.note || '',
      currentSalary: d.current_salary || '',
      expectedSalary: d.expected_salary || '',
      targetedCompany: d.targeted_company || 'No',
      targetedCompanyName: d.targeted_company_name || '',
      inputDate: d.input_date ? d.input_date.slice(0, 10) : '',
      offerDate: d.offer_date ? d.offer_date.slice(0, 10) : '',
      onboardDate: d.onboard_date ? d.onboard_date.slice(0, 10) : '',
      feedbackDate: d.feedback_date ? d.feedback_date.slice(0, 10) : '',
      departmentCode: d.department_code || '',
      jobCode: d.job_code || '',
      jobTitle: d.job_title || '',
      eeLevel: d.ee_level || '',
      project: d.project || '',
      dlIdl: d.dl_idl || '',
      source: d.source || '',
      employeeCode: d.employee_code || '',
      referenceName: d.reference_name || '',
      referenceDepartment: d.reference_department || '',
      // Recruiter object (may have null id = new user)
      recruiter: d.recruiter ? {
        id: d.recruiter.user_id,
        name: d.recruiter.user_name,
      } : null,
      // Hiring manager object (may have existing id)
      hiringManager: d.hiring_manager ? {
        id: d.hiring_manager.user_id,
        name: d.hiring_manager.user_name,
      } : null,
    }));

    return { success: true, message: body.message, candidates };
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg = data?.details?.length
        ? data.details.join(', ')
        : data?.message || 'Parse candidate sheet failed.';
      return { success: false, message: msg, candidates: [] };
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { success: false, message: 'Cannot connect to server.', candidates: [] };
    }
    return { success: false, message: err.message || 'An unexpected error occurred.', candidates: [] };
  }
};