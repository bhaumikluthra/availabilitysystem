import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import bookingsClient from "../services/bookings";
import { QUARTER_TIMES } from "../utils/helpers";
import Toast from "../components/common/Toast";
import AgentBar from "../components/common/AgentBar";
import AgentDrawer from "../components/overlays/AgentDrawer";
import BookingModal from "../components/overlays/BookingModal";

export default function AvailabilityPage({ refreshTrigger }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [hasDataLoaded, setHasDataLoaded] = useState(true);
  const dateRef = useRef(null);
  const [drawer, setDrawer] = useState({ slot: null, agents: [], loading: false });
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [bookingModal, setBookingModal] = useState({ empId: null });

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

  useEffect(() => { fetchFilters(); }, [fetchFilters, refreshTrigger]);

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

  const initiateBooking = (employeeId) => {
    setBookingModal({ empId: employeeId });
  };

 const handleBook = async ({ phone, email, customer, additionalNotes }) => {
     const employeeId = bookingModal.empId;
     if (!employeeId || !drawer.slot) return;

     if (!customer || !phone || !email) {
       setToast({ msg: "Please fill customer name, phone and email.", type: "error" });
       return;
     }

     const [slotStart, slotEnd] = drawer.slot.split("-");
     setBookingInProgress(employeeId);
     try {
       const payload = { employeeId, scheduleDate: filters.date, slotStart, slotEnd, customerName: customer, customerPhone: phone, customerEmail: email, additionalNotes: additionalNotes || "" };

       await bookingsClient.createBooking(payload);
       setToast({ msg: "Booking created.", type: "success" });
       setBookingModal({ empId: null });
       await loadAvailability();
       await handleSlotClick(drawer.slot);
     } catch (err) {
       setToast({ msg: err?.response?.data || err.message || "Booking failed.", type: "error" });
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
    <>
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
            <p className="empty-sub">No employee data detected. Please click <strong>Add Data</strong> to upload your roster.</p>
          )}
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

      <AgentDrawer
        slot={drawer.slot}
        agents={drawer.agents}
        loading={drawer.loading}
        onClose={() => setDrawer({ slot: null, agents: [], loading: false })}
        onBook={initiateBooking}
        bookingInProgress={bookingInProgress}
      />

      {bookingModal.empId && (
        <BookingModal
          empId={bookingModal.empId}
          slot={drawer.slot}
          onClose={() => setBookingModal({ empId: null })}
          onConfirm={handleBook}
          inProgress={bookingInProgress}
        />
      )}
    </>
  );
}