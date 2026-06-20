import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import { DataProvider } from "./context/DataContext";
import "./index.css";

// HashRouter (not BrowserRouter): the build is served by FastAPI's StaticFiles
// mount, which has no SPA fallback, so a hard refresh on a deep path like
// /violations would 404. Hash routing keeps every route working under the
// static mount without any backend change.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
