import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import FileUploadField from '@/components/common/FileUploadField';
import OutlookSearchSelect from '@/components/ui/OutlookSearchSelect';
import { searchLevelsApi } from '@/services/levelApi';
import type { CandidateFormChangeEvent, CandidateFormData, CandidateFormSetData } from './types';
import { getLevelLabel } from './utils';
import SectionHeader from './SectionHeader';

interface BasicInfoSectionProps {
  formData: CandidateFormData;
  setFormData: CandidateFormSetData;
  statusOptions: Array<{ value: string | number; label: string }>;
  selectedLevels: any[];
  setSelectedLevels: (items: any[]) => void;
  handleChange: (event: CandidateFormChangeEvent) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  candidate?: any;
}

export default function BasicInfoSection({
  formData,
  setFormData,
  statusOptions,
  selectedLevels,
  setSelectedLevels,
  handleChange,
  handleFileChange,
  saving,
  candidate,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
      <SectionHeader title="Required & Key Information" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Candidate Name *"
          name="candidateName"
          value={formData.candidateName}
          onChange={handleChange}
          placeholder="e.g. Nguyễn Văn A"
          disabled={saving}
        />
        <SelectField
          label="Status *"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
          disabled={saving}
        />
        <FileUploadField
          label="CV File (optional)"
          fileName={
            formData.file
              ? formData.file.name
              : candidate?.file
                ? (candidate.file.file_name || candidate.file.file_path?.split('/').pop())
                : null
          }
          placeholder="Click to select CV file..."
          onChange={handleFileChange}
          disabled={saving}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Candidate Code"
          name="candidateCode"
          value={formData.candidateCode}
          onChange={handleChange}
          placeholder="e.g. CAND-001 (Optional)"
          disabled={saving}
        />
        <OutlookSearchSelect
          label="Candidate Levels"
          placeholder="Search levels..."
          initialItems={selectedLevels}
          searchApi={(search) => searchLevelsApi({ search })}
          displayFn={getLevelLabel}
          chipDisplayFn={getLevelLabel}
          keyProp="level_id"
          allowCreation={false}
          onChange={(ids, items) => {
            setFormData((prev) => ({ ...prev, candidateLevels: ids.map(Number).filter(Number.isFinite) }));
            setSelectedLevels(items);
          }}
          disabled={saving}
        />
      </div>
    </div>
  );
}