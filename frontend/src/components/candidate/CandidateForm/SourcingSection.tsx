import SingleSearchSelect from '@/components/ui/SingleSearchSelect';
import { searchJobsApi } from '@/services/jobApi';
import { searchPlatformsApi } from '@/services/platformApi';
import { fetchUsersApi } from '@/services/userApi';
import type { CandidateFormData, CandidateFormOptions, CandidateFormSetData } from './types';
import { getPlatformLabel } from './utils';

interface SourcingSectionProps {
  formData: CandidateFormData;
  setFormData: CandidateFormSetData;
  options: CandidateFormOptions;
  selectedJob: any | null;
  setSelectedJob: (item: any | null) => void;
  selectedReference: any | null;
  setSelectedReference: (item: any | null) => void;
  selectedPlatform: any | null;
  setSelectedPlatform: (item: any | null) => void;
  selectedAgency: any | null;
  setSelectedAgency: (item: any | null) => void;
  saving: boolean;
}

export default function SourcingSection({
  setFormData,
  options,
  selectedJob,
  setSelectedJob,
  selectedReference,
  setSelectedReference,
  selectedPlatform,
  setSelectedPlatform,
  selectedAgency,
  setSelectedAgency,
  saving,
}: SourcingSectionProps) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sourcing & Assignment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SingleSearchSelect
          label="Job (Requisition)"
          placeholder="Type job code or project to search..."
          initialItem={selectedJob}
          searchApi={(search) => searchJobsApi({ search })}
          displayFn={(j: any) => `${j.job_code} - ${j.project}`}
          keyProp="job_id"
          onChange={(id, item) => {
            setFormData((prev) => ({ ...prev, jobId: id || '' }));
            setSelectedJob(item);
          }}
          disabled={saving}
        />
        <SingleSearchSelect
          label="Reference (Internal User)"
          placeholder="Search reference user..."
          initialItem={selectedReference}
          searchApi={(search) => fetchUsersApi({ search })}
          displayFn={(u: any) => u.user_name || ''}
          keyProp="user_id"
          onChange={(id, item) => {
            setFormData((prev) => ({ ...prev, referenceId: id || '' }));
            setSelectedReference(item);
          }}
          disabled={saving}
        />
        <SingleSearchSelect
          label="Platform (Source)"
          placeholder="Search platform..."
          initialItem={selectedPlatform}
          searchApi={(search) => searchPlatformsApi({ search })}
          displayFn={getPlatformLabel}
          keyProp="platform_id"
          onChange={(id, item) => {
            setFormData((prev) => ({ ...prev, platformId: id || '' }));
            setSelectedPlatform(item);
          }}
          disabled={saving}
        />
        <SingleSearchSelect
          label="Agency"
          placeholder="Search or enter agency..."
          initialItem={selectedAgency}
          searchApi={async (search) => {
            const filtered = options.agencies.filter((a) =>
              a.toLowerCase().includes(search.toLowerCase())
            );
            return { data: filtered.map((a) => ({ name: a })) };
          }}
          displayFn={(a: any) => a.name || ''}
          keyProp="name"
          onChange={(name, item) => {
            setFormData((prev) => ({ ...prev, agency: name || '' }));
            setSelectedAgency(item);
          }}
          allowCreation={true}
          commitOnBlur={true}
          disabled={saving}
        />
      </div>
    </div>
  );
}