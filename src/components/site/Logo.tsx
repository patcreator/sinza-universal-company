/**
 * SINZA UNIVERSAL COMPANY monogram — drawn as vector so it scales,
 * reverses to one colour and can be re-coloured by the admin theme.
 * A continuous rounded "S" with the signature crimson diagonal slash.
 */
export function SinzaMark({
  size = 40,
  slashClassName = "fill-primary",
  className = "fill-current",
  title = "Sinza Universal Company",
}: {
  size?: number;
  slashClassName?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className="shrink-0"
    >
      <defs>
        <clipPath id="sinza-mark-clip">
          <rect x="0" y="0" width="120" height="120" rx="26" />
        </clipPath>
      </defs>
      <g clipPath="url(#sinza-mark-clip)">
        {/* the diagonal slash, drawn under the S and again over it */}
        <g transform="rotate(-46 40 62)">
          <rect x="-2" y="53" width="62" height="15" rx="7.5" className={slashClassName} />
        </g>
        {/* continuous S stroke */}
        <path
          d="M92 36c0-12-12-19-25-17.5C52 20 44 27 44 37c0 11 12 15 22 20 11 5.5 20 9.5 20 21 0 12-12 20-27 20-14 0-25-7-27-18"
          fill="none"
          strokeWidth="15.5"
          strokeLinecap="round"
          className="stroke-current"
        />
        <g transform="rotate(-46 40 62)">
          <rect x="-2" y="53" width="46" height="15" rx="7.5" className={slashClassName} />
        </g>
      </g>
    </svg>
  );
}

export function SinzaLogo({
  size = 38,
  stacked = false,
  className = "",
}: {
  size?: number;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <SinzaMark size={size} />
      <span
        className={`leading-[0.92] font-display font-semibold ${
          stacked ? "block text-[0.95em]" : "block text-[1.02em]"
        }`}
        style={{ letterSpacing: "-0.03em" }}
      >
        Sinza Universal
        <span className="block opacity-70">Company</span>
      </span>
    </span>
  );
}
