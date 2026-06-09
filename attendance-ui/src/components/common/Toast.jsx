import { useEffect } from "react";

export default function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} onClick={onClose} role="alert">
      <span>{msg}</span>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="toast-x" aria-label="Close">×</button>
    </div>
  );
}