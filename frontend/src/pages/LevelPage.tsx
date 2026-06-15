import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import { searchLevelsApi, createLevelApi, deleteLevelApi, updateLevelApi } from '@/services/levelApi';
import MasterDataForm from '@/components/ui/MasterDataForm';
import Button from '@/components/common/Button';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ExcelTable, { ExcelColumn } from '@/components/ui/ExcelTable';
import { useHeader } from '@/contexts/HeaderContext';
import { useConfirm } from '@/components/ui/ConfirmModal';

export const LevelPage = () => {
  const confirm = useConfirm();
  const { toasts, removeToast, toast } = useToast();
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadLevels = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchLevelsApi({
        page,
        limit,
        search,
      });
      setLevels(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load levels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels(1, pageSize, searchQuery);
  }, []);

  const handlePageChange = (page: number) => {
    loadLevels(page, pageSize, searchQuery);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadLevels(1, newSize, searchQuery);
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
        loadLevels(currentPage, pageSize, searchQuery);
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
        loadLevels(currentPage, pageSize, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (idOrIds: number | number[], message: string) => {
    const isConfirmed = await confirm(message);
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteLevelApi(idOrIds);
      const isArray = Array.isArray(idOrIds);
      const count = isArray ? idOrIds.length : 1;
      toast.success(count === 1 ? 'Level deleted.' : `Successfully deleted ${count} levels.`);
      const newTotal = totalItems - count;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      loadLevels(targetPage, pageSize, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

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

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'level_code',
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
        key: 'level_name',
        label: 'Level Name',
        width: 250,
        disableFilter: true,
      },
      {
        key: 'level_description',
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
        handleDelete(row.level_id, `Bạn có chắc chắn muốn xóa 1 level không?`);
      },
      onBulkClick: (selectedRows: any[]) => {
        handleDelete(
          selectedRows.map((r) => r.level_id),
          `Bạn có chắc chắn muốn xóa ${selectedRows.length} level đã chọn không?`
        );
      },
    },
  ];

  // Map rows for ExcelTable
  const tableRows = useMemo(() => {
    return levels.map((l) => ({
      id: l.level_id,
      level_id: l.level_id,
      level_code: l.level_code,
      level_name: l.level_name,
      level_description: l.level_description,
    }));
  }, [levels]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    loadLevels(1, pageSize, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Level Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No levels found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="levels"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingLevel ? '✏️ Edit Level' : '🏷️ Create Level'}
        >
          <MasterDataForm
            entityLabel="Level"
            codeLabel="Level Code"
            codePlaceholder="e.g. L1, L2, L3, Senior, Principal..."
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
