import type { Member } from "@o360/contracts";
import { useBrand } from "@o360/platform";
import { Avatar } from "@o360/ui";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Digital ID card. The QR opens the public verification page for this staff number. */
export function IdCard({ member }: { member: Member }) {
  const brand = useBrand();
  const [qr, setQr] = useState("");
  const url = `${location.origin}/verify/${member.staffNo}`;

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0b1230", light: "#ffffff" } }).then(setQr, () => setQr(""));
  }, [url]);

  return (
    <div id="id-card" className="w-full max-w-[340px] overflow-hidden rounded-[16px] border border-line bg-white text-[#161a2e] shadow-lift">
      <div className="flex items-center gap-2.5 px-5 py-4 text-white" style={{ background: "var(--brand-accent)" }}>
        <img src={brand.logo} alt="" className="size-7 rounded-md bg-white/10" />
        <span className="text-[14px] font-bold">{brand.name}</span>
      </div>
      <div className="flex items-center gap-4 p-5">
        <Avatar name={member.name} size={64} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold">{member.name}</p>
          <p className="truncate text-[13px] text-[#6b7280]">{member.title}</p>
          <p className="truncate text-[13px] text-[#6b7280]">{member.department}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-[#e5e7eb] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b91b5]">Staff number</p>
          <p className="font-mono text-[15px] font-semibold">{member.staffNo}</p>
        </div>
        {qr ? <img src={qr} alt={`QR code to verify ${member.name}`} className="size-[84px]" /> : <span className="size-[84px]" />}
      </div>
    </div>
  );
}
