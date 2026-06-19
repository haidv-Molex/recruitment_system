import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

export type LanguageDetailFormData = {
  language: string;
  proficiency: string;
};

export type EducationDetailFormData = {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
};

export type WorkExperienceDetailFormData = {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string[];
};

export type CandidateFormOptions = {
  jobs: any[];
  platforms: any[];
  companies: any[];
  users: any[];
  agencies: string[];
  statuses: string[];
};

export const emptyLanguageDetail = (): LanguageDetailFormData => ({
  language: '',
  proficiency: '',
});

export const emptyEducationDetail = (): EducationDetailFormData => ({
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: '',
});

export const emptyWorkExperienceDetail = (): WorkExperienceDetailFormData => ({
  title: '',
  company: '',
  start_date: '',
  end_date: '',
  is_current: false,
  responsibilities: [],
});

export const createEmptyCandidate = () => ({
  candidateCode: '',
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  agency: '',
  offerDate: '',
  onboardDate: '',
  expectedOnboardDate: '',
  feedbackDate: '',
  currentSalary: '',
  expectedSalary: '',
  status: 'CV Sent',
  note: '',
  platformId: '',
  jobId: '',
  targetedCompanyId: '',
  targetedCompanyName: '',
  referenceId: '',
  candidateLevels: [] as number[],
  file: null as File | null,
  summary: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  location: '',
  links: [] as string[],
  skills: [] as string[],
  languages: [] as string[],
  languageDetails: [] as LanguageDetailFormData[],
  education: '',
  educationDetails: [] as EducationDetailFormData[],
  experienceYears: '',
  currentPosition: '',
  currentLevel: '',
  lastCompany: '',
  workExperience: '',
  workExperienceDetails: [] as WorkExperienceDetailFormData[],
  certifications: [] as string[],
  expectedPosition: '',
  expectedLevel: '',
  expectedWorkLocation: '',
  salaryCurrency: 'VND',
});

export const emptyCandidate = createEmptyCandidate();

export type CandidateFormData = ReturnType<typeof createEmptyCandidate>;
export type CandidateFormSetData = Dispatch<SetStateAction<CandidateFormData>>;
export type CandidateFormChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;