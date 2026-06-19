import TextareaField from './TextareaField';
import type { CandidateFormChangeEvent, CandidateFormData } from './types';

interface NotesSectionProps {
  formData: CandidateFormData;
  handleChange: (event: CandidateFormChangeEvent) => void;
  saving: boolean;
}

export default function NotesSection({ formData, handleChange, saving }: NotesSectionProps) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments & Notes</h3>
      <TextareaField
        label="Note"
        name="note"
        value={formData.note}
        onChange={handleChange}
        rows={3}
        disabled={saving}
      />
    </div>
  );
}