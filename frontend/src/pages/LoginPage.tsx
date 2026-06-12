import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/login/LoginForm';

export const LoginPage = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!account.trim() || !password.trim()) {
      setError('Please enter both account and password.');
      return;
    }

    setLoading(true);

    const result = await login(account.trim(), password);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-[420px] transition-all">
        {/* Logo Icon */}
        <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-600/20 mx-auto mb-5">
          RH
        </div>
        
        <h1 className="text-center text-2xl font-bold text-slate-800 tracking-tight">
          RecruitHub Portal
        </h1>
        <p className="text-center text-sm text-slate-500 mt-1 mb-8">
          Sign in to access the tracking system
        </p>

        <LoginForm
          account={account}
          setAccount={setAccount}
          password={password}
          setPassword={setPassword}
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  );
};
