import { BrandProvider } from "@o360/platform";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Shell } from "./Shell";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrandProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </BrandProvider>
  </StrictMode>,
);
