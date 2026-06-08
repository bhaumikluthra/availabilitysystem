import { useEffect, useState, useRef, useCallback } from "react";
import api from "./services/api";
import bookingsClient from "./services/bookings";
import "./App.css";

/* ─── helpers ─── */
function formatTime(t) {
  if (!t) return "—";
  // t is "HH:MM:SS" or "HH:MM"
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function parseNotes(raw) {
  if (!raw) return {};
  const out = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      out[key] = val;
    }
  }
  return out;
}

/* ─── Booking Detail Drawer ─── */
function BookingDetailDrawer({ booking, onClose }) {
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

/* ─── View Bookings Page ─── */
function ViewBookingsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [selectedBooking, setSelectedBooking] = useState(null);
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

  // auto-load on mount with today's date
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* filter bar */}
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

      {/* table */}
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
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{b.employeeId}</div>
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

      <BookingDetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const generateQuarterTimes = () => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
};
const QUARTER_TIMES = generateQuarterTimes();
function AgentBar({ count, max }) {
  const pct = max > 0 ? clamp((count / max) * 100, 3, 100) : 0;
  const color = pct > 66 ? "var(--hi)" : pct > 33 ? "var(--mid)" : "var(--lo)";
  return (
    <span className="bar-wrap">
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="bar-num">{count}</span>
    </span>
  );
}
function Toast({ msg, type, onClose }) {
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
function AgentDrawer({ slot, agents, loading, onClose, onBook, bookingInProgress }) {
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
function AddDataModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [breakTime, setBreakTime] = useState({ breakStart: "12:00", breakEnd: "13:00" });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });

  const fileRef = useRef(null);

  const notify = (msg, type = "info") => setToast({ msg, type });
  const closeToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const handleFileSelect = (f) => {
    if (f) { setFile(f); setFileName(f.name); setUploaded(false); }
  };

  const doUpload = async () => {
    if (!file) { notify("Please select a CSV file first.", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201 || res.status === 200) {
        notify(res.data?.message || res.data || "File uploaded successfully.", "success");
        setUploaded(true);
      }
    } catch (err) {
      notify(err?.response?.data || "Upload failed. Please check the CSV format.", "error");
    } finally {
      setUploading(false);
    }
  };

  const doSaveBreak = async () => {
    setSaving(true);
    try {
      const res = await api.put("/api/break-times", {
        breakStart: breakTime.breakStart,
        breakEnd: breakTime.breakEnd,
      });
      notify(res.data?.message || res.data || "Break time saved.", "success");
      setTimeout(() => { onDone(); onClose(); }, 800);
    } catch (err) {
      notify(err?.response?.data || "Failed to set break time.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">System Data Configuration</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

        <div className="modal-section">
          <p className="section-label">1. Upload Roster CSV</p>
          <div className="upload-row">
            <div
              className={`drop-zone ${fileName ? "drop-filled" : ""} ${isDragging ? "drag-active" : ""}`}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{fileName || "Click or drag a .csv file here"}</span>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])} />
            </div>
            <button className="btn btn-primary" onClick={doUpload} disabled={uploading || uploaded || !file}>
              {uploading ? <span className="spin" /> : uploaded ? "✓ Upload Complete" : "Upload File"}
            </button>
          </div>
        </div>

        <div className={`modal-section ${!uploaded ? "section-dim" : ""}`}>
          <p className="section-label">2. Global Break Time Settings</p>
          <div className="break-row">
            <div className="field">
              <label className="flabel">Start Time</label>
              <input className="ctrl" type="time" name="breakStart"
                value={breakTime.breakStart} disabled={!uploaded}
                onChange={(e) => setBreakTime(p => ({ ...p, breakStart: e.target.value }))} />
            </div>
            <span className="arrow">→</span>
            <div className="field">
              <label className="flabel">End Time</label>
              <input className="ctrl" type="time" name="breakEnd"
                value={breakTime.breakEnd} disabled={!uploaded}
                onChange={(e) => setBreakTime(p => ({ ...p, breakEnd: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={doSaveBreak} disabled={!uploaded || saving}>
              {saving ? <span className="spin" /> : "Save & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function BookingModal({ empId, slot, onClose, onConfirm, inProgress }) {
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
export default function App() {
  const [activeTab, setActiveTab] = useState("availability"); // "availability" | "bookings"
  const [showModal, setShowModal] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [hasDataLoaded, setHasDataLoaded] = useState(true);
  const dateRef = useRef(null);
  const [drawer, setDrawer] = useState({ slot: null, agents: [], loading: false });
  const [bookingInProgress, setBookingInProgress] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    managers: [], groups: [], coaches: [], statuses: [], genders: [], shiftTimes: [],
  });

  const [filters, setFilters] = useState({
    date: "", fromTime: "09:00", toTime: "18:00",
    manager: "", groupName: "", coachName: "",
    status: "", gender: "", shiftTime: "",
  });

  const closeToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const maxAgents = availability.length
    ? Math.max(...availability.map((s) => s.availableAgents))
    : 0;

  const fetchFilters = useCallback(async () => {
    try {
      const { data } = await api.get("/api/filters");
      setFilterOptions({
        managers: data?.managers || [],
        groups: data?.groups || [],
        coaches: data?.coaches || [],
        statuses: data?.statuses || [],
        genders: data?.genders || [],
        shiftTimes: data?.shiftTimes || [],
      });
      setHasDataLoaded((data?.groups?.length > 0) || (data?.managers?.length > 0));
    } catch {
      setHasDataLoaded(false);
    }
  }, []);

  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  const loadAvailability = async () => {
    if (!filters.date) { setToast({ msg: "Please select a date.", type: "error" }); return; }
    if (!hasDataLoaded) {
      setToast({ msg: "No employee data exists. Please upload a roster first.", type: "error" });
      return;
    }

    setLoading(true);
    setAvailability([]);
    setDrawer({ slot: null, agents: [], loading: false });
    try {
      const payload = Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, v || null])
      );
      const { data } = await api.post("/api/availability", payload);
      const results = data || [];
      setAvailability(results);
      if (!results.length) {
        setToast({ msg: "No results match your selected filters.", type: "info" });
      }
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to load availability.", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  const handleSlotClick = async (slotStr) => {
    const [slotStart, slotEnd] = slotStr.split("-");
    setDrawer({ slot: slotStr, agents: [], loading: true });

    try {
      const payload = {
        date: filters.date,
        slotStart,
        slotEnd,
        manager:    filters.manager    || null,
        groupName:  filters.groupName  || null,
        coachName:  filters.coachName  || null,
        status:     filters.status     || null,
        gender:     filters.gender     || null,
        shiftTime:  filters.shiftTime  || null,
      };
      const { data } = await api.post("/api/availability/agents", payload);
      setDrawer({ slot: slotStr, agents: data || [], loading: false });
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to load agents.", type: "error" });
      setDrawer({ slot: null, agents: [], loading: false });
    }
  };
  const [bookingModal, setBookingModal] = useState({ empId: null });

  const initiateBooking = (employeeId) => {
    setBookingModal({ empId: employeeId });
  };

  const handleBook = async ({ phone, email, customer }) => {
    const employeeId = bookingModal.empId;
    if (!employeeId || !drawer.slot) return;

    if (!customer || !phone || !email) {
      setToast({ msg: "Please fill customer name, phone and email.", type: "error" });
      return;
    }
    const emailOk = /^\S+@\S+\.\S+$/.test(email);
    if (!emailOk) {
      setToast({ msg: "Please enter a valid email address.", type: "error" });
      return;
    }

    const [slotStart, slotEnd] = drawer.slot.split("-");
    setBookingInProgress(employeeId);
    try {
      const notes = `Customer: ${customer}\nPhone: ${phone}\nEmail: ${email}`;
      const payload = {
        employeeId,
        scheduleDate: filters.date,
        slotStart,
        slotEnd,
        notes,
      };
      await bookingsClient.createBooking(payload);
      setToast({ msg: "Booking created.", type: "success" });
      setBookingModal({ empId: null });
      await loadAvailability();
      await handleSlotClick(drawer.slot);
    } catch (err) {
      const msg = err?.response?.data || err.message || "Booking failed.";
      setToast({ msg, type: "error" });
      if (drawer.slot) await handleSlotClick(drawer.slot);
    } finally {
      setBookingInProgress(null);
    }
  };

  const handleFilter = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

  const Field = ({ label, children }) => (
    <div className="field">
      <label className="flabel">{label}</label>
      {children}
    </div>
  );

  const Sel = ({ label, name, opts }) => (
    <Field label={label}>
      <select className="ctrl" name={name} value={filters[name]} onChange={handleFilter}>
        <option value="">All</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );

  return (
    <div className="app">
      <header className="header">
        <div className="hinner">
          <div className="logo">T</div>
          <span className="header-title">Dashboard</span>
          <nav className="header-nav">
            <button
              className={`nav-tab ${activeTab === "availability" ? "nav-tab-active" : ""}`}
              onClick={() => setActiveTab("availability")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Availability
            </button>
            <button
              className={`nav-tab ${activeTab === "bookings" ? "nav-tab-active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
              View Bookings
            </button>
          </nav>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Data
        </button>
      </header>

      <main className="main">
        {activeTab === "bookings" && <ViewBookingsPage />}
        <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

        {activeTab === "availability" && (<>
        <div className="filters-bar">
          <Field label="Target Date">
            <div className="date-wrap">
              <input
                ref={dateRef}
                className="ctrl ctrl-date"
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilter}
              />
              <button className="cal-btn" onClick={() => dateRef.current?.showPicker?.()} aria-label="Open calendar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </button>
            </div>
          </Field>
          <Field label="Time From">
            <select className="ctrl" name="fromTime" value={filters.fromTime} onChange={handleFilter}>
              {QUARTER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Time To">
            <select className="ctrl" name="toTime" value={filters.toTime} onChange={handleFilter}>
              {QUARTER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Sel label="Manager"   name="manager"   opts={filterOptions.managers} />
          <Sel label="Group"     name="groupName" opts={filterOptions.groups} />
          <Sel label="Coach"     name="coachName" opts={filterOptions.coaches} />
          <Sel label="Status"    name="status"    opts={filterOptions.statuses} />
          <Sel label="Gender"    name="gender"    opts={filterOptions.genders} />
          <Sel label="Shift"     name="shiftTime" opts={filterOptions.shiftTimes} />

          <div className="field field-btn">
            <button className="btn btn-primary" onClick={loadAvailability} disabled={loading} style={{height: '38px'}}>
              {loading ? <><span className="spin spin-sm" /> Loading…</> : "Generate Data"}
            </button>
          </div>
        </div>

        {availability.length > 0 && (
          <div className="table-card">
            <div className="table-meta">
              <span className="table-heading">Availability Overview — {filters.date}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="hint-text">Click any row to view agents</span>
                <span className="badge">{availability.length} intervals found</span>
              </div>
            </div>
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="td-n">#</th>
                    <th>Time Interval</th>
                    <th>Available Bandwidth</th>
                    <th className="th-r">Bench Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {availability.map((slot, i) => (
                    <tr
                      key={i}
                      className={[
                        slot.availableAgents === 0 ? "row-zero" : "",
                        drawer.slot === slot.slot   ? "row-active" : "",
                        "row-clickable",
                      ].join(" ")}
                      onClick={() => slot.availableAgents > 0 && handleSlotClick(slot.slot)}
                      title={slot.availableAgents > 0 ? "Click to view available agents" : undefined}
                    >
                      <td className="td-n">{i + 1}</td>
                      <td className="td-slot">{slot.slot}</td>
                      <td className="td-bar"><AgentBar count={slot.availableAgents} max={maxAgents} /></td>
                      <td className="td-pct">
                        {maxAgents > 0 ? `${Math.round((slot.availableAgents / maxAgents) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {availability.length === 0 && !loading && (
          <div className="empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
            <p>Select a date and click <strong>Generate Data</strong> to view intervals.</p>
            {!hasDataLoaded && (
              <p className="empty-sub">If No employee data detected. Please click <strong>Add Data</strong> to upload your roster.</p>
            )}
          </div>
        )}
        </>)}
      </main>      <AgentDrawer
        slot={drawer.slot}
        agents={drawer.agents}
        loading={drawer.loading}
        onClose={() => setDrawer({ slot: null, agents: [], loading: false })}
        onBook={initiateBooking}
        bookingInProgress={bookingInProgress}
      />

      {showModal && (
        <AddDataModal onClose={() => setShowModal(false)} onDone={fetchFilters} />
      )}

      {bookingModal.empId && (
        <BookingModal
          empId={bookingModal.empId}
          slot={drawer.slot}
          onClose={() => setBookingModal({ empId: null })}
          onConfirm={handleBook}
          inProgress={bookingInProgress}
        />
      )}
    </div>
  );
}