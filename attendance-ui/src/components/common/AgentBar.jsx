import { clamp } from "../../utils/helpers";

export default function AgentBar({ count, max }) {
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