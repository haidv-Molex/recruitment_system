const STORAGE_KEY = 'recruitment_jd_library';

export const sitesList = ['MXV', 'D', 'S', 'SK'];

const loadJDs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // If saved data exists in localStorage, parse and return it
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
};

const saveJDs = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

let jdList = loadJDs();

export const getAllJDs = () => {
  return jdList.map(({ fileData, ...rest }) => rest);
};

export const getJDFile = (id) => {
  // Find the JD entry by id to retrieve its file data
  const jd = jdList.find((item) => item.id === id);
  // If JD not found, return null
  if (!jd) return null;
  return jd;
};

export const addJD = (jdEntry) => {
  jdList = [...jdList, jdEntry];
  saveJDs(jdList);
  return { success: true };
};

export const deleteJD = (id) => {
  // Check if JD with given id exists before deleting
  const exists = jdList.some((item) => item.id === id);
  // If JD not found, return error
  if (!exists) {
    return { success: false, message: 'JD not found.' };
  }
  jdList = jdList.filter((item) => item.id !== id);
  saveJDs(jdList);
  return { success: true };
};

export const updateJD = (id, updates) => {
  // Find the index of JD to update
  const index = jdList.findIndex((item) => item.id === id);
  // If JD not found, return error
  if (index === -1) {
    return { success: false, message: 'JD not found.' };
  }
  jdList[index] = { ...jdList[index], ...updates };
  saveJDs(jdList);
  return { success: true };
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes) => {
  // If file size is less than 1KB, show in bytes
  if (bytes < 1024) return `${bytes} B`;
  // If file size is less than 1MB, show in KB
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};