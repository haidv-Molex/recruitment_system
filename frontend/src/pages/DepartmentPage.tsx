import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchDepartmentsApi, createDepartmentApi, deleteDepartmentApi, updateDepartmentApi } from '../services/departmentApi';
import DepartmentTable from '../components/department/DepartmentTable';
import DepartmentForm from '../components/department/DepartmentForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

const ITEMS_PER_PAGE = 10;

export const DepartmentPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadDepartments = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchDepartmentsApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setDepartments(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadDepartments(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadDepartments(1, '');
  };

  const openCreateForm = () => {
    setEditingDept(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (dept: any) => {
    setEditingDept(dept);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDept(null);
    setFormError('');
  };

  const handleSubmit = async (data: { code: string; name: string; description: string }) => {
    setFormError('');

    if (!data.code.trim()) {
      setFormError('Department code is required.');
      return;
    }
    if (!data.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    setSaving(true);

    if (editingDept) {
      try {
        await updateDepartmentApi(
          editingDept.department_id,
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Department updated successfully.');
        closeForm();
        loadDepartments(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createDepartmentApi(
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Department created successfully.');
        closeForm();
        loadDepartments(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (dept: any) => {
    if (!confirm(`Are you sure you want to delete "${dept.department_name}"?`)) {
      return;
    }

    try {
      await deleteDepartmentApi(dept.department_id);
      toast.success('Department deleted.');
      loadDepartments(currentPage, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;

  return (
    <div className="max-w-[900px] mx-auto p-6 space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            🏢 Department Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage corporate departments and operations structure.
          </p>
        </div>
        <Button onClick={openCreateForm} icon={<Plus size={16} />}>
          Add Department
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Departments"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleClearSearch} className="w-full sm:w-auto">
            Clear
          </Button>
          <Button onClick={handleSearch} icon={<Search size={16} />} className="w-full sm:w-auto">
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <DepartmentTable
        departments={departments}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || departments.length}
        onPageChange={setCurrentPage}
        itemLabel="departments"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingDept ? '✏️ Edit Department' : '🏢 Create Department'}
        >
          <DepartmentForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingDept
                ? {
                    code: editingDept.department_code || '',
                    name: editingDept.department_name,
                    description: editingDept.department_description || '',
                  }
                : undefined
            }
            isLoading={saving}
            error={formError}
          />
        </Modal>
      )}
    </div>
  );
};
export default DepartmentPage;
