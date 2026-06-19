import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import Button from '@/components/common/Button';
import SingleSearchSelect from '@/components/ui/SingleSearchSelect';
import { searchCompaniesApi } from '@/services/companyApi';
import { Plus, Trash2 } from 'lucide-react';
import MultiValueCreatableField from './MultiValueCreatableField';
import SectionHeader from './SectionHeader';
import TextareaField from './TextareaField';
import type {
  CandidateFormChangeEvent,
  CandidateFormData,
  CandidateFormSetData,
  EducationDetailFormData,
  LanguageDetailFormData,
  LinkFormData,
  WorkExperienceDetailFormData,
} from './types';
import {
  emptyEducationDetail,
  emptyLanguageDetail,
  emptyWorkExperienceDetail,
} from './types';

interface DetailSectionProps {
  formData: CandidateFormData;
  setFormData: CandidateFormSetData;
  handleChange: (event: CandidateFormChangeEvent) => void;
  selectedCompany: any | null;
  setSelectedCompany: (item: any | null) => void;
  showDetailSection: boolean;
  setShowDetailSection: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
}

const genderOptions = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const maritalStatusOptions = [
  { value: '', label: 'Select Marital Status' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
];

export default function DetailSection({
  formData,
  setFormData,
  handleChange,
  selectedCompany,
  setSelectedCompany,
  showDetailSection,
  setShowDetailSection,
  saving,
}: DetailSectionProps) {
  const handleLinkChange = (name: 'github' | 'linkedin' | 'portfolio', value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [name]: value,
      },
    }));
  };

  const handleOtherLinksChange = (values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        other: values,
      },
    }));
  };

  const handleListChange = (name: 'skills' | 'languages' | 'certifications', values: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  const addLanguageDetail = () => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: [...prev.languageDetails, emptyLanguageDetail()],
    }));
  };

  const updateLanguageDetail = (index: number, field: keyof LanguageDetailFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: prev.languageDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeLanguageDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: prev.languageDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addEducationDetail = () => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: [...prev.educationDetails, emptyEducationDetail()],
    }));
  };

  const updateEducationDetail = (index: number, field: keyof EducationDetailFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEducationDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addWorkExperienceDetail = () => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: [...prev.workExperienceDetails, emptyWorkExperienceDetail()],
    }));
  };

  const updateWorkExperienceDetail = (
    index: number,
    field: keyof Omit<WorkExperienceDetailFormData, 'responsibilities' | 'is_current'>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateWorkExperienceResponsibilities = (index: number, values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, responsibilities: values } : item
      ),
    }));
  };

  const removeWorkExperienceDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <div className="bg-slate-50/50 rounded-xl border border-slate-100/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setShowDetailSection((prev) => !prev)}
        className="w-full p-4 text-left hover:bg-slate-100/60 transition-colors"
        disabled={saving}
      >
        <SectionHeader
          title="Candidate Detail / CV Data"
          trailing={<span className="text-xs font-semibold text-emerald-700">{showDetailSection ? 'Hide' : 'Show'}</span>}
        />
      </button>

      {showDetailSection && (
        <div className="p-4 border-t border-slate-100 space-y-5">
          <div className="space-y-4">
            <SectionHeader title="Profile" compact />
            <TextareaField label="Summary" name="summary" value={formData.summary} onChange={handleChange} rows={3} disabled={saving} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} disabled={saving} />
              <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={genderOptions} disabled={saving} />
              <SelectField label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={maritalStatusOptions} disabled={saving} />
              <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} disabled={saving} />
              <InputField label="Location" name="location" value={formData.location} onChange={handleChange} disabled={saving} />
              <InputField label="Salary Currency" name="salaryCurrency" value={formData.salaryCurrency} onChange={handleChange} placeholder="VND" disabled={saving} />
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Links & Skills" compact />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="GitHub" value={formData.links.github} onChange={(e) => handleLinkChange('github', e.target.value)} disabled={saving} />
              <InputField label="LinkedIn" value={formData.links.linkedin} onChange={(e) => handleLinkChange('linkedin', e.target.value)} disabled={saving} />
              <InputField label="Portfolio" value={formData.links.portfolio} onChange={(e) => handleLinkChange('portfolio', e.target.value)} disabled={saving} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiValueCreatableField label="Other Links" placeholder="Type a link and press Enter..." values={formData.links.other} onChange={handleOtherLinksChange} disabled={saving} />
              <MultiValueCreatableField label="Skills" placeholder="Type a skill and press Enter..." values={formData.skills} onChange={(values) => handleListChange('skills', values)} disabled={saving} />
              <MultiValueCreatableField label="Languages" placeholder="Type a language and press Enter..." values={formData.languages} onChange={(values) => handleListChange('languages', values)} disabled={saving} />
              <MultiValueCreatableField label="Certifications" placeholder="Type a certification and press Enter..." values={formData.certifications} onChange={(values) => handleListChange('certifications', values)} disabled={saving} />
            </div>

            <DetailRepeaterHeader title="Language Details" onAdd={addLanguageDetail} saving={saving} />
            {formData.languageDetails.map((item, index) => (
              <DetailCard key={`language-${index}`} title={`Language ${index + 1}`} onRemove={() => removeLanguageDetail(index)} saving={saving}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Language" value={item.language} onChange={(e) => updateLanguageDetail(index, 'language', e.target.value)} disabled={saving} />
                  <InputField label="Proficiency" value={item.proficiency} onChange={(e) => updateLanguageDetail(index, 'proficiency', e.target.value)} disabled={saving} />
                </div>
              </DetailCard>
            ))}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Education" compact />
            <TextareaField label="Education" name="education" value={formData.education} onChange={handleChange} rows={3} disabled={saving} />
            <DetailRepeaterHeader title="Education Details" onAdd={addEducationDetail} saving={saving} />
            {formData.educationDetails.map((item, index) => (
              <DetailCard key={`education-${index}`} title={`Education ${index + 1}`} onRemove={() => removeEducationDetail(index)} saving={saving}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField label="Institution" value={item.institution} onChange={(e) => updateEducationDetail(index, 'institution', e.target.value)} disabled={saving} />
                  <InputField label="Degree" value={item.degree} onChange={(e) => updateEducationDetail(index, 'degree', e.target.value)} disabled={saving} />
                  <InputField label="Field" value={item.field} onChange={(e) => updateEducationDetail(index, 'field', e.target.value)} disabled={saving} />
                  <InputField label="Start Date" type="date" value={item.start_date} onChange={(e) => updateEducationDetail(index, 'start_date', e.target.value)} disabled={saving} />
                  <InputField label="End Date" type="date" value={item.end_date} onChange={(e) => updateEducationDetail(index, 'end_date', e.target.value)} disabled={saving} />
                </div>
              </DetailCard>
            ))}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Experience" compact />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Experience Years" name="experienceYears" value={formData.experienceYears} onChange={handleChange} disabled={saving} />
              <InputField label="Current Position" name="currentPosition" value={formData.currentPosition} onChange={handleChange} disabled={saving} />
              <InputField label="Current Level" name="currentLevel" value={formData.currentLevel} onChange={handleChange} disabled={saving} />
              <InputField label="Current Salary" type="number" min="0" step="0.01" name="currentSalary" value={formData.currentSalary} onChange={handleChange} placeholder="2200" disabled={saving} />
              <InputField label="Last Company" name="lastCompany" value={formData.lastCompany} onChange={handleChange} disabled={saving} />
            </div>
            <TextareaField label="Work Experience" name="workExperience" value={formData.workExperience} onChange={handleChange} rows={3} disabled={saving} />

            <DetailRepeaterHeader title="Work Experience Details" onAdd={addWorkExperienceDetail} saving={saving} />
            {formData.workExperienceDetails.map((item, index) => (
              <DetailCard key={`work-${index}`} title={`Work Experience ${index + 1}`} onRemove={() => removeWorkExperienceDetail(index)} saving={saving}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Title" value={item.title} onChange={(e) => updateWorkExperienceDetail(index, 'title', e.target.value)} disabled={saving} />
                  <InputField label="Company" value={item.company} onChange={(e) => updateWorkExperienceDetail(index, 'company', e.target.value)} disabled={saving} />
                  <InputField label="Start Date" type="date" value={item.start_date} onChange={(e) => updateWorkExperienceDetail(index, 'start_date', e.target.value)} disabled={saving} />
                  <InputField label="End Date" type="date" value={item.end_date} onChange={(e) => updateWorkExperienceDetail(index, 'end_date', e.target.value)} disabled={saving} />
                </div>
                <MultiValueCreatableField label="Responsibilities" placeholder="Type a responsibility and press Enter..." values={item.responsibilities} onChange={(values) => updateWorkExperienceResponsibilities(index, values)} disabled={saving} />
              </DetailCard>
            ))}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Expectations" compact />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Expected Position" name="expectedPosition" value={formData.expectedPosition} onChange={handleChange} disabled={saving} />
              <InputField label="Expected Level" name="expectedLevel" value={formData.expectedLevel} onChange={handleChange} disabled={saving} />
              <InputField label="Expected Salary" type="number" min="0" step="0.01" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} placeholder="2800" disabled={saving} />
              <InputField label="Expected Work Location" name="expectedWorkLocation" value={formData.expectedWorkLocation} onChange={handleChange} disabled={saving} />
              <SingleSearchSelect
                label="Targeted Company"
                placeholder="Search or enter company..."
                initialItem={selectedCompany}
                searchApi={(search) => searchCompaniesApi({ search })}
                displayFn={(company: any) => company.company_name || ''}
                keyProp="company_id"
                onChange={(id, item) => {
                  const isCreatedItem = item && typeof item.company_id === 'string' && item.company_id === item.company_name;
                  const numericId = !isCreatedItem && id !== null && id !== undefined && !Number.isNaN(Number(id)) ? Number(id) : null;
                  setFormData((prev) => ({
                    ...prev,
                    targetedCompanyId: numericId || '',
                    targetedCompanyName: numericId ? '' : (item?.company_name || ''),
                  }));
                  setSelectedCompany(item);
                }}
                allowCreation={true}
                commitOnBlur={true}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRepeaterHeader({ title, onAdd, saving }: { title: string; onAdd: () => void; saving: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h5 className="text-xs font-semibold text-slate-700">{title}</h5>
      <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-xs" icon={<Plus size={14} />} onClick={onAdd} disabled={saving}>
        Add
      </Button>
    </div>
  );
}

function DetailCard({
  title,
  onRemove,
  saving,
  children,
}: {
  title: string;
  onRemove: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <Button type="button" variant="ghost" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50" icon={<Trash2 size={14} />} onClick={onRemove} disabled={saving}>
          Remove
        </Button>
      </div>
      {children}
    </div>
  );
}