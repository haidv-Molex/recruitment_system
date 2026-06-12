import React from 'react';
import ConfirmModal from '../ui/ConfirmModal';

interface JobConfirmDeleteModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function JobConfirmDeleteModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: JobConfirmDeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Xóa công việc"
      message={message}
      confirmLabel="Xóa"
      cancelLabel="Hủy"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
