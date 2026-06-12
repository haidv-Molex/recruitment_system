const STORAGE_KEY = 'recruitment_jd_library';

export const sitesList = ['MXV', 'D', 'S', 'SK'];

export interface JDEntry {
  id: string | number;
  fileName: string;
  fileSize: number;
  site: string;
  jobCode?: string;
  jobTitle?: string;
  note?: string;
  fileData?: string;
  [key: string]: any;
}

const loadJDs = (): JDEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
};

const saveJDs = (list: JDEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

let jdList = loadJDs();

export const getAllJDs = () => {
  return jdList.map(({ fileData, ...rest }) => rest);
};

export const getJDFile = (id: string | number): JDEntry | null => {
  const jd = jdList.find((item) => item.id === id);
  if (!jd) return null;
  return jd;
};

export const addJD = (jdEntry: JDEntry) => {
  jdList = [...jdList, jdEntry];
  saveJDs(jdList);
  return { success: true };
};

export const deleteJD = (id: string | number) => {
  const exists = jdList.some((item) => item.id === id);
  if (!exists) {
    return { success: false, message: 'JD not found.' };
  }
  jdList = jdList.filter((item) => item.id !== id);
  saveJDs(jdList);
  return { success: true };
};

export const updateJD = (id: string | number, updates: Partial<JDEntry>) => {
  const index = jdList.findIndex((item) => item.id === id);
  if (index === -1) {
    return { success: false, message: 'JD not found.' };
  }
  jdList[index] = { ...jdList[index], ...updates };
  saveJDs(jdList);
  return { success: true };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
