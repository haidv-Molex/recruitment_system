import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchSitesApi, createSiteApi, deleteSiteApi, updateSiteApi } from '../services/siteApi';
import SiteTable from '../components/site/SiteTable';
import SiteForm from '../components/site/SiteForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { useHeader } from '../contexts/HeaderContext';

const ITEMS_PER_PAGE = 10;

export const SitePage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadSites = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchSitesApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setSites(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadSites(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadSites(1, '');
  };

  const openCreateForm = () => {
    setEditingSite(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (site: any) => {
    setEditingSite(site);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSite(null);
    setFormError('');
  };

  const handleSubmit = async (data: { code: string; name: string; description: string }) => {
    setFormError('');

    if (!data.code.trim()) {
      setFormError('Site code is required.');
      return;
    }
    if (!data.name.trim()) {
      setFormError('Site name is required.');
      return;
    }

    setSaving(true);

    if (editingSite) {
      try {
        await updateSiteApi(
          editingSite.site_id,
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Site updated successfully.');
        closeForm();
        loadSites(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createSiteApi(
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Site created successfully.');
        closeForm();
        loadSites(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (site: any) => {
    if (!confirm(`Are you sure you want to delete "${site.site_name}"?`)) {
      return;
    }

    try {
      await deleteSiteApi(site.site_id);
      toast.success('Site deleted.');
      loadSites(currentPage, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Site
    </Button>
  ), []);

  useHeader({
    title: '📍 Site Location Management',
    subTitle: 'Manage corporate office locations and operational sites.',
    actions: headerActions,
  }, [headerActions]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Sites"
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
      <SiteTable
        sites={sites}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || sites.length}
        onPageChange={setCurrentPage}
        itemLabel="sites"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingSite ? '✏️ Edit Site' : '📍 Create Site'}
        >
          <SiteForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingSite
                ? {
                    code: editingSite.site_code || '',
                    name: editingSite.site_name,
                    description: editingSite.site_description || '',
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
export default SitePage;
