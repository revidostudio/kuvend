import React from "react";
import ReactDOM from "react-dom/client";
import "@kuvend/ui/styles.css";
import "./styles.css";
import { AdminApp } from "./admin-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
