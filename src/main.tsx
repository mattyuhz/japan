import React from "react";
import { createRoot } from "react-dom/client";
import TrialGuide from "./TrialGuide";
import "../app/globals.css";
import "../app/places.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "../app/icons.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><TrialGuide /></React.StrictMode>,
);
