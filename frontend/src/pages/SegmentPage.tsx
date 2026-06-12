import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchSegmentsApi, createSegmentApi, deleteSegmentApi, updateSegmentApi } from '../services/segmentApi';
import SegmentTable from '../components/segment/SegmentTable';
import SegmentForm from '../components/segment/SegmentForm';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { useHeader } from '../contexts/HeaderContext';

const ITEMS_PER_PAGE = 10;

export const SegmentPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadSegments = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchSegmentsApi({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });
      setSegments(result.data || []);
      setPagination(result.pagination || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load segments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSegments(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadSegments(1, searchQuery);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadSegments(1, '');
  };

  const openCreateForm = () => {
    setEditingSegment(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (seg: any) => {
    setEditingSegment(seg);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSegment(null);
    setFormError('');
  };

  const handleSubmit = async (data: { code: string; name: string; description: string }) => {
    setFormError('');

    if (!data.code.trim()) {
      setFormError('Segment code is required.');
      return;
    }
    if (!data.name.trim()) {
      setFormError('Segment name is required.');
      return;
    }

    setSaving(true);

    if (editingSegment) {
      try {
        await updateSegmentApi(
          editingSegment.segment_id,
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Segment updated successfully.');
        closeForm();
        loadSegments(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createSegmentApi(
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Segment created successfully.');
        closeForm();
        loadSegments(currentPage, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (seg: any) => {
    if (!confirm(`Are you sure you want to delete "${seg.segment_name}"?`)) {
      return;
    }

    try {
      await deleteSegmentApi(seg.segment_id);
      toast.success('Segment deleted.');
      loadSegments(currentPage, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Segment
    </Button>
  ), []);

  useHeader({
    title: '📊 Segment Management',
    subTitle: 'Manage organization segments and target divisions.',
    actions: headerActions,
  }, [headerActions]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputField
            label="Search Segments"
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
      <SegmentTable
        segments={segments}
        onEdit={openEditForm}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={pagination?.total_items || segments.length}
        onPageChange={setCurrentPage}
        itemLabel="segments"
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingSegment ? '✏️ Edit Segment' : '📊 Create Segment'}
        >
          <SegmentForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingSegment
                ? {
                    code: editingSegment.segment_code || '',
                    name: editingSegment.segment_name,
                    description: editingSegment.segment_description || '',
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
export default SegmentPage;
