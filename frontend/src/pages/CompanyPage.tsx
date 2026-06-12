import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchCompaniesApi, createCompanyApi, deleteCompanyApi, updateCompanyApi } from '../services/companyApi';
import CompanyTable from '../components/company/CompanyTable';
import CompanyForm from '../components/company/CompanyForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

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

  const handleSearch = () => {
    setCurrentPage(1);
    loadCompanies(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadCompanies(1, '');
  };

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

  return (
    <div className="max-w-[900px] mx-auto p-6 space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            🏢 Company Database
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage corporate entities and partner companies.
          </p>
        </div>
        <Button onClick={openCreateForm} icon={<Plus size={16} />}>
          Add Company
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Companies"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleClearSearch} className="flex-1 sm:flex-none">
            Clear
          </Button>
          <Button onClick={handleSearch} icon={<Search size={16} />} className="flex-1 sm:flex-none">
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <CompanyTable
        companies={companies}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
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
