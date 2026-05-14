import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/common/ErrorBoundary";

import App from "./App";
import "./index.css";
import { store } from "./app/store";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-right" />
          <App />
      </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);