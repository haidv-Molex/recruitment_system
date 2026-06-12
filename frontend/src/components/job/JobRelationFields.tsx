import React from 'react';
import OutlookSearchSelect from '../ui/OutlookSearchSelect';
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

  selectedPartners: any[];
  setSelectedPartners: (items: any[]) => void;

  selectedManagers: any[];
  setSelectedManagers: (items: any[]) => void;
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
  selectedPartners,
  setSelectedPartners,
  selectedManagers,
  setSelectedManagers,
}: JobRelationFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <OutlookSearchSelect
        label="🏬 Departments"
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
      />

      <OutlookSearchSelect
        label="📦 Segments"
        placeholder="Search segments..."
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
      />

      <OutlookSearchSelect
        label="📍 Sites"
        placeholder="Search sites..."
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
      />

      <OutlookSearchSelect
        label="🏅 Titles (Job Level)"
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
        label="🏅 Employee Levels"
        placeholder="Search employee levels..."
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
      />

      <OutlookSearchSelect
        label="👤 HRBP (Partners)"
        placeholder="Search partners..."
        initialItems={selectedPartners}
        searchApi={(search) => fetchUsersApi({ search })}
        displayFn={(u: any) => u.user_name || ''}
        chipDisplayFn={(u: any) => u.user_name || ''}
        keyProp="user_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, partners: ids }));
          setSelectedPartners(items);
        }}
        disabled={saving}
      />

      <OutlookSearchSelect
        label="👔 Hiring Managers"
        placeholder="Search managers..."
        initialItems={selectedManagers}
        searchApi={(search) => fetchUsersApi({ search })}
        displayFn={(u: any) => u.user_name || ''}
        chipDisplayFn={(u: any) => u.user_name || ''}
        keyProp="user_id"
        onChange={(ids, items) => {
          setFormData((prev: any) => ({ ...prev, managers: ids }));
          setSelectedManagers(items);
        }}
        disabled={saving}
      />
    </div>
  );
}
