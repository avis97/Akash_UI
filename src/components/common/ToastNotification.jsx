import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './ToastNotification.css';

// Global toast state listener system
let toastListeners = [];
let toastIdCounter = 0;

export const showToast = (message, type = 'info', title = null, duration = 4000) => {
  const id = ++toastIdCounter;
  
  // Auto-determine title if not provided
  if (!title) {
    if (type === 'success') title = 'Success';
    else if (type === 'error') title = 'Error';
    else if (type === 'warning') title = 'Warning';
    else title = 'Notice';
  }

  const newToast = { id, message, type, title, duration };
  toastListeners.forEach(listener => listener(newToast));
  return id;
};

// Convenience helpers
export const toast = {
  success: (msg, title, duration) => showToast(msg, 'success', title, duration),
  error: (msg, title, duration) => showToast(msg, 'error', title, duration),
  warning: (msg, title, duration) => showToast(msg, 'warning', title, duration),
  info: (msg, title, duration) => showToast(msg, 'info', title, duration),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleAddToast = (newToast) => {
      setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts
    };

    toastListeners.push(handleAddToast);

    // Override native browser window.alert to automatically use our stylish Toast UI
    const originalAlert = window.alert;
    window.alert = (message) => {
      if (message === undefined || message === null) return;
      const strMsg = String(message);
      const lower = strMsg.toLowerCase();
      let type = 'info';
      if (lower.includes('success') || lower.includes('updated') || lower.includes('created') || lower.includes('sent') || lower.includes('identified')) {
        type = 'success';
      } else if (lower.includes('error') || lower.includes('fail') || lower.includes('blocked') || lower.includes('not allowed') || lower.includes('invalid') || lower.includes('unable')) {
        type = 'error';
      } else if (lower.includes('warn') || lower.includes('please') || lower.includes('already')) {
        type = 'warning';
      }
      showToast(strMsg, type);
    };

    return () => {
      toastListeners = toastListeners.filter(l => l !== handleAddToast);
      window.alert = originalAlert;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(item => (
        <ToastItem key={item.id} toast={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="toast-icon toast-icon-success" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon toast-icon-error" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon toast-icon-warning" size={20} />;
      case 'info':
      default:
        return <Info className="toast-icon toast-icon-info" size={20} />;
    }
  };

  return (
    <div className={`toast-item toast-${toast.type}`}>
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button type="button" className="toast-close-btn" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
      <div 
        className="toast-progress" 
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}
