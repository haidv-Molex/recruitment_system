export const emptyJob = {
  jobCode: '',
  project: '',
  candidateRequired: 1,
  note: '',
  requestDate: '',
  recruiterId: '',
  recruiterName: '',
  file: null as File | null,
  departments: [] as any[],
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
