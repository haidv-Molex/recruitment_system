import InputField from '@/components/common/InputField';
import type { CandidateFormChangeEvent, CandidateFormData } from './types';
import SectionHeader from './SectionHeader';

interface TimelineSectionProps {
  formData: CandidateFormData;
  handleChange: (event: CandidateFormChangeEvent) => void;
  saving: boolean;
}

export default function TimelineSection({ formData, handleChange, saving }: TimelineSectionProps) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
      <SectionHeader title="Recruitment Timeline" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InputField label="Offer Date" type="date" name="offerDate" value={formData.offerDate} onChange={handleChange} disabled={saving} />
        <InputField label="Expected Onboard Date" type="date" name="expectedOnboardDate" value={formData.expectedOnboardDate} onChange={handleChange} disabled={saving} />
        <InputField label="Onboard Date" type="date" name="onboardDate" value={formData.onboardDate} onChange={handleChange} disabled={saving} />
        <InputField label="Feedback Date" type="date" name="feedbackDate" value={formData.feedbackDate} onChange={handleChange} disabled={saving} />
      </div>
    </div>
  );
}