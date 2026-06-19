import axiosInstance from '@/config/axiosInstance';

export interface OutlookSession {
  email: string;
  expiresAt: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}

export async function requestOutlookLoginApi(email: string): Promise<{ email: string; expiresAt: string }> {
  const response = await axiosInstance.post('/email/outlook/request-login', { email });
  return response.data.data!;
}

export async function verifyOutlookLoginApi(email: string, code: string): Promise<OutlookSession> {
  const response = await axiosInstance.post('/email/outlook/verify-login', { email, code });
  return response.data.data!;
}

export async function getOutlookSessionApi(): Promise<OutlookSession | null> {
  try {
    const response = await axiosInstance.get('/email/outlook/session');
    return response.data.data || null;
  } catch {
    return null;
  }
}

export async function logoutOutlookApi(): Promise<void> {
  await axiosInstance.post('/email/outlook/logout');
}

export async function fetchEmailTemplatesApi(): Promise<EmailTemplate[]> {
  const response = await axiosInstance.get('/email/templates');
  return response.data.data || [];
}

export async function sendEmailApi(body: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<any> {
  const response = await axiosInstance.post('/email/send', body);
  return response.data.data;
}