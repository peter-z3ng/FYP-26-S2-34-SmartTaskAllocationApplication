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
            <path d="M12 3l2.4 5 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 18l.9-5.4-3.9-3.8 5.4-.8L12 3z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M12 3l7 4v7c0 3.4-2.2 6.4-7 7-4.8-.6-7-3.6-7-7V7l7-4z" />
            <path d="M9 12h6" />
            <path d="M12 9v6" />
          </svg>
        )}
      </span>
      <span>{isPaid ? "Paid Pro" : "Free"}</span>
    </span>
  );
}
