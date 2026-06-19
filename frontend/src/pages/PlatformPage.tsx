import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import { searchPlatformsApi, createPlatformApi, deletePlatformApi, updatePlatformApi } from '@/services/platformApi';
import MasterDataForm from '@/components/ui/MasterDataForm';
import Button from '@/components/common/Button';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ExcelTable, { ExcelColumn } from '@/components/ui/ExcelTable';
import { useHeader } from '@/contexts/HeaderContext';
import { useConfirm } from '@/components/ui/ConfirmModal';


export const PlatformPage = () => {
  const confirm = useConfirm();
  const { toasts, removeToast, toast } = useToast();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadPlatforms = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchPlatformsApi({
        page,
        limit,
        search,
      });
      setPlatforms(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load platforms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms(1, pageSize, searchQuery);
  }, []);

  const handlePageChange = (page: number) => {
    loadPlatforms(page, pageSize, searchQuery);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadPlatforms(1, newSize, searchQuery);
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

  const handleSubmit = async (data: { code: string; name: string; description: string }) => {
    setFormError('');

    if (!data.code.trim()) {
      setFormError('Platform code is required.');
      return;
    }
    if (!data.name.trim()) {
      setFormError('Platform name is required.');
      return;
    }

    setSaving(true);

    if (editingPlatform) {
      try {
        await updatePlatformApi(
          editingPlatform.platform_id,
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Platform updated successfully.');
        closeForm();
        loadPlatforms(currentPage, pageSize, searchQuery);
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createPlatformApi(
          data.code.trim(),
          data.name.trim(),
          data.description.trim()
        );
        toast.success('Platform created successfully.');
        closeForm();
        loadPlatforms(currentPage, pageSize, searchQuery);
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
      await deletePlatformApi(idOrIds);
      const isArray = Array.isArray(idOrIds);
      const count = isArray ? idOrIds.length : 1;
      toast.success(count === 1 ? 'Platform deleted.' : `Successfully deleted ${count} platforms.`);
      const newTotal = totalItems - count;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      loadPlatforms(targetPage, pageSize, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Platform
    </Button>
  ), []);

  useHeader({
    title: '🌎 Kênh tuyển dụng',
    subTitle: 'Manage sourcing channels and recruitment platforms.',
    actions: headerActions,
  }, [headerActions]);

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'platform_code',
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
        key: 'platform_name',
        label: 'Platform Name',
        width: 220,
        disableFilter: true,
      },
      {
        key: 'platform_description',
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
        handleDelete(row.platform_id, `Bạn có chắc chắn muốn xóa 1 kênh tuyển dụng không?`);
      },
      onBulkClick: (selectedRows: any[]) => {
        handleDelete(
          selectedRows.map((r) => r.platform_id),
          `Bạn có chắc chắn muốn xóa ${selectedRows.length} kênh tuyển dụng đã chọn không?`
        );
      },
    },
  ];

  // Map rows for ExcelTable
  const tableRows = useMemo(() => {
    return platforms.map((p) => ({
      id: p.platform_id,
      platform_id: p.platform_id,
      platform_code: p.platform_code,
      platform_name: p.platform_name,
      platform_description: p.platform_description,
    }));
  }, [platforms]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    loadPlatforms(1, pageSize, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Platform Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No platforms found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="platforms"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal Form */}
      {showForm && (
        <Modal
          isOpen={true}
          onClose={closeForm}
          title={editingPlatform ? '✏️ Edit Platform' : '🌎 Create Platform'}
        >
          <MasterDataForm
            entityLabel="Platform"
            codeLabel="Platform Code"
            codePlaceholder="e.g. LINKEDIN, JOBSTREET..."
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={
              editingPlatform
                ? {
                    code: editingPlatform.platform_code || '',
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
