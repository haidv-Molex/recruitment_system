import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';

export interface ProfileFormProps {
  user: any;
  onSubmit: (data: { username: string; description: string }) => void;
  message: { text: string; type: string };
  isLoading: boolean;
}

export default function ProfileForm({ user, onSubmit, message, isLoading }: ProfileFormProps) {
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.user_name || '');
      setDescription(user.user_description || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message.text && (
        <div
          className={`text-xs px-3.5 py-2 rounded-lg border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Readonly Account Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Account ID
          </span>
          <span className="block text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 border border-slate-100 rounded-lg">
            {user?.user_account || '—'}
          </span>
        </div>
        <div className="space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Role
          </span>
          <span className="block text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 border border-slate-100 rounded-lg capitalize">
            {user?.user_role || '—'}
          </span>
        </div>
      </div>

      <InputField
        label="Display Name"
        type="text"
        placeholder="Enter display name..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        required
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Description / Bio
        </label>
        <textarea
          placeholder="Enter a short bio or description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
        />
      </div>

      <div className="border-t border-slate-100 pt-4 mt-6">
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          Save Profile
        </Button>
      </div>
    </form>
  );
}
