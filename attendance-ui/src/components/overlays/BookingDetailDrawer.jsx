import { useEffect } from "react";
import { formatTime, formatDate } from "../../utils/helpers"; // Removed parseNotes

export default function BookingDetailDrawer({ booking, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!booking) return null;

  const hasCustomerInfo = booking.customerName || booking.customerPhone || booking.customerEmail;

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

          {hasCustomerInfo && (
            <div className="bdetail-section">
              <p className="bdetail-heading">Customer Info</p>
              <div className="bdetail-notes">
                {booking.customerName && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Name</span>
                    <span className="bdetail-val">{booking.customerName}</span>
                  </div>
                )}
                {booking.customerPhone && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Phone</span>
                    <span className="bdetail-val">{booking.customerPhone}</span>
                  </div>
                )}
                {booking.customerEmail && (
                  <div className="bdetail-row">
                    <span className="bdetail-key">Email</span>
                    <span className="bdetail-val">{booking.customerEmail}</span>
                  </div>
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