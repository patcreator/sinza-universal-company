/** Hand-drawn brand + partner marks (vector, single-colour capable). */

export function SocialIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" as const };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2a3.7 3.7 0 0 1-.9 1.4c-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4a3.7 3.7 0 0 1-1.4-.9 3.7 3.7 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.9c-3.1 0-3.5 0-4.8.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.2.78-.34.33-.58.7-.78 1.2-.16.4-.35 1-.4 2.1-.06 1.3-.07 1.7-.07 4.8s0 3.5.07 4.8c.05 1.1.24 1.7.4 2.1.2.5.44.9.78 1.2.33.34.7.58 1.2.78.4.16 1 .35 2.1.4 1.3.06 1.7.07 4.8.07s3.5 0 4.8-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.2-.78.34-.33.58-.7.78-1.2.16-.4.35-1 .4-2.1.06-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c-.05-1.1-.24-1.7-.4-2.1a3.2 3.2 0 0 0-.78-1.2 3.2 3.2 0 0 0-1.2-.78c-.4-.16-1-.35-2.1-.4-1.3-.06-1.7-.07-4.8-.07Zm0 3.2a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.9a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm6.1-3.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M22.5 7.1a2.7 2.7 0 0 0-1.9-1.9C18.9 4.7 12 4.7 12 4.7s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.1 28 28 0 0 0 1 12a28 28 0 0 0 .5 4.9 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 23 12a28 28 0 0 0-.5-4.9ZM9.8 15.4V8.6l5.8 3.4-5.8 3.4Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5.1 21H2l7.3-8.3L2.5 3h6.4l4.4 5.8L17.5 3Zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3Z" />
        </svg>
      );
    case "apple":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.2-2.8.8-3.5.8-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.7-4ZM14.2 5.8c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.5Z" />
        </svg>
      );
    case "shazam":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.9 12.4c-.7.9-1.6 1.3-2.6 1.3-.7 0-1.3-.2-1.8-.5l-.5 1.3c.7.4 1.5.6 2.4.6 1.6 0 2.9-.8 3.9-2.1l1.3.8c-1.2 1.7-3 2.7-5.2 2.7a5.6 5.6 0 0 1-3.2-1l3.2-4.2c.7-.9 1.6-1.3 2.6-1.3.6 0 1.1.1 1.5.4l-.5-1.5c-.4-.1-.9-.2-1.4-.2-1.5 0-2.7.6-3.6 1.7L7.2 8.6A5.7 5.7 0 0 1 10.5 7c1.7 0 3 .8 3.9 2.2Z" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15 15 0 0 0-1.2-5.4A8 8 0 0 1 18.9 11ZM12 4.2c.8 1.2 1.6 3.4 1.8 6.8h-3.6c.2-3.4 1-5.6 1.8-6.8ZM9.3 5.6A15 15 0 0 0 8.1 11h-3a8 8 0 0 1 4.2-5.4ZM5.1 13h3a15 15 0 0 0 1.2 5.4A8 8 0 0 1 5.1 13ZM12 19.8c-.8-1.2-1.6-3.4-1.8-6.8h3.6c-.2 3.4-1 5.6-1.8 6.8Zm2.7-1.4a15 15 0 0 0 1.2-5.4h3a8 8 0 0 1-4.2 5.4Z" />
        </svg>
      );
  }
}

/** Payment partner marks for the checkout and footer. */
export function PaymentMark({ method }: { method: string }) {
  const base = "flex items-center justify-center rounded-lg px-2.5 h-9 font-semibold text-[11px] tracking-wide";
  switch (method) {
    case "mtn":
      return (
        <span className={`${base} bg-[#FFCC00] text-[#14100F]`} title="MTN Mobile Money">
          <svg width="34" height="14" viewBox="0 0 60 22" aria-label="MTN Mobile Money">
            <text x="0" y="17" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="17" fill="#14100F">
              MTN
            </text>
            <circle cx="52" cy="11" r="7" fill="none" stroke="#14100F" strokeWidth="2" />
          </svg>
        </span>
      );
    case "airtel":
      return (
        <span className={`${base} bg-[#E4002B] text-white`} title="Airtel Money">
          <svg width="42" height="14" viewBox="0 0 72 22" aria-label="Airtel Money">
            <text x="0" y="17" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="16" fill="#fff">
              airtel
            </text>
          </svg>
        </span>
      );
    case "visa":
      return (
        <span className={`${base} bg-white text-[#1A1F71] border border-line`} title="Visa">
          <svg width="40" height="14" viewBox="0 0 66 22" aria-label="Visa">
            <text x="0" y="18" fontFamily="Space Grotesk, sans-serif" fontStyle="italic" fontWeight="700" fontSize="19" fill="#1A1F71">
              VISA
            </text>
          </svg>
        </span>
      );
    case "mastercard":
      return (
        <span className={`${base} bg-white border border-line`} title="Mastercard">
          <svg width="34" height="20" viewBox="0 0 42 26" aria-label="Mastercard">
            <circle cx="16" cy="13" r="10" fill="#EB001B" />
            <circle cx="26" cy="13" r="10" fill="#F79E1B" fillOpacity="0.9" />
          </svg>
        </span>
      );
    case "pesapal":
      return (
        <span className={`${base} bg-[#0072BC] text-white`} title="Pesapal">
          <svg width="56" height="14" viewBox="0 0 96 22" aria-label="Pesapal">
            <text x="0" y="17" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="15" fill="#fff">
              pesapal
            </text>
          </svg>
        </span>
      );
    case "pawapay":
      return (
        <span className={`${base} bg-[#00B39F] text-white`} title="pawaPay">
          <svg width="60" height="14" viewBox="0 0 100 22" aria-label="pawaPay">
            <text x="0" y="17" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="15" fill="#fff">
              pawaPay
            </text>
          </svg>
        </span>
      );
    default:
      return null;
  }
}
