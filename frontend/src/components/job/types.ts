export const emptyJob = {
  jobCode: '',
  project: '',
  candidateRequired: 1,
  note: '',
  requestDate: '',
  file: null as File | null,
  departments: [] as any[],
  segments: [] as any[],
  sites: [] as any[],
  titles: [] as any[],
  employeeLevels: [] as any[],
  managers: [] as any[],
};

export interface JobFormProps {
  job?: any;
  onSubmit: (data: typeof emptyJob) => void;
  onClose: () => void;
  saving: boolean;
}
