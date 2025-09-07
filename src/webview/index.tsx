import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Initialize custom elements from vscode-elements
// This ensures custom elements are defined before React renders
document.addEventListener("DOMContentLoaded", () => {
  // Create root element if it doesn't exist
  let rootElement = document.getElementById("root");
  if (!rootElement) {
    rootElement = document.createElement("div");
    rootElement.id = "root";
    document.body.appendChild(rootElement);
  }

  // Render React app
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
