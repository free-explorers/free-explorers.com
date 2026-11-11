import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BoatLab } from "./BoatLab";
import "./lab.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BoatLab />
  </StrictMode>,
);
