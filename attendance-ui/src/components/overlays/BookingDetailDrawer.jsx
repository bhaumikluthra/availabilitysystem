import { useEffect } from "react";
import { formatTime, formatDate, parseNotes } from "../../utils/helpers";

export default function BookingDetailDrawer({ booking, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!booking) return null;
  const notes = parseNotes(booking.notes);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Booking details">
        <div className="drawer-head">
          <div>
            <p className="drawer-label">Booking Details</p>
            <p className="drawer-slot">#{booking.id}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="drawer-body">
          <div className="bdetail-section">
            <p className="bdetail-heading">Slot</p>
            <p className="bdetail-value bdetail-slot">
              {formatTime(booking.slotStart)} → {formatTime(booking.slotEnd)}
            </p>
            <p className="bdetail-sub">{formatDate(booking.scheduleDate)}</p>
          </div>

          <div className="bdetail-section">
            <p className="bdetail-heading">Agent</p>
            <div className="agent-card" style={{ cursor: "default" }}>
              <div className="agent-avatar">
                {(booking.employeeName || booking.employeeId || "?")[0].toUpperCase()}
              </div>
              <div className="agent-info">
                <span className="agent-id">{booking.employeeId}</span>
                <span className="agent-email">{booking.employeeName || "—"}</span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="bdetail-section">
              <p className="bdetail-heading">Customer Info</p>
              <div className="bdetail-notes">
                {notes["Customer"] && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Name</span>
                    <span className="bdetail-val">{notes["Customer"]}</span>
                  </div>
                )}
                {notes["Phone"] && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Phone</span>
                    <span className="bdetail-val">{notes["Phone"]}</span>
                  </div>
                )}
                {notes["Email"] && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Email</span>
                    <span className="bdetail-val">{notes["Email"]}</span>
                  </div>
                )}
                {!notes["Customer"] && !notes["Phone"] && !notes["Email"] && (
                  <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{booking.notes}</p>
                )}
              </div>
            </div>
          )}

          <div className="bdetail-section">
            <p className="bdetail-heading">Created At</p>
            <p className="bdetail-value" style={{ fontSize: 14 }}>
              {booking.createdAt
                ? new Date(booking.createdAt).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}