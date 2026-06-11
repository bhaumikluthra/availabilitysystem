import { useState, useCallback } from "react";
import api from "../services/api";
import Toast from "../components/common/Toast";
import EmployeeProfileDrawer from "../components/overlays/EmployeeProfileDrawer";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2000, i, 1);
  return {
    value: String(i + 1).padStart(2, "0"),
    label: d.toLocaleString("en-IN", { month: "long" }),
  };
});

const currentYear  = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

function pill(n, color) {
  if (n === 0) return <span style={{ color: "var(--text-muted)" }}>0</span>;
  const bg  = { green: "#d1fae5", red: "#fee2e2", yellow: "#fef3c7", blue: "#dbeafe", gray: "#f3f4f6" }[color] || "#f3f4f6";
  const txt = { green: "#065f46", red: "#991b1b", yellow: "#92400e", blue: "#1e40af", gray: "#374151" }[color] || "#374151";
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      background: bg, color: txt, fontWeight: 600, fontSize: 13,
    }}>{n}</span>
  );
}

export default function AttendancePage() {
  const thisMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const [year,  setYear]  = useState(String(currentYear));
  const [month, setMonth] = useState(thisMonth);
  const [empId, setEmpId] = useState("");
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ col: "empId", dir: "asc" });
  const [toast,   setToast]   = useState({ msg: "", type: "info" });

  // ✅ New: track which emp's profile drawer is open
  const [profileEmpId, setProfileEmpId] = useState(null);

  const closeToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const load = async () => {
    setLoading(true);
    setRows([]);
    setFetched(false);
    try {
      const params = { month: `${year}-${month}` };
      if (empId.trim()) params.empId = empId.trim();
      const { data } = await api.get("/api/attendance/summary", { params });
      setRows(data || []);
      setFetched(true);
      if (!data?.length) setToast({ msg: "No attendance data found for this period.", type: "info" });
    } catch (err) {
      setToast({ msg: err?.response?.data || "Failed to load attendance summary.", type: "error" });
      setFetched(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (col) => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  };

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <span style={{ opacity: .3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sort.dir === "asc" ? "↑" : "↓"}</span>;
  };

  const visible = rows
    .filter(r => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.empId?.toLowerCase().includes(q) ||
        r.employeeName?.toLowerCase().includes(q) ||
        r.manager?.toLowerCase().includes(q) ||
        r.groupName?.toLowerCase().includes(q) ||
        r.coachName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const va = a[sort.col] ?? 0;
      const vb = b[sort.col] ?? 0;
      if (typeof va === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });

  const totals = visible.reduce(
    (acc, r) => ({
      shiftDays: acc.shiftDays + r.shiftDays, woDays: acc.woDays + r.woDays,
      plDays: acc.plDays + r.plDays, lopDays: acc.lopDays + r.lopDays,
      otherDays: acc.otherDays + r.otherDays, totalDays: acc.totalDays + r.totalDays,
    }),
    { shiftDays: 0, woDays: 0, plDays: 0, lopDays: 0, otherDays: 0, totalDays: 0 }
  );

  const monthLabel = MONTHS.find(m => m.value === month)?.label ?? month;

  const TH = ({ col, children, align = "left" }) => (
    <th onClick={() => toggleSort(col)} style={{ cursor: "pointer", textAlign: align, userSelect: "none" }} title={`Sort by ${col}`}>
      {children}<SortIcon col={col} />
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

      <div className="filters-bar" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field">
          <label className="flabel" style={{ display: "block", marginBottom: "4px" }}>Year</label>
          <select className="ctrl" value={year} onChange={e => setYear(e.target.value)} style={{ padding: "6px" }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="flabel" style={{ display: "block", marginBottom: "4px" }}>Month</label>
          <select className="ctrl" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: "6px" }}>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label className="flabel" style={{ display: "block", marginBottom: "4px" }}>Employee ID (optional)</label>
          <input
            className="ctrl"
            placeholder="e.g. E001"
            value={empId}
            onChange={e => setEmpId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            style={{ padding: "6px" }}
          />
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label className="flabel" style={{ display: "block", marginBottom: "4px" }}>Search</label>
          <input
            className="ctrl"
            placeholder="ID, name, manager, group…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px" }}
          />
        </div>
        <div className="field field-btn">
          <button className="btn btn-primary" onClick={load} disabled={loading} style={{ height: 38, padding: "0 16px", cursor: "pointer" }}>
            {loading ? "Loading…" : "Load Summary"}
          </button>
        </div>
      </div>

      {fetched && visible.length > 0 && (
        <div className="table-card" style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div className="table-meta" style={{ padding: "16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
            <span className="table-heading" style={{ fontWeight: "bold" }}>
              Attendance Summary — {monthLabel} {year}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* ✅ Updated hint text */}
              <span className="hint-text" style={{ fontSize: "12px", color: "gray" }}>Click an Emp ID to view profile · Click headers to sort</span>
              <span className="badge" style={{ background: "#e5e7eb", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                {visible.length} employee{visible.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="table-scroll" style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#f3f4f6" }}>
                <tr>
                  <th style={{ padding: "12px" }}>#</th>
                  <TH col="empId"><span style={{ padding: "12px" }}>Emp ID</span></TH>
                  <TH col="employeeName">Name</TH>
                  <TH col="manager">Manager</TH>
                  <TH col="groupName">Group</TH>
                  <TH col="coachName">Coach</TH>
                  <TH col="shiftDays" align="center"><span style={{ color: "#065f46" }}>SHIFT ✓</span></TH>
                  <TH col="woDays" align="center"><span style={{ color: "#1e40af" }}>WO</span></TH>
                  <TH col="plDays" align="center"><span style={{ color: "#92400e" }}>PL</span></TH>
                  <TH col="lopDays" align="center"><span style={{ color: "#991b1b" }}>LOP</span></TH>
                  <TH col="otherDays" align="center">Other</TH>
                  <TH col="totalDays" align="center">Total</TH>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={r.empId} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>{i + 1}</td>

                    {/* ✅ Clickable Emp ID — same pattern as ViewBookingsPage */}
                    <td>
                      <span
                        style={{
                          fontWeight: 600, fontSize: 13,
                          color: "#6366f1", cursor: "pointer",
                          textDecoration: "underline", textUnderlineOffset: 2,
                        }}
                        onClick={() => setProfileEmpId(r.empId)}
                        title="View employee profile"
                      >
                        {r.empId}
                      </span>
                    </td>

                    <td style={{ fontWeight: 500 }}>{r.employeeName || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td style={{ color: "gray", fontSize: 13 }}>{r.manager   || "—"}</td>
                    <td style={{ color: "gray", fontSize: 13 }}>{r.groupName || "—"}</td>
                    <td style={{ color: "gray", fontSize: 13 }}>{r.coachName || "—"}</td>
                    <td style={{ textAlign: "center" }}>{pill(r.shiftDays, "green")}</td>
                    <td style={{ textAlign: "center" }}>{pill(r.woDays,    "blue")}</td>
                    <td style={{ textAlign: "center" }}>{pill(r.plDays,    "yellow")}</td>
                    <td style={{ textAlign: "center" }}>{pill(r.lopDays,   "red")}</td>
                    <td style={{ textAlign: "center" }}>{pill(r.otherDays, "gray")}</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{r.totalDays}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
                  <td colSpan={6} style={{ padding: "12px", fontSize: 13, color: "gray" }}>Totals ({visible.length} employees)</td>
                  <td style={{ textAlign: "center" }}>{pill(totals.shiftDays, "green")}</td>
                  <td style={{ textAlign: "center" }}>{pill(totals.woDays,    "blue")}</td>
                  <td style={{ textAlign: "center" }}>{pill(totals.plDays,    "yellow")}</td>
                  <td style={{ textAlign: "center" }}>{pill(totals.lopDays,   "red")}</td>
                  <td style={{ textAlign: "center" }}>{pill(totals.otherDays, "gray")}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{totals.totalDays}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {fetched && visible.length === 0 && !loading && (
        <div className="empty" style={{ textAlign: "center", padding: "40px", color: "gray" }}>
          <p>No attendance data for {monthLabel} {year}.</p>
          <p style={{ fontSize: "14px" }}>Upload a roster that covers this month first.</p>
        </div>
      )}

      {/* ✅ Profile drawer — same as ViewBookingsPage */}

<EmployeeProfileDrawer
  empId={profileEmpId}
  onClose={() => setProfileEmpId(null)}
  initialYear={year}
  initialMonth={month}
/>
    </div>
  );
}