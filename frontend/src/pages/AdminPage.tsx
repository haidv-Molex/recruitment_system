import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import UserForm from '../components/common/UserForm';
import ToastContainer from '../components/common/Toast';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { createHRApi, fetchUsersApi, deleteUserApi } from '../services/userApi';
import AdminStats from '../components/admin/AdminStats';
import AdminFilters from '../components/admin/AdminFilters';
import AdminTable from '../components/admin/AdminTable';
import { useHeader } from '../contexts/HeaderContext';

const ITEMS_PER_PAGE = 5;

export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { toasts, removeToast, toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    try {
      const response = await fetchUsersApi({ page: 1, limit: 100 });
      setUsers(response.data || []);
    } catch (err) {
      toast.error('Failed to load users.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (u.user_name || '').toLowerCase().includes(query) ||
          (u.user_account || '').toLowerCase().includes(query)
      );
    }

    if (filterRole) {
      result = result.filter((u) => u.user_role === filterRole);
    }

    return result;
  }, [users, searchQuery, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredUsers, totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleCreateOrUpdateUser = async (formData: any) => {
    setSaving(true);
    try {
      if (editingUser) {
        toast.error('Edit account API not fully implemented yet.');
      } else {
        await createHRApi({
          username: formData.username.trim(),
          account: formData.account.trim(),
          password: formData.password,
          description: formData.description || undefined,
        });
        toast.success(`Account "${formData.account}" created successfully.`);
        setShowForm(false);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (currentUser && (currentUser as any).user_id === userToDelete.user_id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete account "${userToDelete.user_name || userToDelete.user_account}"?`)) {
      return;
    }

    try {
      await deleteUserApi(userToDelete.user_id);
      toast.success(`Account "${userToDelete.user_name || userToDelete.user_account}" deleted.`);
      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete user failed.');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setCurrentPage(1);
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const openEditForm = (u: any) => {
    setEditingUser(u);
    setShowForm(true);
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.user_role === 'admin').length;
  const hrCount = users.filter((u) => u.user_role === 'hr' || u.user_role === 'recruiter').length;
  const viewerCount = users.filter((u) => u.user_role === 'viewer').length;

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

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Stats Cards */}
      <AdminStats total={totalUsers} admins={adminCount} hrs={hrCount} viewers={viewerCount} />

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <AdminFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          onClear={handleClearFilters}
        />
      </div>

      {/* Users Table */}
      <AdminTable
        users={paginatedUsers}
        currentUser={currentUser}
        onEdit={openEditForm}
        onDelete={handleDeleteUser}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        onPageChange={setCurrentPage}
        itemLabel="accounts"
      />

      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleCreateOrUpdateUser}
          onClose={() => setShowForm(false)}
          saving={saving}
        />
      )}
    </div>
  );
};
export default AdminPage;
