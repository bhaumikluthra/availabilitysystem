// src/components/overlays/EditBookingModal.jsx
import { useState, useEffect } from "react";
import { parseNotes } from "../../utils/helpers";

export default function EditBookingModal({ booking, onClose, onSave, inProgress }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Pre-fill the form with the existing booking data when the modal opens
  useEffect(() => {
    if (booking && booking.notes) {
      const notes = parseNotes(booking.notes);
      setCustomer(notes["Customer"] || "");
      setPhone(notes["Phone"] || "");
      setEmail(notes["Email"] || "");
    }
  }, [booking]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!booking) return null;

  const submit = () => {
    onSave({
      customer: customer.trim(),
      phone: phone.trim(),
      email: email.trim()
    });
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Edit Booking #{booking.id}</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-section">
          <p className="section-label">Update customer details</p>
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
              {inProgress ? <span className="spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}