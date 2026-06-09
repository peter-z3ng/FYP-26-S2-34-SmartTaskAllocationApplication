import Image from "next/image";
import optimaLogo from "@/public/optimalogo.jpg";

export default function BrandLogo({ dark = false, compact = false }) {
  return (
    <span className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        <Image src={optimaLogo} alt="" className="h-9 w-9 rounded-xl object-cover" priority={false} />
      </span>
      {!compact ? (
        <span className={`brand-wordmark ${dark ? "text-[#07183b]" : "text-white"}`}>
          Optima
        </span>
      ) : null}
    </span>
  );
}
