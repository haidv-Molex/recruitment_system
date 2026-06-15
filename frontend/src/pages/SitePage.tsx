import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { searchSitesApi, createSiteApi, deleteSiteApi, updateSiteApi } from '../services/siteApi';
import SiteForm from '../components/site/SiteForm';
import Button from '../components/common/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ExcelTable, { ExcelColumn } from '../components/ui/ExcelTable';
import { useHeader } from '../contexts/HeaderContext';

export const SitePage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadSites = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const result = await searchSitesApi({
        page,
        limit,
        search,
      });
      setSites(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites(1, pageSize, searchQuery);
  }, []);

  const handlePageChange = (page: number) => {
    loadSites(page, pageSize, searchQuery);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadSites(1, newSize, searchQuery);
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
        loadSites(currentPage, pageSize, searchQuery);
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
        loadSites(currentPage, pageSize, searchQuery);
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
      loadSites(currentPage, pageSize, searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

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

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'site_code',
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
        key: 'site_name',
        label: 'Site Name',
        width: 250,
        disableFilter: true,
      },
      {
        key: 'site_description',
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
    return sites.map((s) => ({
      id: s.site_id,
      site_id: s.site_id,
      site_code: s.site_code,
      site_name: s.site_name,
      site_description: s.site_description,
    }));
  }, [sites]);

  const handleExcelSearch = (_colFilters: Record<string, string>, globalSearch: string) => {
    setSearchQuery(globalSearch);
    loadSites(1, pageSize, globalSearch);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="Site Records"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No sites found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="sites"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
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
