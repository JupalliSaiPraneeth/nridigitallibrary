import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function ConfirmModal() {
  const { confirmState, closeConfirm } = useLibrary();

  if (!confirmState || !confirmState.isOpen) return null;

  const getIcon = () => {
    switch (confirmState.iconType) {
      case 'info':
        return <Info size={28} className="text-info" />;
      case 'success':
        return <CheckCircle2 size={28} className="text-success" />;
      case 'warning':
      case 'danger':
      default:
        return <AlertTriangle size={28} className="text-warning" />;
    }
  };

  return (
    <div className="modal-backdrop active confirm-backdrop" onClick={closeConfirm}>
      <div className="modal-container confirm-modal-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-icon-wrapper">
            {getIcon()}
          </div>
          <div className="confirm-text">
            <h3>{confirmState.title || 'Are you sure?'}</h3>
            <p>{confirmState.message}</p>
          </div>
        </div>

        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={closeConfirm}>
            {confirmState.cancelText || 'Cancel'}
          </button>
          <button className="btn btn-primary btn-gold" onClick={confirmState.onConfirm}>
            {confirmState.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
