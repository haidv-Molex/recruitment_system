import React from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';

export interface LoginFormProps {
  account: string;
  setAccount: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
  loading?: boolean;
}

export default function LoginForm({
  account,
  setAccount,
  password,
  setPassword,
  onSubmit,
  error,
  loading,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <InputField
        label="Account"
        type="text"
        placeholder="Enter your account"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        disabled={loading}
        autoFocus
        required
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />

      <Button type="submit" isLoading={loading} className="w-full mt-2 py-2.5">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
