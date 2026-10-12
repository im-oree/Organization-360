export type Brand = {
  name: string;
  shortName: string;
  logo: string;
  colors: { accent: string; accentDark?: string };
  font?: { sans?: string };
  radius?: number;
};

export const defaultBrand: Brand = {
  name: "Organization 360",
  shortName: "O360",
  logo: "/brand/logo.svg",
  colors: { accent: "#002986", accentDark: "#A7B8F7" },
  radius: 12,
};

/** Spring presets shared by every animated surface. */
export const motion = {
  spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
  gentle: { type: "spring", stiffness: 260, damping: 30 },
  ease: [0.22, 0.61, 0.36, 1] as const,
} as const;

/** Applies a brand to the document as CSS variables. Safe to call at any time. */
export function applyBrand(brand: Brand, root: HTMLElement = document.documentElement) {
  const s = root.style;
  s.setProperty("--brand-accent", brand.colors.accent);
  s.setProperty("--brand-accent-dark", brand.colors.accentDark ?? brand.colors.accent);
  if (brand.font?.sans) s.setProperty("--brand-font-sans", brand.font.sans);
  if (brand.radius != null) s.setProperty("--brand-radius", `${brand.radius}px`);
  document.title = brand.name;
  const icon = document.querySelector<HTMLLinkElement>("link[rel=icon]");
  if (icon) icon.href = brand.logo;
}
