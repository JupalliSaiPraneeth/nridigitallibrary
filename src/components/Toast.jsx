import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function Toast() {
  const { toast } = useLibrary();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon success" />;
      case 'warning':
      case 'danger':
      case 'error':
        return <AlertCircle size={18} className="toast-icon warning" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-notification toast-${toast.type || 'info'}`}>
      {getIcon()}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export default Toast;
