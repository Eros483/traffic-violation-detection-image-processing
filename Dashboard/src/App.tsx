import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import LiveDetection from './pages/LiveDetection'
import ViolationsList from './pages/ViolationsList'
import ViolationDetail from './pages/ViolationDetail'
import EvidenceGallery from './pages/EvidenceGallery'
import ChallansList from './pages/ChallansList'
import ChallanDetail from './pages/ChallanDetail'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="detect" element={<LiveDetection />} />
        <Route path="violations" element={<ViolationsList />} />
        <Route path="violations/:id" element={<ViolationDetail />} />
        <Route path="evidence" element={<EvidenceGallery />} />
        <Route path="challans" element={<ChallansList />} />
        <Route path="challans/:id" element={<ChallanDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}