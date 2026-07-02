// The FHP bean mark — a solid white bean, transparent background.
// Derived from the brand: "fazuľa" = bean (Slovak), the word inside "Fazúľové Herné Poklady".
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="FHP"
    >
      <g transform="translate(27, 13)">
        <path
          d="M58,4 C84,4 100,24 100,50 C100,76 112,90 106,112 C100,132 78,138 54,134 C30,130 10,118 8,92 C6,66 14,42 28,22 C38,10 48,4 58,4 Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
}
