import React from 'react';
import { X } from 'lucide-react';
import OutlookSearchSelect from '../ui/OutlookSearchSelect';
import SingleSearchSelect from '../ui/SingleSearchSelect';
import { searchDepartmentsApi } from '../../services/departmentApi';
import { searchSegmentsApi } from '../../services/segmentApi';
import { searchSitesApi } from '../../services/siteApi';
import { searchLevelsApi } from '../../services/levelApi';
import { fetchUsersApi } from '../../services/userApi';

interface JobRelationFieldsProps {
  saving: boolean;
  setFormData: React.Dispatch<React.SetStateAction<any>>;

  selectedDepts: any[];
  setSelectedDepts: (items: any[]) => void;

  selectedSegs: any[];
  setSelectedSegs: (items: any[]) => void;

  selectedSites: any[];
  setSelectedSites: (items: any[]) => void;

  selectedTitles: any[];
  setSelectedTitles: (items: any[]) => void;

  selectedEmpLevels: any[];
  setSelectedEmpLevels: (items: any[]) => void;

  selectedManagers: any[];
  setSelectedManagers: (items: any[]) => void;

  selectedRecruiter: any | null;
  setSelectedRecruiter: (item: any | null) => void;
}

export default function JobRelationFields({
  saving,
  setFormData,
  selectedDepts,
  setSelectedDepts,
  selectedSegs,
  setSelectedSegs,
  selectedSites,
  setSelectedSites,
  selectedTitles,
  setSelectedTitles,
  selectedEmpLevels,
  setSelectedEmpLevels,
  selectedManagers,
  setSelectedManagers,
  selectedRecruiter,
  setSelectedRecruiter,
}: JobRelationFieldsProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <div className="flex flex-col gap-2.5">
        <OutlookSearchSelect
          label="Departments"
          placeholder="Search departments..."
          initialItems={selectedDepts}
          searchApi={(search) => searchDepartmentsApi({ search })}
          displayFn={(d: any) => d.department_name || ''}
          chipDisplayFn={(d: any) => d.department_code || d.department_name || ''}
          keyProp="department_id"
          onChange={(ids, items) => {
            setFormData((prev: any) => ({ ...prev, departments: ids }));
            setSelectedDepts(items);
          }}
          disabled={saving}
          hideChips={true}
        />

        {selectedDepts.length > 0 && (
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-2 max-h-[200px] overflow-y-auto">
            {selectedDepts.map((dept) => {
              const key = dept.department_id;
              const name = dept.department_name || dept.department_code || 'Unnamed Department';
              const count = dept.candidate_required !== undefined ? dept.candidate_required : 1;
              const user_name = dept.user_name || (dept.user && dept.user.user_name);
              const user_code = dept.user_code || (dept.user && dept.user.user_code);
              const hrbpLabel = user_name
                ? `${dept.department_code || ''} - ${user_code ? `${user_code} - ` : ''}${user_name}`
                : `${dept.department_code || ''} - Unassigned`;
              return (
                <div key={key} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-700 truncate" title={name}>
                      {name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={hrbpLabel}>
                      HRBP: <span className="font-semibold text-emerald-700">{hrbpLabel}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center border border-slate-300 rounded bg-slate-50 overflow-hidden h-7">
                      <button
                        type="button"
                        disabled={saving || count <= 1}
                        onClick={() => {
                          const val = Math.max(1, count - 1);
                          const updated = selectedDepts.map((d) => 
                            d.department_id === key ? { ...d, candidate_required: val } : d
                          );
                          setSelectedDepts(updated);
                        }}
                        className="px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 transition-colors text-sm font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={count}
                        disabled={saving}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          const updated = selectedDepts.map((d) => 
                            d.department_id === key ? { ...d, candidate_required: val } : d
                          );
                          setSelectedDepts(updated);
                        }}
                        className="w-10 text-center text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          const val = count + 1;
                          const updated = selectedDepts.map((d) => 
                            d.department_id === key ? { ...d, candidate_required: val } : d
                          );
                          setSelectedDepts(updated);
                        }}
                        className="px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = selectedDepts.filter((d) => d.department_id !== key);
                        setSelectedDepts(updated);
                        setFormData((prev: any) => ({
                          ...prev,
                          departments: updated.map((d) => d.department_id),
                        }));
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OutlookSearchSelect
        label="Segments"
        placeholder="Search or type a new segment..."
        initialItems={selectedSegs}
        searchApi={(search) => searchSegmentsApi({ search })}
        displayFn={(s: any) => s.segment_name || ''}
        chipDisplayFn={(s: any) => s.segment_code || s.segment_name || ''}
        keyProp="segment_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, segments: ids }));
          setSelectedSegs(items);
        }}
        disabled={saving}
        allowCreation={true}
        commitOnBlur={true}
      />

      <OutlookSearchSelect
        label="Sites"
        placeholder="Search or type a new site..."
        initialItems={selectedSites}
        searchApi={(search) => searchSitesApi({ search })}
        displayFn={(s: any) => s.site_name || ''}
        chipDisplayFn={(s: any) => s.site_code || s.site_name || ''}
        keyProp="site_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, sites: ids }));
          setSelectedSites(items);
        }}
        disabled={saving}
        allowCreation={true}
        commitOnBlur={true}
      />

      <OutlookSearchSelect
        label="Titles (Job Level)"
        placeholder="Search titles..."
        initialItems={selectedTitles}
        searchApi={(search) => searchLevelsApi({ search })}
        displayFn={(l: any) => l.level_name || ''}
        chipDisplayFn={(l: any) => l.level_code || l.level_name || ''}
        keyProp="level_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, titles: ids }));
          setSelectedTitles(items);
        }}
        disabled={saving}
      />

      <OutlookSearchSelect
        label="Employee Levels"
        placeholder="Search or type a new employee level..."
        initialItems={selectedEmpLevels}
        searchApi={(search) => searchLevelsApi({ search })}
        displayFn={(l: any) => l.level_name || ''}
        chipDisplayFn={(l: any) => l.level_code || l.level_name || ''}
        keyProp="level_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, employeeLevels: ids }));
          setSelectedEmpLevels(items);
        }}
        disabled={saving}
        allowCreation={true}
        commitOnBlur={true}
      />

      <OutlookSearchSelect
        label="Hiring Managers"
        placeholder="Search or type a new manager..."
        initialItems={selectedManagers}
        searchApi={(search) => fetchUsersApi({ search })}
        displayFn={(u: any) => u.user_code ? `${u.user_code} - ${u.user_name || ''}` : u.user_name || ''}
        chipDisplayFn={(u: any) => u.user_code ? `${u.user_code} - ${u.user_name || ''}` : u.user_name || ''}
        keyProp="user_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, managers: ids }));
          setSelectedManagers(items);
        }}
        disabled={saving}
        allowCreation={true}
        commitOnBlur={true}
      />

      <SingleSearchSelect
        label="Recruiter"
        placeholder="Search or type a new recruiter..."
        initialItem={selectedRecruiter}
        searchApi={(search) => fetchUsersApi({ search })}
        displayFn={(u: any) => u.user_code ? `${u.user_code} - ${u.user_name || ''}` : u.user_name || ''}
        keyProp="user_id"
        onChange={(id, item) => {
          const numericId = id !== null && id !== undefined && !isNaN(Number(id)) ? Number(id) : null;
          setFormData((prev: any) => ({
            ...prev,
            recruiterId: numericId || '',
            recruiterName: numericId ? '' : (item?.user_name || ''),
          }));
          setSelectedRecruiter(item);
        }}
        disabled={saving}
        allowCreation={true}
        commitOnBlur={true}
      />
    </div>
  );
}
