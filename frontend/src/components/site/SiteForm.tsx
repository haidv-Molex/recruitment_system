import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';

export interface SiteFormProps {
  onSubmit: (data: { code: string; name: string; description: string }) => void;
  onCancel: () => void;
  initialData?: { code: string; name: string; description: string };
  isLoading?: boolean;
  error?: string;
}

export default function SiteForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
  error,
}: SiteFormProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description);
    } else {
      setCode('');
      setName('');
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ code, name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <InputField
        label="Site Code"
        type="text"
        placeholder="e.g. S1, S2, Site-A..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={isLoading}
        required
        autoFocus
      />

      <InputField
        label="Site Name"
        type="text"
        placeholder="Enter site name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        required
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Description
        </label>
        <textarea
          placeholder="Enter site description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={4}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Site'}
        </Button>
      </div>
    </form>
  );
}
