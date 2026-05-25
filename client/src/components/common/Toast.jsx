import './Toast.css';

import { useEffect } from 'react';

const Toast = ({
  open,
  message,
  variant = 'info',
  onClose,
  durationMs = 3500
}) => {

  useEffect(() => {
    if(!open) return;
    const id = setTimeout(() => {
      if(typeof onClose === 'function') onClose();
    },Math.max(800,Number(durationMs || 0)));
    return () => clearTimeout(id);
  },[open,durationMs,onClose]);

  if(!open) return null;

  return (
    <div className={`toast-root ${variant}`}>
      <div className="toast-dot" />
      <div className="toast-msg">{message}</div>
      <button
        type="button"
        className="toast-close"
        aria-label="Close"
        onClick={() => typeof onClose === 'function' && onClose()}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

