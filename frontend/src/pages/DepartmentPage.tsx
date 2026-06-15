import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchDepartmentsApi, createDepartmentApi, deleteDepartmentApi, updateDepartmentApi } from '../services/departmentApi';
import DepartmentForm from '../components/department/DepartmentForm';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ExcelTable, { ExcelColumn } from '../components/ui/ExcelTable';
import { useHeader } from '../contexts/HeaderContext';

export const DepartmentPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadDepartments = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchDepartmentsApi({
        page,
        limit,
        search,
      });
      setDepartments(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments(1, pageSize, searchQuery);
  }, []);

  const handlePageChange = (page: number) => {
    loadDepartments(page, pageSize, searchQuery);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadDepartments(1, newSize, searchQuery);
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
        loadDepartments(currentPage, pageSize, searchQuery);
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
        loadDepartments(currentPage, pageSize, searchQuery);
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
      loadDepartments(currentPage, pageSize, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Department
    </Button>
  ), []);

  useHeader({
    title: '🏢 Department Management',
    subTitle: 'Manage corporate departments and operations structure.',
    actions: headerActions,
  }, [headerActions]);

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'department_code',
        label: 'Code',
        width: 120,
        disableFilter: true,
        render: (_: any, val: any) => (
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-emerald-700">
            {val || '—'}
          </span>
        ),
      },
      {
        key: 'department_name',
        label: 'Department Name',
        width: 250,
        disableFilter: true,
      },
      {
        key: 'department_description',
        label: 'Description',
        width: 450,
        disableFilter: true,
        render: (_: any, val: any) => val || '—',
      },
    ],
    []
  );

  const tableActions = [
    {
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: (row: any) => {
        openEditForm(row);
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (row: any) => {
        handleDelete(row);
      },
    },
  ];

  // Map rows for ExcelTable
  const tableRows = useMemo(() => {
    return departments.map((d) => ({
      id: d.department_id,
      department_id: d.department_id,
      department_code: d.department_code,
      department_name: d.department_name,
      department_description: d.department_description,
    }));
  }, [departments]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    loadDepartments(1, pageSize, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Department Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No departments found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="departments"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
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
