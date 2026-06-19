import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Shield, User, Lock, ShieldAlert, Key } from 'lucide-react';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import { useHeader } from '@/contexts/HeaderContext';
import { useConfirm } from '@/components/ui/ConfirmModal';
import ExcelTable, { ExcelColumn, formatDate } from '@/components/ui/ExcelTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import SingleSearchSelect from '@/components/ui/SingleSearchSelect';
import Button from '@/components/common/Button';

import { fetchUsersApi } from '@/services/userApi';
import { searchJobsApi } from '@/services/jobApi';
import { searchCandidatesApi } from '@/services/candidateApi';
import { fetchAccessListApi, createAccessApi, deleteAccessApi } from '@/services/accessApi';
import type { accessOutputModel } from '@/types/accessModel';

export const AccessControlPage = () => {
  const confirm = useConfirm();
  const { toasts, removeToast, toast } = useToast();
  const [accessRules, setAccessRules] = useState<accessOutputModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [restrictType, setRestrictType] = useState<'job' | 'candidate'>('job');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadAccessRules = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const result = await fetchAccessListApi({ page, limit });
      setAccessRules(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load access rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccessRules(1, pageSize);
  }, []);

  const handlePageChange = (page: number) => {
    loadAccessRules(page, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadAccessRules(1, newSize);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setRestrictType('job');
    setSelectedJob(null);
    setSelectedCandidate(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCreateAccessRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user.');
      return;
    }
    if (restrictType === 'job' && !selectedJob) {
      toast.error('Please select a job to restrict.');
      return;
    }
    if (restrictType === 'candidate' && !selectedCandidate) {
      toast.error('Please select a candidate to restrict.');
      return;
    }

    setSaving(true);
    try {
      await createAccessApi({
        user_id: selectedUser.user_id,
        job_id: restrictType === 'job' ? selectedJob.job_id : null,
        candidate_id: restrictType === 'candidate' ? selectedCandidate.candidate_id : null,
      });

      toast.success('Access restriction created successfully.');
      closeModal();
      loadAccessRules(currentPage, pageSize);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create restriction.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccessRule = async (idOrIds: number | number[], message: string) => {
    const isConfirmed = await confirm(message);
    if (!isConfirmed) return;

    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    try {
      await deleteAccessApi(ids);
      const count = ids.length;
      toast.success(count === 1 ? 'Restriction deleted.' : `Successfully deleted ${count} restrictions.`);
      const newTotal = totalItems - count;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      loadAccessRules(targetPage, pageSize);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const headerActions = useMemo(() => (
    <div className="flex items-center gap-2">
      <Button onClick={openCreateModal} icon={<Plus size={16} />}>
        Add Restriction
      </Button>
    </div>
  ), []);

  useHeader({
    title: '🔑 Access Control',
    subTitle: 'Configure display restrictions of specific jobs and candidates for non-admin users.',
    actions: headerActions,
  }, [headerActions]);

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'user_name',
        label: 'Username',
        width: 180,
        disableFilter: true,
        render: (row: any) => (
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <User size={14} className="text-slate-400" />
            <span>{row.user_name}</span>
          </div>
        ),
      },
      {
        key: 'user_role',
        label: 'Role',
        width: 120,
        disableFilter: true,
        render: (row: any) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-200">
            {row.user_role}
          </span>
        ),
      },
      {
        key: 'type',
        label: 'Restrict Type',
        width: 130,
        disableFilter: true,
        render: (row: any) => {
          const isJob = row.type === 'Job';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isJob
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isJob ? 'Job' : 'Candidate'}
            </span>
          );
        },
      },
      {
        key: 'resource_code',
        label: 'Resource Code / Fallback Name',
        width: 250,
        disableFilter: true,
        render: (row: any) => (
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            {row.resource_code}
          </span>
        ),
      },
      {
        key: 'resource_detail',
        label: 'Resource Detail Name',
        width: 280,
        disableFilter: true,
        render: (row: any) => row.resource_detail || '—',
      },
      {
        key: 'create_at',
        label: 'Restricted At',
        width: 160,
        disableFilter: true,
        render: (row: any) => formatDate(row.create_at),
      },
    ],
    []
  );

  const tableActions = [
    {
      label: 'Delete Restriction',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (row: any) => {
        handleDeleteAccessRule(
          row.access_id,
          `Are you sure you want to remove the visibility restriction for user "${row.user_name}"?`
        );
      },
      onBulkClick: (selectedRows: any[]) => {
        handleDeleteAccessRule(
          selectedRows.map((r) => r.access_id),
          `Are you sure you want to remove ${selectedRows.length} selected visibility restrictions?`
        );
      },
    },
  ];

  const tableRows = useMemo(() => {
    return accessRules.map((r) => {
      // Prioritize Code, Fallback to Name/Project
      const isJob = !!r.job;
      let resourceCode = '—';
      let resourceDetail = '—';

      if (isJob && r.job) {
        resourceCode = r.job.job_code || r.job.project || '—';
        resourceDetail = r.job.project || '—';
      } else if (r.candidate) {
        resourceCode = r.candidate.candidate_code || r.candidate.candidate_name || '—';
        resourceDetail = r.candidate.candidate_name || '—';
      }

      return {
        id: r.access_id,
        access_id: r.access_id,
        user_name: r.user.user_name,
        user_role: r.user.user_role,
        type: isJob ? 'Job' : 'Candidate',
        resource_code: resourceCode,
        resource_detail: resourceDetail,
        create_at: r.create_at,
      };
    });
  }, [accessRules]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ExcelTable
        title="Restricted Visibility Rules"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        emptyMessage="No access restrictions configured"
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="restrictions"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Add Restriction Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <Lock className="text-emerald-600 h-5 w-5" />
            <span>Add Access Restriction</span>
          </div>
        }
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccessRule} loading={saving}>
              Save Restriction
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateAccessRule} className="space-y-5">
          <p className="text-xs text-slate-500 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            Restrictions hide specific jobs or candidates from selected users in the tracking database. Admin users are unaffected by restrictions.
          </p>

          {/* User selection (only HR and Users can be restricted, Admins cannot be selected) */}
          <div className="space-y-1.5">
            <SingleSearchSelect<any>
              label="Select User"
              placeholder="Search user by username..."
              initialItem={selectedUser}
              searchApi={async (search) => {
                const res = await fetchUsersApi({ search, limit: 20 });
                // Hide admins because admins are unaffected by access controls
                const nonAdmins = (res.data || []).filter((u) => u.user_role !== 'admin');
                return { data: nonAdmins };
              }}
              displayFn={(item) => `${item.user_name} (${item.user_role})`}
              keyProp="user_id"
              onChange={(_, item) => setSelectedUser(item)}
              required
            />
          </div>

          {/* Restrict Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Restrict Type</label>
            <div className="flex items-center gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="restrictType"
                  value="job"
                  checked={restrictType === 'job'}
                  onChange={() => setRestrictType('job')}
                  className="w-4 h-4 text-emerald-600 border-slate-350 focus:ring-emerald-500"
                />
                <span>Job Visibility</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="restrictType"
                  value="candidate"
                  checked={restrictType === 'candidate'}
                  onChange={() => setRestrictType('candidate')}
                  className="w-4 h-4 text-emerald-600 border-slate-350 focus:ring-emerald-500"
                />
                <span>Candidate Visibility</span>
              </label>
            </div>
          </div>

          {/* Target selection based on type */}
          {restrictType === 'job' ? (
            <div className="space-y-1.5">
              <SingleSearchSelect<any>
                label="Select Job"
                placeholder="Search job by code or project name..."
                initialItem={selectedJob}
                searchApi={async (search) => {
                  const res = await searchJobsApi({ search, limit: 20 });
                  return { data: res.data || [] };
                }}
                displayFn={(item) => item.job_code ? `${item.job_code} - ${item.project}` : item.project}
                keyProp="job_id"
                onChange={(_, item) => setSelectedJob(item)}
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <SingleSearchSelect<any>
                label="Select Candidate"
                placeholder="Search candidate by code or name..."
                initialItem={selectedCandidate}
                searchApi={async (search) => {
                  const res = await searchCandidatesApi({ search, limit: 20 });
                  return { data: res.data || [] };
                }}
                displayFn={(item) => item.candidate_code ? `${item.candidate_code} - ${item.candidate_name}` : item.candidate_name}
                keyProp="candidate_id"
                onChange={(_, item) => setSelectedCandidate(item)}
                required
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AccessControlPage;
