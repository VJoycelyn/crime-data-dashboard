import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "Dashboard rendering failed",
      error.message,
      info.componentStack,
    );
  }
  render() {
    if (this.state.error)
      return (
        <main className="error-page">
          <h1>This view could not load.</h1>
          <p>Your demo data is safe. Reload to reset the dashboard.</p>
          <button
            className="button primary"
            onClick={() => {
              window.location.hash = "";
              window.location.reload();
            }}
          >
            Reload demo
          </button>
        </main>
      );
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
