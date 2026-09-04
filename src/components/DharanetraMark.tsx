/** Brand mark — a radar-eye: concentric arcs inside a circle. */
export function DharanetraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="16" r="6.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      <path
        d="M16 5.5V8M16 24v2.5M5.5 16H8M24 16h2.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}