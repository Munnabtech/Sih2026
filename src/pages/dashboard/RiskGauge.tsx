interface RiskGaugeProps {
  score: number; // 0-100
  size?: number; // rendered width in px
}

const SEGMENTS = [
  { len: 25, color: "#7e9c7e" }, // Low      0-25
  { len: 24, color: "#d2a94e" }, // Moderate 25-49
  { len: 26, color: "#d97a3c" }, // High     50-76
  { len: 25, color: "#c94f42" }, // Critical 77-100
];

/**
 * Minimal semi-circular risk gauge. A needle sits on a four-colour arc
 * (Low → Critical); everything else stays monochrome.
 */
export function RiskGauge({ score, size = 240 }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;

  return (
    <svg
      viewBox="0 0 200 122"
      width={size}
      height={(size * 122) / 200}
      fill="none"
      aria-label={`Current risk ${clamped} out of 100`}
    >
      {/* Background arc */}
      <path
        d="M 16 110 A 84 84 0 0 1 184 110"
        stroke="#2a2a2a"
        strokeOpacity={0.18}
        strokeWidth="13"
      />
      {/* Coloured segments (1-unit gap between each) */}
      {SEGMENTS.map((seg, i) => {
        const offset = SEGMENTS.slice(0, i).reduce((a, s) => a + s.len + 1, 0);
        return (
          <path
            key={i}
            d="M 16 110 A 84 84 0 0 1 184 110"
            pathLength={100}
            stroke={seg.color}
            strokeWidth="13"
            strokeDasharray={`${seg.len} 1 ${100 - seg.len - 1}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
      })}
      {/* Needle */}
      <g
        transform={`rotate(${angle} 100 110)`}
        style={{ transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <line
          x1="100"
          y1="110"
          x2="42"
          y2="110"
          stroke="#f5f5f5"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <circle cx="100" cy="110" r="5.5" fill="#f5f5f5" stroke="#2a2a2a" strokeOpacity="0.35" />
      {/* End caps */}
      <circle cx="16" cy="110" r="2.5" fill="#f5f5f5" strokeOpacity="0" />
      <circle cx="184" cy="110" r="2.5" fill="#f5f5f5" strokeOpacity="0" />
    </svg>
  );
}