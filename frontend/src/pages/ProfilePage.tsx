import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import { useHeader } from '../contexts/HeaderContext';
import Button from '../components/common/Button';
import { LogOut, Mail, CheckCircle2 } from 'lucide-react';
import { getOutlookSessionApi, logoutOutlookApi, type OutlookSession } from '../services/emailApi';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth() as any;

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [outlookSession, setOutlookSession] = useState<OutlookSession | null>(null);

  useEffect(() => {
    getOutlookSessionApi().then(setOutlookSession);
  }, []);

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

  const handleOutlookDisconnect = async () => {
    await logoutOutlookApi();
    setOutlookSession(null);
  };

  const headerActions = useMemo(() => (
    <Button
      onClick={logout}
      variant="danger"
      icon={<LogOut size={16} />}
    >
      Logout
    </Button>
  ), [logout]);

  useHeader({
    title: '👤 User Profile & Settings',
    subTitle: 'Customize your display name and update your credentials.',
    actions: headerActions,
  }, [headerActions]);

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

        {/* Outlook Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6 md:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Mail size={20} className="text-emerald-600" /> Outlook Integration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This email is used as the sender account for email features.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {outlookSession ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Mail size={16} className="text-slate-400" />}
                <span>{outlookSession?.email || 'No Outlook account connected'}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {outlookSession ? 'Outlook login is active for this browser session.' : 'Login with Outlook from Admin Panel or Email tab to enable sending mail.'}
              </p>
            </div>

            {outlookSession && (
              <Button variant="secondary" onClick={handleOutlookDisconnect} className="shrink-0">
                Disconnect Outlook
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
