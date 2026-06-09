import { useState, useEffect } from "react";

export default function BookingModal({ empId, slot, onClose, onConfirm, inProgress }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!empId) return null;

  const submit = () => {
    onConfirm({
      phone: phone.trim(),
      email: email.trim(),
      customer: customer.trim(),
      additionalNotes: additionalNotes.trim()
    });
  };

  return (
    <div className="overlay" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: "100%", maxWidth: "500px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="modal-head" style={{ borderBottom: "1px solid #e5e7eb", padding: "20px 24px", background: "#f9fafb", borderRadius: "12px 12px 0 0" }}>
          <div>
            <span className="modal-title" style={{ fontSize: "1.1rem", fontWeight: "600", display: "block" }}>New Booking</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Agent ID: <strong>{empId}</strong> &nbsp;•&nbsp; Slot: <strong>{slot}</strong>
            </span>
          </div>
          <button className="modal-close" onClick={onClose} style={{ fontSize: "1.5rem" }}>&times;</button>
        </div>

        <div className="modal-section" style={{ padding: "24px", overflowY: "auto", flex: 1 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="flabel" style={{ fontWeight: 500, color: "#374151" }}>Customer Name *</label>
              <input
                className="ctrl"
                placeholder="John Doe"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="flabel" style={{ fontWeight: 500, color: "#374151" }}>Phone Number *</label>
              <input
                className="ctrl"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: "16px" }}>
            <label className="flabel" style={{ fontWeight: 500, color: "#374151" }}>Email Address *</label>
            <input
              className="ctrl"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "24px" }}>
            <label className="flabel" style={{ fontWeight: 500, color: "#374151" }}>Additional Notes</label>
            <textarea
              className="ctrl"
              placeholder="Any special requests or context for the agent..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", resize: "vertical" }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid #e5e7eb", background: "white", marginTop: "8px" }}>
            <button
              className="btn"
              onClick={onClose}
              disabled={inProgress}
              style={{ background: "white", border: "1px solid #d1d5db", padding: "8px 20px", borderRadius: "6px", color: "#374151", fontWeight: 500, fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={inProgress}
              style={{ padding: "8px 24px", borderRadius: "6px" }}
            >
              {inProgress ? <><span className="spin" style={{ marginRight: 8 }}/> Saving...</> : 'Confirm Booking'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}