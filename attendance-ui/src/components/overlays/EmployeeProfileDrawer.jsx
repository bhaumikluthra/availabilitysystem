import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2000, i, 1);
  return {
    value: String(i + 1).padStart(2, "0"),
    label: d.toLocaleString("en-IN", { month: "long" }),
    short: d.toLocaleString("en-IN", { month: "short" }),
  };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Returns the colour + label config for a given day code/value */
function dayConfig(raw) {
  if (!raw || raw === "") return null;
  const upper = String(raw).toUpperCase().trim();
  if (upper === "WO")  return { bg: "#dbeafe", text: "#1e40af", label: "WO",    title: "Week Off" };
  if (upper === "PL")  return { bg: "#fef3c7", text: "#92400e", label: "PL",    title: "Planned Leave" };
  if (upper === "LOP") return { bg: "#fee2e2", text: "#991b1b", label: "LOP",   title: "Loss of Pay" };
  // Any shift string (e.g. "10:00-19:00") is treated as present
  return { bg: "#d1fae5", text: "#065f46", label: "✓", title: raw };
}

function CalendarMonth({ year, month, days }) {
  // days: { [dayNum]: rawValue }  e.g. { "1": "10:00-19:00", "3": "WO", "5": "PL" }
  const firstDay = new Date(Number(year), Number(month) - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const cells = [];
  // leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ userSelect: "none" }}>
      {/* Day-of-week header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map(dl => (
          <div key={dl} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--text-muted, #9ca3af)", padding: "2px 0" }}>
            {dl}
          </div>
        ))}
      </div>
      {/* Date grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const raw = days?.[String(day)];
          const cfg = dayConfig(raw);
          return (
            <div
              key={day}
              title={cfg ? cfg.title : "No data"}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                background: cfg ? cfg.bg : "#f3f4f6",
                color: cfg ? cfg.text : "#9ca3af",
                border: cfg ? `1px solid ${cfg.bg}` : "1px solid #e5e7eb",
                cursor: cfg ? "default" : "default",
                transition: "transform 0.1s",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{day}</span>
              <span style={{ fontSize: cfg ? 9 : 9, lineHeight: 1 }}>{cfg ? cfg.label : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ value, color, label }) {
  const palettes = {
    green:  { bg: "#d1fae5", text: "#065f46" },
    blue:   { bg: "#dbeafe", text: "#1e40af" },
    yellow: { bg: "#fef3c7", text: "#92400e" },
    red:    { bg: "#fee2e2", text: "#991b1b" },
    gray:   { bg: "#f3f4f6", text: "#374151" },
  };
  const p = palettes[color] || palettes.gray;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 44, height: 44, borderRadius: 12,
        background: p.bg, color: p.text, fontWeight: 700, fontSize: 18,
      }}>{value}</span>
      <span style={{ fontSize: 11, color: "var(--text-muted, #6b7280)", fontWeight: 500, textAlign: "center" }}>{label}</span>
    </div>
  );
}

export default function EmployeeProfileDrawer({ empId, onClose }) {
  const thisMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const [year,  setYear]  = useState(String(currentYear));
  const [month, setMonth] = useState(thisMonth);
  const [summary, setSummary] = useState(null);   // { empId, employeeName, manager, groupName, coachName, shiftDays, woDays, plDays, lopDays, otherDays, totalDays }
  const [dailyMap, setDailyMap] = useState(null); // { "1": "10:00-19:00", "3": "WO", ... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    setError("");
    setSummary(null);
    setDailyMap(null);
    try {
      // 1. Summary (aggregate counts)
      const { data: sumData } = await api.get("/api/attendance/summary", {
        params: { month: `${year}-${month}`, empId },
      });
      const emp = Array.isArray(sumData) ? sumData[0] : sumData;
      setSummary(emp || null);

      // 2. Daily breakdown for calendar
      const { data: dailyData } = await api.get("/api/attendance/daily", {
        params: { month: `${year}-${month}`, empId },
      });
      // Expect: [{ day: 1, value: "10:00-19:00" }, ...] OR { "1": "WO", ... }
      if (Array.isArray(dailyData)) {
        const map = {};
        dailyData.forEach(d => { map[String(d.day)] = d.value; });
        setDailyMap(map);
      } else {
        setDailyMap(dailyData || {});
      }
    } catch (err) {
      setError(err?.response?.data || "Failed to load employee profile.");
    } finally {
      setLoading(false);
    }
  }, [empId, year, month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!empId) return null;

  const monthLabel = MONTHS.find(m => m.value === month)?.label ?? month;

  // Avatar initials
  const initials = summary?.employeeName
    ? summary.employeeName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : (empId?.[0] ?? "?").toUpperCase();

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside
        className="drawer"
        role="dialog"
        aria-label="Employee profile"
        style={{ width: "min(520px, 95vw)", overflowY: "auto" }}
      >
        {/* ── Header ── */}
        <div className="drawer-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 0, padding: "20px 24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className="drawer-label" style={{ margin: 0 }}>Employee Profile</p>
            <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
          </div>

          {/* Identity card */}
          {summary && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 20, letterSpacing: "-0.5px",
              }}>{initials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text, #111827)" }}>
                  {summary.employeeName || empId}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted, #6b7280)", marginTop: 2 }}>
                  {empId}
                  {summary.groupName && <> · <span style={{ color: "#6366f1" }}>{summary.groupName}</span></>}
                </div>
              </div>
            </div>
          )}

          {/* Meta tags row */}
          {summary && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {summary.manager && (
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "#f3f4f6", color: "#374151", fontWeight: 500 }}>
                  👤 {summary.manager}
                </span>
              )}
              {summary.coachName && (
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "#ede9fe", color: "#5b21b6", fontWeight: 500 }}>
                  🎓 {summary.coachName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Month/Year selector ── */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center",
          padding: "12px 24px", background: "#f9fafb",
          borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
        }}>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, background: "#fff", color: "black" }}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, background: "#fff", flex: 1,color: "black" }}
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "5px 14px", borderRadius: 6, border: "none",
              background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "…" : "Go"}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="drawer-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted, #6b7280)", justifyContent: "center", padding: "40px 0" }}>
              <span className="spin spin-dark" />
              <span>Loading data…</span>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 8, color: "#991b1b", fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && summary && (
            <>
              {/* ── Stats row ── */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted, #9ca3af)", marginBottom: 12 }}>
                  {monthLabel} {year} · Summary
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
                  <StatPill value={summary.shiftDays ?? 0} color="green"  label="Present" />
                  <StatPill value={summary.woDays    ?? 0} color="blue"   label="Week Off" />
                  <StatPill value={summary.plDays    ?? 0} color="yellow" label="PL" />
                  <StatPill value={summary.lopDays   ?? 0} color="red"    label="LOP" />
                  <StatPill value={summary.otherDays ?? 0} color="gray"   label="Other" />
                  <StatPill value={summary.totalDays ?? 0} color="gray"   label="Total" />
                </div>
              </div>

              {/* ── Calendar ── */}
              {dailyMap && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted, #9ca3af)", marginBottom: 12 }}>
                    {monthLabel} {year} · Day-by-Day
                  </p>
                  <CalendarMonth year={year} month={month} days={dailyMap} />

                  {/* Legend */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {[
                      { bg: "#d1fae5", text: "#065f46", label: "Present (Shift)" },
                      { bg: "#dbeafe", text: "#1e40af", label: "Week Off" },
                      { bg: "#fef3c7", text: "#92400e", label: "Planned Leave" },
                      { bg: "#fee2e2", text: "#991b1b", label: "LOP" },
                      { bg: "#f3f4f6", text: "#9ca3af", label: "No data" },
                    ].map(({ bg, text, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${bg}`, display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted, #6b7280)" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !error && !summary && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted, #6b7280)" }}>
              <p style={{ fontSize: 15 }}>No attendance data found.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try a different month or upload a roster covering this period.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}