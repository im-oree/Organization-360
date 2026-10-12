import type { IdVerification } from "@o360/contracts";
import { api, useBrand } from "@o360/platform";
import { CircleCheck, CircleX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Public page opened by scanning an ID card. No sign-in needed; shows only what's on the card. */
export default function Verify({ staffNo }: { staffNo: string }) {
  const brand = useBrand();
  const [result, setResult] = useState<IdVerification | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get<IdVerification>(`/verify/${encodeURIComponent(staffNo)}`).then(setResult, () => setFailed(true));
  }, [staffNo]);

  return (
    <main className="grid min-h-full place-items-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-brand border border-line bg-surface p-8 text-center shadow-soft">
        <img src={brand.logo} alt={brand.name} className="mx-auto mb-6 size-10 rounded-lg" />
        {failed ? (
          <p className="text-[14px] text-muted">We couldn't check this ID right now. Check your connection and scan again.</p>
        ) : !result ? null : result.valid ? (
          <>
            <CircleCheck className="mx-auto mb-3 size-12 text-success" />
            <h1 className="text-[20px] font-bold">{result.name}</h1>
            <p className="text-[14px] text-muted">{result.title} · {result.department}</p>
            <p className="mt-4 text-[13px] text-success">Current member of staff at {brand.name}</p>
            <p className="mt-1 font-mono text-[12px] text-muted">{result.staffNo}</p>
          </>
        ) : (
          <>
            <CircleX className="mx-auto mb-3 size-12 text-danger" />
            <h1 className="text-[18px] font-bold">This ID isn't valid</h1>
            <p className="mt-1 text-[14px] text-muted">The card doesn't match a current member of staff at {brand.name}.</p>
          </>
        )}
      </motion.div>
    </main>
  );
}
