import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ErrorBoundary from "./components/common/ErrorBoundary";
import App from "./App";
import "./index.css";
import { store } from "./app/store";
import { getStoredTheme, applyTheme } from "./utils/themeStorage";

applyTheme(getStoredTheme());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <Toaster position="top-right" />
            <App />
          </GoogleOAuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);