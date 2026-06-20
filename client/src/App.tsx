import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Analytics } from "./pages/Analytics";
import { ViolationsList } from "./pages/ViolationsList";
import { ViolationDetail } from "./pages/ViolationDetail";
import { ChallansList } from "./pages/ChallansList";
import { ChallanDetail } from "./pages/ChallanDetail";
import { LiveDetection } from "./pages/LiveDetection";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="violations" element={<ViolationsList />} />
        <Route path="violations/:id" element={<ViolationDetail />} />
        <Route path="challans" element={<ChallansList />} />
        <Route path="challans/:id" element={<ChallanDetail />} />
        <Route path="live" element={<LiveDetection />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
