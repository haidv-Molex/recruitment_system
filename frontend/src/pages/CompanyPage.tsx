import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchCompaniesApi, createCompanyApi, deleteCompanyApi, updateCompanyApi } from '../services/companyApi';
import CompanyForm from '../components/company/CompanyForm';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ExcelTable, { ExcelColumn } from '../components/ui/ExcelTable';
import { useHeader } from '../contexts/HeaderContext';

const ITEMS_PER_PAGE = 10;

export const CompanyPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadCompanies = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchCompaniesApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setCompanies(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies(currentPage, searchQuery);
  }, [currentPage]);

  const openCreateForm = () => {
    setEditingCompany(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (company: any) => {
    setEditingCompany(company);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormError('');
  };

  const handleSubmit = async (data: { name: string; description: string }) => {
    setFormError('');

    if (!data.name.trim()) {
      setFormError('Company name is required.');
      return;
    }

    setSaving(true);

    if (editingCompany) {
      try {
        await updateCompanyApi(
          editingCompany.company_id,
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Company updated successfully.');
        closeForm();
        loadCompanies(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createCompanyApi(
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Company created successfully.');
        closeForm();
        loadCompanies(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (company: any) => {
    if (!confirm(`Are you sure you want to delete "${company.company_name}"?`)) {
      return;
    }

    try {
      await deleteCompanyApi(company.company_id);
      toast.success('Company deleted.');
      loadCompanies(currentPage, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Company
    </Button>
  ), []);

  useHeader({
    title: '🏢 Company Database',
    subTitle: 'Manage corporate entities and partner companies.',
    actions: headerActions,
  }, [headerActions]);

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'company_name',
        label: 'Company Name',
        width: 250,
        disableFilter: true,
      },
      {
        key: 'company_description',
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
    return companies.map((c) => ({
      id: c.company_id,
      company_id: c.company_id,
      company_name: c.company_name,
      company_description: c.company_description,
    }));
  }, [companies]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    setCurrentPage(1);
    loadCompanies(1, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Company Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No companies found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || companies.length}
        onPageChange={setCurrentPage}
        itemLabel="companies"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingCompany ? '✏️ Edit Company' : '🏢 Create Company'}
        >
          <CompanyForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingCompany
                ? {
                    name: editingCompany.company_name,
                    description: editingCompany.company_description || '',
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
export default CompanyPage;
