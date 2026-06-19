import InputField from '@/components/common/InputField';
import type { CandidateFormChangeEvent, CandidateFormData } from './types';

interface ContactSectionProps {
  formData: CandidateFormData;
  handleChange: (event: CandidateFormChangeEvent) => void;
  handlePhoneInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
}

export default function ContactSection({ formData, handleChange, handlePhoneInput, saving }: ContactSectionProps) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Email"
          type="email"
          name="candidateEmail"
          value={formData.candidateEmail}
          onChange={handleChange}
          placeholder="e.g. email@example.com"
          disabled={saving}
        />
        <InputField
          label="Phone"
          type="tel"
          name="candidatePhone"
          value={formData.candidatePhone}
          onChange={handlePhoneInput}
          placeholder="e.g. +084.123.412"
          disabled={saving}
        />
      </div>
    </div>
  );
}