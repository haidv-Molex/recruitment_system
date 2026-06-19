import React, { useState, useEffect } from 'react';
import { useItem } from '@/config/zustandStore';
import { Plus, X } from 'lucide-react';
import type { noteOutputModel } from '@/types/noteModel';

export type NoteItem = {
  note_id: number | null;
  text: string;
  create_at?: string | Date;
  user?: {
    user_id: number;
    user_name: string;
  };
  isNew?: boolean;
  tempId?: string;
};

interface NotesManagerProps {
  existingNotes: noteOutputModel[];
  onChange: (notesPayload: { note_id: number | null; text: string }[]) => void;
  disabled?: boolean;
}

export default function NotesManager({ existingNotes, onChange, disabled }: NotesManagerProps) {
  const currentUserId = useItem('userId');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNotes, setNewNotes] = useState<NoteItem[]>([]);

  // Initialize from props
  useEffect(() => {
    if (Array.isArray(existingNotes)) {
      setNotes(existingNotes.map(n => ({ ...n })));
    } else {
      setNotes([]);
    }
  }, [existingNotes]);

  // Report all changes back to parent
  const reportChanges = (updatedNotes: NoteItem[], updatedNewNotes: NoteItem[]) => {
    const payload: { note_id: number | null; text: string }[] = [];

    // Check modified existing notes
    updatedNotes.forEach((note) => {
      const original = (existingNotes || []).find((n) => n.note_id === note.note_id);
      if (original && original.text !== note.text) {
        payload.push({
          note_id: note.note_id,
          text: note.text.trim(),
        });
      }
    });

    // Check new notes
    updatedNewNotes.forEach((note) => {
      if (note.text.trim()) {
        payload.push({
          note_id: null,
          text: note.text.trim(),
        });
      }
    });

    onChange(payload);
  };

  const handleExistingNoteChange = (noteId: number, text: string) => {
    const updated = notes.map((n) => (n.note_id === noteId ? { ...n, text } : n));
    setNotes(updated);
    reportChanges(updated, newNotes);
  };

  const handleAddNewNoteField = () => {
    const tempId = Math.random().toString(36).substring(2, 9);
    const updated = [...newNotes, { note_id: null, text: '', isNew: true, tempId }];
    setNewNotes(updated);
    reportChanges(notes, updated);
  };

  const handleNewNoteChange = (tempId: string, text: string) => {
    const updated = newNotes.map((n) => (n.tempId === tempId ? { ...n, text } : n));
    setNewNotes(updated);
    reportChanges(notes, updated);
  };

  const handleRemoveNewNoteField = (tempId: string) => {
    const updated = newNotes.filter((n) => n.tempId !== tempId);
    setNewNotes(updated);
    reportChanges(notes, updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">Notes / Ghi chú</label>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddNewNoteField}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Plus size={14} />
            <span>Thêm ghi chú</span>
          </button>
        )}
      </div>

      {/* List container */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {notes.length === 0 && newNotes.length === 0 && (
          <p className="text-xs text-slate-400 italic">Chưa có ghi chú nào.</p>
        )}

        {/* Existing notes */}
        {notes.map((note) => {
          const isOwner = note.user?.user_id === currentUserId;
          const timeStr = note.create_at ? new Date(note.create_at).toLocaleString('vi-VN') : '';
          const authorName = note.user?.user_name || 'System';

          return (
            <div key={note.note_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{authorName}</span>
                <span>{timeStr}</span>
              </div>
              {isOwner && !disabled ? (
                <textarea
                  value={note.text}
                  onChange={(e) => handleExistingNoteChange(note.note_id!, e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-y"
                />
              ) : (
                <p className="text-xs text-slate-700 whitespace-pre-wrap pl-1 leading-relaxed">{note.text}</p>
              )}
            </div>
          );
        })}

        {/* New notes */}
        {newNotes.map((note) => (
          <div key={note.tempId} className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
              <span>Ghi chú mới của bạn</span>
              <button
                type="button"
                onClick={() => handleRemoveNewNoteField(note.tempId!)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Xóa ô nhập ghi chú"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => handleNewNoteChange(note.tempId!, e.target.value)}
              placeholder="Nhập nội dung ghi chú ở đây..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-y"
              autoFocus
            />
          </div>
        ))}
      </div>
    </div>
  );
}
