import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("Frontend Error Boundary:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle size={28} />
            </div>

            <h1 className="font-manrope text-2xl font-extrabold text-[#2D333B]">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-[#595F69]">
              The page failed to load. Please refresh and try again.
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 h-12 rounded-3xl bg-[#B8B8FF] px-6 font-semibold text-[#2D333B]"
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

export default ErrorBoundary;