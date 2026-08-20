import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
    <div className="flex gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
    <div className="flex justify-end gap-2 mt-6">
      <button className="btn-secondary" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button className="btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? 'Deleting...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmModal;
