import { useState, useEffect, useMemo } from 'react';
import CandidateTable from '../components/candidate/CandidateTable';
import CandidateForm from '../components/candidate/CandidateForm';
import { mockCandidates } from '../services/mockData';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import { Plus } from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';
import { useConfirm } from '@/components/ui/ConfirmModal';

export const CandidatesPage = () => {
  const confirm = useConfirm();
  const [candidates, setCandidates] = useState<any[]>(mockCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>(mockCandidates);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let filtered = candidates;

    if (filterStatus) {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterDepartment) {
      filtered = filtered.filter((c) => c.department === filterDepartment);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCandidates(filtered);
  }, [candidates, filterStatus, filterDepartment, searchQuery]);

  const handleAddCandidate = async (data: any) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newCandidate = {
        ...data,
        id: `cand-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCandidates([...candidates, newCandidate]);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = async (data: any) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (selectedCandidate) {
        setCandidates(
          candidates.map((c) =>
            c.id === selectedCandidate.id
              ? { ...c, ...data, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
      setShowForm(false);
      setSelectedCandidate(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string | number) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa 1 ứng viên không?');
    if (isConfirmed) {
      setCandidates(candidates.filter((c) => c.id !== id));
    }
  };

  const handleOpenForm = (candidate?: any) => {
    setSelectedCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedCandidate(undefined);
  };

  const uniqueStatuses = Array.from(new Set(candidates.map((c) => c.status)));
  const uniqueDepartments = Array.from(new Set(candidates.map((c) => c.department)));

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...uniqueStatuses.map((status) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    })),
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...uniqueDepartments.map((dept) => ({ value: dept, label: dept })),
  ];

  const headerActions = useMemo(() => (
    <Button onClick={() => handleOpenForm()} icon={<Plus size={16} />}>
      Add Candidate
    </Button>
  ), []);

  useHeader({
    title: 'Candidates',
    subTitle: `Total: ${filteredCandidates.length} candidates listed`,
    actions: headerActions,
  }, [filteredCandidates.length, headerActions]);

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Filter Options</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <SelectField
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
          />

          <SelectField
            label="Department"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            options={departmentOptions}
          />
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <CandidateTable
          candidates={filteredCandidates}
          onEdit={handleOpenForm}
          onDelete={handleDeleteCandidate}
          onSelectRow={handleOpenForm}
          loading={false}
        />
      </div>

      {showForm && (
        <CandidateForm
          candidate={selectedCandidate}
          onSubmit={selectedCandidate ? handleUpdateCandidate : handleAddCandidate}
          onClose={handleCloseForm}
          saving={loading}
        />
      )}
    </div>
  );
};
export default CandidatesPage;
