import { useState, useEffect } from "react";

export default function BookingModal({ empId, slot, onClose, onConfirm, inProgress }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!empId) return null;

  const submit = () => onConfirm({ phone: phone.trim(), email: email.trim(), customer: customer.trim() });

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Booking Notes</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-section">
          <p className="section-label">Provide customer details (required)</p>
          <div className="field">
            <label className="flabel">Customer Name</label>
            <input className="ctrl" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div className="field">
            <label className="flabel">Phone Number</label>
            <input className="ctrl" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label className="flabel">Email</label>
            <input className="ctrl" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={onClose} disabled={inProgress}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={inProgress}>
              {inProgress ? <span className="spin" /> : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}