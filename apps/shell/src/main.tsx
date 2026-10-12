import { AuthProvider, BrandProvider, catchUnhandled } from "@o360/platform";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Root } from "./Shell";
import "./styles.css";

catchUnhandled();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrandProvider>
      <AuthProvider>
        <BrowserRouter>
          <MotionConfig reducedMotion="user">
            <Root />
          </MotionConfig>
        </BrowserRouter>
      </AuthProvider>
    </BrandProvider>
  </StrictMode>,
);
