import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchLevelsApi, createLevelApi, deleteLevelApi, updateLevelApi } from '../services/levelApi';
import LevelTable from '../components/level/LevelTable';
import LevelForm from '../components/level/LevelForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { useHeader } from '../contexts/HeaderContext';

const ITEMS_PER_PAGE = 10;

export const LevelPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadLevels = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchLevelsApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setLevels(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load levels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLevels(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadLevels(1, '');
  };

  const openCreateForm = () => {
    setEditingLevel(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (lvl: any) => {
    setEditingLevel(lvl);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLevel(null);
    setFormError('');
  };

  const handleSubmit = async (data: { code: string; name: string; description: string }) => {
    setFormError('');

    if (!data.code.trim()) {
      setFormError('Level code is required.');
      return;
    }
    if (!data.name.trim()) {
      setFormError('Level name is required.');
      return;
    }

    setSaving(true);

    if (editingLevel) {
      try {
        await updateLevelApi(
          editingLevel.level_id,
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Level updated successfully.');
        closeForm();
        loadLevels(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createLevelApi(
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Level created successfully.');
        closeForm();
        loadLevels(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (lvl: any) => {
    if (!confirm(`Are you sure you want to delete "${lvl.level_name}"?`)) {
      return;
    }

    try {
      await deleteLevelApi(lvl.level_id);
      toast.success('Level deleted.');
      loadLevels(currentPage, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Level
    </Button>
  ), []);

  useHeader({
    title: '🏷️ Employee Level Management',
    subTitle: 'Manage corporate job levels and employee career levels.',
    actions: headerActions,
  }, [headerActions]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Levels"
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
      <LevelTable
        levels={levels}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || levels.length}
        onPageChange={setCurrentPage}
        itemLabel="levels"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingLevel ? '✏️ Edit Level' : '🏷️ Create Level'}
        >
          <LevelForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingLevel
                ? {
                    code: editingLevel.level_code || '',
                    name: editingLevel.level_name,
                    description: editingLevel.level_description || '',
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
export default LevelPage;
