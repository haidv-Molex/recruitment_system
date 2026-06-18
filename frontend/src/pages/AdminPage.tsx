import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import { fetchUsersApi, createHRApi, deleteUserApi, fetchRolesApi, updateUserApi } from '@/services/userApi';
import Button from '@/components/common/Button';
import Pagination from '@/components/ui/Pagination';
import ExcelTable, { ExcelColumn } from '@/components/ui/ExcelTable';
import { useHeader } from '@/contexts/HeaderContext';
import { useAuth } from '@/contexts/AuthContext';
import UserForm from '@/components/common/UserForm';
import { useConfirm } from '@/components/ui/ConfirmModal';


const roleColors: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  hr: 'bg-blue-50 text-blue-700 border-blue-200',
  user: 'bg-slate-50 text-slate-600 border-slate-200',
  banned: 'bg-orange-50 text-orange-700 border-orange-200',
};

const getRoleIcon = (role: string) => {
  if (role === 'admin') return <Shield size={12} className="text-red-500" />;
  return <User size={12} className="text-blue-500" />;
};

export const AdminPage = () => {
  const confirm = useConfirm();
  const { user: currentUser } = useAuth();
  const { toasts, removeToast, toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadUsers = useCallback(async (page: number, limit: number, search: string, role: string) => {
    setLoading(true);
    try {
      const result = await fetchUsersApi({ page, limit, search, role });
      setUsers(result.data || []);
      setTotalItems(result.pagination?.total_items || result.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(1, pageSize, searchQuery, selectedRole);
    const loadRoles = async () => {
      try {
        const rolesList = await fetchRolesApi();
        setRoles(rolesList);
      } catch (err: any) {
        console.error('Failed to load roles:', err);
      }
    };
    loadRoles();
  }, []);

  const handlePageChange = (page: number) => {
    loadUsers(page, pageSize, searchQuery, selectedRole);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadUsers(1, newSize, searchQuery, selectedRole);
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const openEditForm = (u: any) => {
    setEditingUser(u);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleCreateOrUpdateUser = async (formData: any) => {
    setSaving(true);
    try {
      if (editingUser) {
        await updateUserApi(editingUser.user_id, {
          username: formData.username.trim(),
          description: formData.description || undefined,
        });
        toast.success(`Account updated successfully.`);
        closeForm();
        loadUsers(currentPage, pageSize, searchQuery, selectedRole);
      } else {
        await createHRApi({
          username: formData.username.trim(),
          account: formData.account.trim(),
          password: formData.password,
          description: formData.description || undefined,
        });
        toast.success(`Account "${formData.account}" created successfully.`);
        closeForm();
        loadUsers(currentPage, pageSize, searchQuery, selectedRole);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (idOrIds: number | number[], message: string) => {
    const isConfirmed = await confirm(message);
    if (!isConfirmed) return;

    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    // Prevent deleting own account
    if (ids.some((id) => currentUser && (currentUser as any).user_id === id)) {
      toast.error('You cannot delete your own account.');
      return;
    }

    try {
      for (const id of ids) {
        await deleteUserApi(id);
      }
      const count = ids.length;
      toast.success(count === 1 ? 'Account deleted.' : `Successfully deleted ${count} accounts.`);
      const newTotal = totalItems - count;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      loadUsers(targetPage, pageSize, searchQuery, selectedRole);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const headerActions = useMemo(() => (
    <Button onClick={openCreateForm} icon={<Plus size={16} />}>
      Add Account
    </Button>
  ), []);

  useHeader({
    title: '👤 Account Management',
    subTitle: 'Manage HR user accounts. Only administrators can access this page.',
    actions: headerActions,
  }, [headerActions]);

  const columns = useMemo<ExcelColumn<any>[]>(
    () => [
      {
        key: 'user_name',
        label: 'Name',
        width: 220,
        disableFilter: true,
        render: (row: any, val: any) => {
          const isSelf = currentUser && row.user_id === (currentUser as any).user_id;
          return (
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              {val || '—'}
              {isSelf && (
                <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  You
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'user_description',
        label: 'Description',
        width: 250,
        disableFilter: true,
        render: (_row: any, val: any) => val || '—',
      },
      {
        key: 'user_role',
        label: 'Role',
        width: 130,
        disableFilter: false,
        filterOptions: roles,
        render: (_row: any, val: any) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              roleColors[val] || 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {getRoleIcon(val)}
            <span className="capitalize">{val || '—'}</span>
          </span>
        ),
      },
    ],
    [currentUser, roles]
  );

  const tableActions = [
    {
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: (row: any) => openEditForm(row),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (row: any) => {
        handleDeleteUser(
          row.user_id,
          `Bạn có chắc chắn muốn xóa 1 tài khoản không?`
        );
      },
      onBulkClick: (selectedRows: any[]) => {
        handleDeleteUser(
          selectedRows.map((r) => r.user_id),
          `Bạn có chắc chắn muốn xóa ${selectedRows.length} tài khoản đã chọn không?`
        );
      },
    },
  ];

  const tableRows = useMemo(() => {
    return users.map((u) => ({
      id: u.user_id,
      user_id: u.user_id,
      user_name: u.user_name,
      user_description: u.user_description,
      user_role: u.user_role,
    }));
  }, [users]);

  const handleExcelSearch = (colFilters: Record<string, string>, globalSearch: string) => {
    const roleFilter = colFilters.user_role || '';
    setSearchQuery(globalSearch);
    setSelectedRole(roleFilter);
    loadUsers(1, pageSize, globalSearch, roleFilter);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Table */}
      <ExcelTable
        title="User Accounts"
        rows={tableRows}
        columns={columns}
        actions={tableActions}
        isLoading={loading}
        onSearch={handleExcelSearch}
        emptyMessage="No accounts found"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        itemLabel="accounts"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal Form */}
      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleCreateOrUpdateUser}
          onClose={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
};

export default AdminPage;

