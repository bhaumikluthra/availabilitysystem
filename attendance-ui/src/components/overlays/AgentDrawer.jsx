import { useEffect } from "react";

export default function AgentDrawer({ slot, agents, loading, onClose, onBook, bookingInProgress }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!slot) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Available agents">
        <div className="drawer-head">
          <div>
            <p className="drawer-label">Available Agents</p>
            <p className="drawer-slot">{slot}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div className="drawer-loading">
              <span className="spin spin-dark" />
              <span>Loading agents…</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="drawer-empty">No agents available in this slot.</div>
          ) : (
            <>
              <p className="drawer-count">
                <strong>{agents.length}</strong> agent{agents.length !== 1 ? "s" : ""} available
              </p>
              <div className="agent-list">
                {agents.map((a) => (
                  <div key={a.empId} className="agent-card">
                    <div className="agent-avatar">
                      {(a.email || a.empId || "?")[0].toUpperCase()}
                    </div>
                    <div className="agent-info">
                      <span className="agent-id">{a.empId}</span>
                      <span className="agent-email">{a.email || "—"}</span>
                    </div>
                    <div className="agent-tags">
                      {a.groupName && <span className="tag">{a.groupName}</span>}
                      {a.coachName && <span className="tag tag-coach">{a.coachName}</span>}
                      {a.shiftTime && <span className="tag tag-shift">{a.shiftTime}</span>}
                    </div>
                    <div className="agent-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); onBook && onBook(a.empId); }}
                        disabled={bookingInProgress === a.empId}
                      >
                        {bookingInProgress === a.empId ? "Booking…" : "Book"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}