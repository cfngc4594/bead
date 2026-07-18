import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PetApp } from "@/pet/pet-app";
import "@/pet/pet.css";

const rootElement = document.getElementById("pet-root");

if (!rootElement) {
  throw new Error("Pet root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <PetApp />
  </StrictMode>,
);
