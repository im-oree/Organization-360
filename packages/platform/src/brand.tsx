import { applyBrand, defaultBrand, type Brand } from "@o360/tokens";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

const BrandContext = createContext<Brand>(defaultBrand);
export const useBrand = () => useContext(BrandContext);

/** Loads the tenant brand from the gateway and applies it as CSS variables. */
export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState(defaultBrand);
  useEffect(() => {
    api.get<Brand>("/brand").then(setBrand, () => {});
  }, []);
  useEffect(() => applyBrand(brand), [brand]);
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}
