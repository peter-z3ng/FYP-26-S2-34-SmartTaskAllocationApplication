import { normalizeUserTier } from "@/lib/paidFeatures";

export { normalizeUserTier };

export function nextUserTier(value) {
  return normalizeUserTier(value) === "Paid" ? "Free" : "Paid";
}

export default function UserTierBadge({ tier, size = "md" }) {
  const normalizedTier = normalizeUserTier(tier);
  const isPaid = normalizedTier === "Paid";

  return (
    <span className={`user-tier-badge ${isPaid ? "is-paid" : "is-free"} is-${size}`}>
      <span className="user-tier-icon" aria-hidden="true">
        {isPaid ? (
          <svg viewBox="0 0 24 24">
            <path d="M5 8l4 3 3-6 3 6 4-3-2 9H7L5 8z" />
            <path d="M7 19h10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="6" />
            <path d="M12 9v6" />
            <path d="M9 12h6" />
          </svg>
        )}
      </span>
      <span>{isPaid ? "Pro" : "Free"}</span>
    </span>
  );
}
