import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../common/Button';

export interface CandidatesHeaderProps {
  total: number;
  onAddCandidate: () => void;
}

export default function CandidatesHeader({ total, onAddCandidate }: CandidatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">👤 Candidates</h1>
        <p className="text-sm text-slate-500 mt-1">
          Total: <span className="font-bold text-slate-700">{total}</span> candidates listed
        </p>
      </div>
      <Button onClick={onAddCandidate} icon={<Plus size={16} />}>
        Add Candidate
      </Button>
    </div>
  );
}
