import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import Button from '../common/Button';

export interface AdminFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  onClear: () => void;
}

export default function AdminFilters({
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  onClear,
}: AdminFiltersProps) {
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'hr', label: 'HR User' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'viewer', label: 'Viewer' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-end w-full">
      <div className="flex-1 min-w-[200px]">
        <InputField
          label="Search Users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or account..."
        />
      </div>

      <div className="w-full sm:w-[180px]">
        <SelectField
          label="Role"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          options={roleOptions}
        />
      </div>

      <Button
        variant="secondary"
        onClick={onClear}
        className="w-full sm:w-auto h-[38px] px-4 py-1.5 flex items-center justify-center font-semibold text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
      >
        Clear Filters
      </Button>
    </div>
  );
}
