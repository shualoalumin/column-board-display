import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// On mobile Chrome, momentarily allow scrolling and scroll 1px to dismiss
// the address bar, then lock it again.
if (typeof window !== "undefined") {
  const dismissAddressBar = () => {
    if (window.scrollY === 0) {
      document.documentElement.style.height = `${window.innerHeight + 1}px`;
      window.scrollTo(0, 1);
      setTimeout(() => {
        document.documentElement.style.height = "";
      }, 400);
    }
  };
  // Run after first paint
  requestAnimationFrame(() => setTimeout(dismissAddressBar, 100));
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
