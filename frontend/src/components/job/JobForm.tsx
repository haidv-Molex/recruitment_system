import React, { useEffect, useState } from 'react';
import { emptyJob, JobFormProps } from './types';
import JobBasicInfoFields from './JobBasicInfoFields';
import JobRelationFields from './JobRelationFields';
import Modal from '../ui/Modal';
import Button from '../common/Button';
import { FilePreviewModal } from '../common/FilePreview';
import NotesManager from '@/components/common/NotesManager';

const EMPTY_NOTES: any[] = [];

export default function JobForm({ job, onSubmit, onClose, saving }: JobFormProps) {
  const [formData, setFormData] = useState(emptyJob);
  const [notesPayload, setNotesPayload] = useState<{ note_id: number | null; text: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [error, setError] = useState('');

  const [selectedDepts, setSelectedDepts] = useState<any[]>([]);
  const [selectedSites, setSelectedSites] = useState<any[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<any[]>([]);
  const [selectedEmpLevels, setSelectedEmpLevels] = useState<any[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<any[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<any | null>(null);

  useEffect(() => {
    if (job) {
      setFormData({
        jobCode: job.job_code || '',
        project: job.project || '',
        candidateRequired: job.candidate_required || 1,
        note: job.note || '',
        requestDate: job.request_date ? String(job.request_date).slice(0, 10) : '',
        recruiterId: job.recruiter?.user_id || job.recruiter_id || '',
        recruiterName: '',
        file: null,
        departments: Array.isArray(job.departments)
          ? job.departments.map((d: any) => (typeof d === 'object' ? d.department_id : d))
          : [],
        sites: Array.isArray(job.sitesData || job.sites)
          ? (job.sitesData || (Array.isArray(job.sites) ? job.sites : [])).map((s: any) => (typeof s === 'object' ? s.site_id : s))
          : [],
        titles: Array.isArray(job.titles)
          ? job.titles.map((t: any) => (typeof t === 'object' ? t.level_id : t))
          : [],
        employeeLevels: Array.isArray(job.employee_levels)
          ? job.employee_levels.map((el: any) => (typeof el === 'object' ? el.level_id : el))
          : [],
        managers: Array.isArray(job.managers)
          ? job.managers.map((m: any) => (typeof m === 'object' ? m.user_id : m))
          : [],
      });
      setSelectedDepts(Array.isArray(job.departments) ? job.departments : []);
      setSelectedSites(Array.isArray(job.sitesData || job.sites) ? (job.sitesData || (Array.isArray(job.sites) ? job.sites : [])) : []);
      setSelectedTitles(Array.isArray(job.titles) ? job.titles : []);
      setSelectedEmpLevels(Array.isArray(job.employee_levels) ? job.employee_levels : []);
      setSelectedManagers(Array.isArray(job.managers) ? job.managers : []);
      setSelectedRecruiter(job.recruiter || null);
    } else {
      setFormData(emptyJob);
      setSelectedDepts([]);
      setSelectedSites([]);
      setSelectedTitles([]);
      setSelectedEmpLevels([]);
      setSelectedManagers([]);
      setSelectedRecruiter(null);
    }
  }, [job]);

  useEffect(() => {
    const sum = selectedDepts.reduce((acc, d) => acc + (d.candidate_required !== undefined ? d.candidate_required : 1), 0);
    setFormData((prev) => ({
      ...prev,
      candidateRequired: sum > 0 ? sum : 1,
    }));
  }, [selectedDepts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'candidateRequired' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');



    const updatedDepartments = selectedDepts.map((d) => {
      const isExisting = typeof d.department_id === 'number';
      return {
        department_id: isExisting ? d.department_id : null,
        name: isExisting ? null : (d.department_name || d.department_id),
        candidate_required: d.candidate_required !== undefined ? d.candidate_required : 1,
      };
    });

    const totalHC = updatedDepartments.reduce((sum, d) => sum + d.candidate_required, 0);
    if (updatedDepartments.length > 0 && totalHC < 1) {
      setError('Total headcounts must be at least 1.');
      return;
    }

    onSubmit({
      ...formData,
      departments: updatedDepartments,
      candidateRequired: totalHC,
      ...(job
        ? { notes: notesPayload, note: undefined }
        : { note: notesPayload.map((n) => n.text).filter(Boolean).join('\n') }),
    } as any);
  };

  const fileToDisplay = formData.file || job?.file;

  const modalTitle = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-semibold text-slate-800">
        {job ? 'Edit Job Requisition' : 'Add Job Requisition'}
      </span>
      {fileToDisplay && (
        <span
          onClick={() => {
            if (fileToDisplay instanceof File) {
              const fileUrl = URL.createObjectURL(fileToDisplay);
              setPreviewFile({
                file_name: fileToDisplay.name,
                file_path: fileUrl,
                file_url: fileUrl,
              });
            } else {
              setPreviewFile(fileToDisplay);
            }
          }}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 cursor-pointer transition-colors max-w-[240px] truncate"
          title="Click to preview JD File"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          JD: {fileToDisplay instanceof File ? fileToDisplay.name : (fileToDisplay.file_name || fileToDisplay.file_path?.split('/').pop() || 'File')}
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving ? 'Saving...' : job ? 'Save Job' : 'Create Job'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <JobBasicInfoFields
          formData={formData}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          saving={saving}
          job={job}
          setPreviewFile={setPreviewFile}
        />

        <JobRelationFields
          saving={saving}
          setFormData={setFormData}
          selectedDepts={selectedDepts}
          setSelectedDepts={setSelectedDepts}
          selectedSites={selectedSites}
          setSelectedSites={setSelectedSites}
          selectedTitles={selectedTitles}
          setSelectedTitles={setSelectedTitles}
          selectedEmpLevels={selectedEmpLevels}
          setSelectedEmpLevels={setSelectedEmpLevels}
          selectedManagers={selectedManagers}
          setSelectedManagers={setSelectedManagers}
          selectedRecruiter={selectedRecruiter}
          setSelectedRecruiter={setSelectedRecruiter}
        />

        <NotesManager
          existingNotes={Array.isArray(job?.note) ? job.note : EMPTY_NOTES}
          onChange={setNotesPayload}
          disabled={saving}
        />
      </form>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Modal>
  );
}
export { JobForm };
