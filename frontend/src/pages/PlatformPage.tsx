import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchPlatformsApi, createPlatformApi, deletePlatformApi, updatePlatformApi } from '../services/platformApi';
import PlatformTable from '../components/platform/PlatformTable';
import PlatformForm from '../components/platform/PlatformForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

const ITEMS_PER_PAGE = 10;

export const PlatformPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadPlatforms = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchPlatformsApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setPlatforms(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load platforms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPlatforms(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadPlatforms(1, '');
  };

  const openCreateForm = () => {
    setEditingPlatform(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (platform: any) => {
    setEditingPlatform(platform);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlatform(null);
    setFormError('');
  };

  const handleSubmit = async (data: { name: string; description: string }) => {
    setFormError('');

    if (!data.name.trim()) {
      setFormError('Platform name is required.');
      return;
    }

    setSaving(true);

    if (editingPlatform) {
      try {
        await updatePlatformApi(
          editingPlatform.platform_id,
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Platform updated successfully.');
        closeForm();
        loadPlatforms(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createPlatformApi(
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Platform created successfully.');
        closeForm();
        loadPlatforms(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (platform: any) => {
    if (!confirm(`Are you sure you want to delete "${platform.platform_name}"?`)) {
      return;
    }

    try {
      await deletePlatformApi(platform.platform_id);
      toast.success('Platform deleted.');
      loadPlatforms(currentPage, searchQuery);
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
            🌎 Kênh tuyển dụng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage sourcing channels and recruitment platforms.
          </p>
        </div>
        <Button onClick={openCreateForm} icon={<Plus size={16} />}>
          Add Platform
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Platforms"
            placeholder="Search by channel name..."
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
      <PlatformTable
        platforms={platforms}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || platforms.length}
        onPageChange={setCurrentPage}
        itemLabel="platforms"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingPlatform ? '✏️ Edit Platform' : '🌎 Create Platform'}
        >
          <PlatformForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingPlatform
                ? {
                    name: editingPlatform.platform_name,
                    description: editingPlatform.platform_description || '',
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
export default PlatformPage;
