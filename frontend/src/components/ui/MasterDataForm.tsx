import React, { useState, useEffect } from 'react';
import InputField from '@/components/common/InputField';
import Button from '@/components/common/Button';

export interface MasterDataFormData {
  code: string;
  name: string;
  description: string;
}

export interface MasterDataFormProps {
  /** Tên thực thể, ví dụ: "Department", "Site", "Level" */
  entityLabel: string;
  /** Label tuỳ chỉnh cho trường code, mặc định: `${entityLabel} Code` */
  codeLabel?: string;
  /** Placeholder tuỳ chỉnh cho trường code */
  codePlaceholder?: string;
  onSubmit: (data: MasterDataFormData) => void;
  onCancel: () => void;
  initialData?: MasterDataFormData;
  isLoading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

/**
 * Form dùng chung cho entity có 3 trường: code + name + description.
 * Dùng cho: Department, Site, Level.
 */
export default function MasterDataForm({
  entityLabel,
  codeLabel,
  codePlaceholder,
  onSubmit,
  onCancel,
  initialData,
  isLoading,
  error,
  children,
}: MasterDataFormProps) {
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

  const resolvedCodeLabel = codeLabel ?? `${entityLabel} Code`;
  const resolvedCodePlaceholder = codePlaceholder ?? `Enter ${entityLabel.toLowerCase()} code...`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <InputField
        label={resolvedCodeLabel}
        type="text"
        placeholder={resolvedCodePlaceholder}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={isLoading}
        required
        autoFocus
      />

      <InputField
        label={`${entityLabel} Name`}
        type="text"
        placeholder={`Enter ${entityLabel.toLowerCase()} name...`}
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
          placeholder={`Enter ${entityLabel.toLowerCase()} description (optional)...`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={4}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
        />
      </div>

      {children}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : `Create ${entityLabel}`}
        </Button>
      </div>
    </form>
  );
}
