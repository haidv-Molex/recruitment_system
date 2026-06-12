import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import { useHeader } from '../contexts/HeaderContext';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profileMessage.text) {
      const timer = setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (passwordMessage.text) {
      const timer = setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  const handleProfileSubmit = async (data: { username: string; description: string }) => {
    if (!data.username.trim()) {
      setProfileMessage({ text: 'Display name is required.', type: 'error' });
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile(data.username.trim(), data.description.trim());

    if (result.success) {
      setProfileMessage({ text: result.message || 'Profile updated successfully.', type: 'success' });
    } else {
      setProfileMessage({ text: result.message || 'Update failed', type: 'error' });
    }
    setSavingProfile(false);
  };

  const handlePasswordSubmit = async (data: any) => {
    if (!data.oldPassword || !data.newPassword || !data.confirmPassword) {
      setPasswordMessage({ text: 'All password fields are required.', type: 'error' });
      return false;
    }

    if (data.newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return false;
    }

    if (data.newPassword !== data.confirmPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return false;
    }

    setSavingPassword(true);
    const result = await changePassword(data.oldPassword, data.newPassword);

    if (result.success) {
      setPasswordMessage({ text: result.message || 'Password changed successfully.', type: 'success' });
      setSavingPassword(false);
      return true;
    } else {
      setPasswordMessage({ text: result.message || 'Password update failed.', type: 'error' });
      setSavingPassword(false);
      return false;
    }
  };

  useHeader({
    title: '👤 User Profile & Settings',
    subTitle: 'Customize your display name and update your account credentials.',
  }, []);

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              📝 Profile Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal bio and details visible to other team members.
            </p>
          </div>
          <ProfileForm
            user={user}
            onSubmit={handleProfileSubmit}
            message={profileMessage}
            isLoading={savingProfile}
          />
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              🔒 Security & Password
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Change your password to ensure your account security.
            </p>
          </div>
          <PasswordChangeForm
            onSubmit={handlePasswordSubmit}
            message={passwordMessage}
            isLoading={savingPassword}
          />
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
