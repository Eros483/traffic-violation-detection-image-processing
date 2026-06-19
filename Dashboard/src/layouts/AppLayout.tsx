import { Outlet } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import Navbar from '../components/shared/Navbar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
