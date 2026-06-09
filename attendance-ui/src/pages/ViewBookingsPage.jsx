import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { formatTime, formatDate, parseNotes } from "../utils/helpers";
import Toast from "../components/common/Toast";
import BookingDetailDrawer from "../components/overlays/BookingDetailDrawer";
import EmployeeProfileDrawer from "../components/overlays/EmployeeProfileDrawer";
import EditBookingModal from "../components/overlays/EditBookingModal";

export default function ViewBookingsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [profileEmpId, setProfileEmpId] = useState(null);

  // State for tracking the booking being edited
  const [editingBooking, setEditingBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [search, setSearch] = useState("");
  const dateRef = useRef(null);

  const closeToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const load = async () => {
    if (!date) { setToast({ msg: "Please select a date.", type: "error" }); return; }
    setLoading(true);
    setBookings([]);
    setFetched(false);
    setSelectedBooking(null);
    try {
      const { data } = await api.get("/api/bookings", { params: { date } });
      setBookings(data || []);
      setFetched(true);
      if (!data?.length) setToast({ msg: "No bookings found for this date.", type: "info" });
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to fetch bookings.", type: "error" });
      setFetched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- HANDLERS ---
  const handleEdit = (booking, e) => {
    e.stopPropagation(); // Prevents the details drawer from opening
    setEditingBooking(booking); // Opens the edit modal
  };

  const handleUpdateBooking = async (updatedData) => {
    if (!updatedData.customer || !updatedData.phone || !updatedData.email) {
      setToast({ msg: "Please fill all customer fields.", type: "error" });
      return;
    }

    setIsUpdating(true);
    try {
      // Re-format the notes string based on the modal's input
      const newNotes = `Customer: ${updatedData.customer}\nPhone: ${updatedData.phone}\nEmail: ${updatedData.email}`;

      // Call backend to update
      await api.put(`/api/bookings/${editingBooking.id}`, {
        notes: newNotes
      });

      setToast({ msg: "Booking updated successfully.", type: "success" });
      setEditingBooking(null);
      load(); // Refresh the list to show new data
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to update booking.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (bookingId, e) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/api/bookings/${bookingId}`);
      setToast({ msg: "Booking deleted successfully.", type: "success" });

      // Instantly remove from UI
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to delete booking.", type: "error" });
    }
  };
  // --------------------

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.employeeId?.toLowerCase().includes(q) ||
      b.employeeName?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

      <div className="filters-bar">
        <div className="field">
          <label className="flabel">Date</label>
          <div className="date-wrap">
            <input
              ref={dateRef}
              className="ctrl ctrl-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button className="cal-btn" onClick={() => dateRef.current?.showPicker?.()} aria-label="Open calendar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="field" style={{ maxWidth: 260 }}>
          <label className="flabel">Search</label>
          <input
            className="ctrl"
            placeholder="Agent ID, name, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="field field-btn">
          <button className="btn btn-primary" onClick={load} disabled={loading} style={{ height: 38 }}>
            {loading ? <><span className="spin spin-sm" /> Loading…</> : "Fetch Bookings"}
          </button>
        </div>
      </div>

      {fetched && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-meta">
            <span className="table-heading">Bookings — {formatDate(date)}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="hint-text">Click a row to view details</span>
              <span className="badge">{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="td-n">#</th>
                  <th>Agent</th>
                  <th>Time Slot</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="th-r">Created</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const notes = parseNotes(b.notes);
                  return (
                    <tr
                      key={b.id}
                      className={`row-clickable ${selectedBooking?.id === b.id ? "row-active" : ""}`}
                      onClick={() => setSelectedBooking(b)}
                    >
                      <td className="td-n">{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="agent-avatar" style={{ width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>
                            {(b.employeeName || b.employeeId || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 600, fontSize: 13, color: "#6366f1", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                              onClick={(e) => { e.stopPropagation(); setProfileEmpId(b.employeeId); }}
                              title="View employee profile"
                            >
                              {b.employeeId}
                            </div>
                            {b.employeeName && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.employeeName}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="td-slot">{formatTime(b.slotStart)} → {formatTime(b.slotEnd)}</td>
                      <td>{notes["Customer"] || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td>{notes["Phone"] || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {notes["Email"] || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td className="th-r" style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>

                     <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                       <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                         {/* Edit Button */}
                         <button
                           onClick={(e) => handleEdit(b, e)}
                           style={{
                             background: "none", border: "none", cursor: "pointer",
                             color: "#6366f1", display: "flex", alignItems: "center",
                             justifyContent: "center", padding: "4px"
                           }}
                           title="Edit Booking"
                         >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M12 20h9"></path>
                             <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                           </svg>
                         </button>

                         {/* Delete Button */}
                         <button
                           onClick={(e) => handleDelete(b.id, e)}
                           style={{
                             background: "none", border: "none", cursor: "pointer",
                             color: "#ef4444", display: "flex", alignItems: "center",
                             justifyContent: "center", padding: "4px"
                           }}
                           title="Delete Booking"
                         >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <polyline points="3 6 5 6 21 6"></polyline>
                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                             <line x1="10" y1="11" x2="10" y2="17"></line>
                             <line x1="14" y1="11" x2="14" y2="17"></line>
                           </svg>
                         </button>
                       </div>
                     </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fetched && filtered.length === 0 && !loading && (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
          </svg>
          <p>{search ? "No bookings match your search." : "No bookings found for this date."}</p>
          <p className="empty-sub">Try a different date or search term.</p>
        </div>
      )}

      {/* FIXED: Modals and Drawers block */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSave={handleUpdateBooking}
          inProgress={isUpdating}
        />
      )}

      <BookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      <EmployeeProfileDrawer
        empId={profileEmpId}
        onClose={() => setProfileEmpId(null)}
      />
    </div>
  );
}