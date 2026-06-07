export default function BrandLogo({ dark = false, compact = false }) {
  return (
    <span className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <defs>
            <linearGradient id="tasknova-mark-gradient" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5EEAD4" />
              <stop offset="0.55" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#D9F99D" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#tasknova-mark-gradient)" />
          <path
            d="M13 26c5.2-8.3 15.8-12.2 25-8.1"
            fill="none"
            stroke="#05202C"
            strokeLinecap="round"
            strokeWidth="3"
            opacity="0.55"
          />
          <path
            d="M14 29l5 5 15-18"
            fill="none"
            stroke="#05202C"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path d="M30 10l1.6 3.4L35 15l-3.4 1.6L30 20l-1.6-3.4L25 15l3.4-1.6L30 10z" fill="#05202C" />
        </svg>
      </span>
      {!compact ? (
        <span className={`brand-wordmark ${dark ? "text-[#071428]" : "text-white"}`}>
          TaskNova
        </span>
      ) : null}
    </span>
  );
}
