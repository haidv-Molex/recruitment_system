import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import { searchSegmentsApi, createSegmentApi, deleteSegmentApi, updateSegmentApi } from '@/services/segmentApi';
import MasterDataForm from '@/components/ui/MasterDataForm';
import Button from '@/components/common/Button';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ExcelTable, { ExcelColumn } from '@/components/ui/ExcelTable';
import { useHeader } from '@/contexts/HeaderContext';

export const SegmentPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadSegments = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchSegmentsApi({
        page,
        limit,
        search,
      });
      setSegments(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load segments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSegments(1, pageSize, searchQuery);
  }, []);

  const handlePageChange = (page: number) => {
    loadSegments(page, pageSize, searchQuery);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadSegments(1, newSize, searchQuery);
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
        loadSegments(currentPage, pageSize, searchQuery);
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
        loadSegments(currentPage, pageSize, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (idOrIds: number | number[], message: string) => {
    if (!confirm(message)) {
      return;
    }

    try {
      await deleteSegmentApi(idOrIds);
      const isArray = Array.isArray(idOrIds);
      const count = isArray ? idOrIds.length : 1;
      toast.success(count === 1 ? 'Segment deleted.' : `Successfully deleted ${count} segments.`);
      const newTotal = totalItems - count;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      loadSegments(targetPage, pageSize, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

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

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'segment_code',
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
        key: 'segment_name',
        label: 'Segment Name',
        width: 250,
        disableFilter: true,
      },
      {
        key: 'segment_description',
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
        handleDelete(row.segment_id, `Bạn có chắc chắn muốn xóa phân khúc "${row.segment_name}" không?`);
      },
      onBulkClick: (selectedRows: any[]) => {
        handleDelete(
          selectedRows.map((r) => r.segment_id),
          `Bạn có chắc chắn muốn xóa ${selectedRows.length} phân khúc đã chọn không?`
        );
      },
    },
  ];

  // Map rows for ExcelTable
  const tableRows = useMemo(() => {
    return segments.map((s) => ({
      id: s.segment_id,
      segment_id: s.segment_id,
      segment_code: s.segment_code,
      segment_name: s.segment_name,
      segment_description: s.segment_description,
    }));
  }, [segments]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    loadSegments(1, pageSize, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Segment Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No segments found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="segments"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingSegment ? '✏️ Edit Segment' : '📊 Create Segment'}
        >
          <MasterDataForm
            entityLabel="Segment"
            codeLabel="Segment Code"
            codePlaceholder="e.g. S1, S2, Seg-A..."
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
