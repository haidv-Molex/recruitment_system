import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import InputField from '@/components/common/InputField';
import Button from '@/components/common/Button';

const emptyUser = {
  code: '',
  username: '',
  account: '',
  password: '',
  description: '',
};

export interface UserFormProps {
  user?: any;
  accountType?: 'user' | 'hr';
  onSubmit: (data: typeof emptyUser) => void;
  onClose: () => void;
  saving: boolean;
}

export default function UserForm({ user, accountType = 'hr', onSubmit, onClose, saving }: UserFormProps) {
  const [formData, setFormData] = useState(emptyUser);
  const [error, setError] = useState('');

  const isEditing = !!user;
  const isCreatingHr = !isEditing && accountType === 'hr';

  useEffect(() => {
    if (user) {
      setFormData({
        code: user.user_code || '',
        username: user.user_name || '',
        account: user.user_account || user.user_name || '',
        password: '',
        description: user.user_description || '',
      });
    } else {
      setFormData(emptyUser);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('Display Name is required.');
      return;
    }

    if (isCreatingHr) {
      if (!formData.account.trim()) {
        setError('Account is required.');
        return;
      }

      if (/\s/.test(formData.account)) {
        setError('Account cannot contain spaces.');
        return;
      }

      if (!formData.password.trim()) {
        setError('Password is required for new accounts.');
        return;
      }

      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Account' : isCreatingHr ? 'Create New HR Account' : 'Create New User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
              ? 'Save Changes'
              : isCreatingHr
              ? 'Create HR Account'
              : 'Create User'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <InputField
          label="Code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="e.g. U001"
          disabled={saving}
          hint="Optional employee or internal user code."
        />

        <InputField
          label="Display Name *"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="e.g. Nguyễn Văn A"
          disabled={saving}
          hint="This name will be displayed throughout the system."
        />

        {isCreatingHr && (
          <>
            <InputField
              label="Account (Login ID) *"
              name="account"
              value={formData.account}
              onChange={handleChange}
              placeholder="e.g. hr02"
              disabled={saving}
              hint="Used to sign in. No spaces allowed."
            />

            <InputField
              label="Password *"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              disabled={saving}
            />
          </>
        )}

        <InputField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g. Recruiter phụ trách tuyển dụng nhà máy MXV"
          disabled={saving}
        />
      </form>
    </Modal>
  );
}
