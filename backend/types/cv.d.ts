export type ParsedCVLanguage = {
  language: string;
  proficiency: string;
};
 
export type ParsedCVEducation = {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
};
 
export type ParsedCVWorkExperience = {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string[];
};
 
export type ParsedCV = {
  name: string;
  email: string;
  phone: string;
  gender: string;
  summary: string;
  location: string;
  links: string[];
  skills: string[];
  languages: string[];
  language_details: ParsedCVLanguage[];
  experience_years: string;
  education: string;
  education_details: ParsedCVEducation[];
  current_position: string;
  work_experience: string;
  work_experience_details: ParsedCVWorkExperience[];
  references: string[];
  national_id: string;
  nationality: string;
  date_of_birth: string;
  quality_grade: string;
  certifications: string[];
  detected_language: string;
  field_confidences: Record<string, number>;
  extraction_warnings: string[];
};