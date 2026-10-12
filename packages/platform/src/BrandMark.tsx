import { useState } from "react";
import { useBrand } from "./brand";

/** Brand logo that falls back to initials if the image can't load, so it never shows broken. */
export function BrandMark({ className = "size-8 rounded-lg" }: { className?: string }) {
  const brand = useBrand();
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span aria-label={brand.name} className={`grid shrink-0 place-items-center bg-accent text-[12px] font-bold text-on-accent ${className}`}>
        {brand.shortName.slice(0, 2)}
      </span>
    );
  return <img src={brand.logo} alt={brand.name} onError={() => setFailed(true)} className={`shrink-0 ${className}`} />;
}
