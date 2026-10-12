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
  colors: { accent: "#0A84FF", accentDark: "#409CFF" },
  radius: 14,
};

/** Spring presets shared by every animated surface. */
export const motion = {
  spring: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
  gentle: { type: "spring", stiffness: 220, damping: 28 },
  ease: [0.32, 0.72, 0, 1] as const,
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
