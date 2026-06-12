export const emptyJob = {
  jobCode: '',
  project: '',
  candidateRequired: 1,
  note: '',
  requestDate: '',
  file: null as File | null,
  departments: [] as number[],
  segments: [] as number[],
  sites: [] as number[],
  titles: [] as number[],
  employeeLevels: [] as number[],
  partners: [] as number[],
  managers: [] as number[],
};

export interface JobFormProps {
  job?: any;
  onSubmit: (data: typeof emptyJob) => void;
  onClose: () => void;
  saving: boolean;
}
