import React from 'react';
import InputField from '../common/InputField';

export interface DatabaseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function DatabaseFilters({ searchQuery, onSearchChange }: DatabaseFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-4 items-center">
      <div className="flex-1 max-w-md">
        <InputField
          label="Search Candidates"
          placeholder="Type name, email or phone to search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
