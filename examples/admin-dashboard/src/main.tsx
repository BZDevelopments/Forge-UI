import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@forge-ui/core/styles.css";
import "@forge-ui/data-table/styles.css";
import "@forge-ui/command-palette/styles.css";
import "@forge-ui/form/styles.css";
import "@forge-ui/kanban-board/styles.css";
import "@forge-ui/activity-timeline/styles.css";
import "@forge-ui/notifications/styles.css";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
