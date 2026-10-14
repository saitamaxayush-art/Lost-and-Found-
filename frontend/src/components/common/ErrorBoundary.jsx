import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="pf-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div className="pf-gate-card" style={{ maxWidth: "480px", textAlign: "center" }}>
            <div className="lf-otp-error" style={{ marginBottom: "16px", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Server Connection Notice</span>
            </div>
            <h2 className="pf-gate-title" style={{ fontSize: "20px", marginBottom: "8px" }}>
              Something went wrong
            </h2>
            <p className="pf-gate-text" style={{ marginBottom: "20px" }}>
              {this.state.error?.message || "An unexpected error occurred while loading this view. Your data is safe."}
            </p>
            <button
              type="button"
              className="lf-submit"
              onClick={this.handleReload}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
