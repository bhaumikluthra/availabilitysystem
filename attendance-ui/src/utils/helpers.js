/**
 * Formats a time string (HH:MM or HH:MM:SS) into a 12-hour AM/PM format.
 */
export function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into a readable format (e.g., 01 Jan 2024).
 */
export function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Parses a newline-separated string of "Key: Value" notes into a JavaScript object.
 */
export function parseNotes(raw) {
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

/**
 * Clamps a number between a minimum and maximum value.
 */
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Generates an array of time strings in 15-minute increments for a 24-hour period.
 */
export const generateQuarterTimes = () => {
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

// Pre-computed constant for use in dropdowns
export const QUARTER_TIMES = generateQuarterTimes();