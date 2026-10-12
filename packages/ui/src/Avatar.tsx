export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-full bg-[#002986] font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </span>
  );
}
