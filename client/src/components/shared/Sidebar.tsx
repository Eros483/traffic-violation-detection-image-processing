import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ScanEye, AlertTriangle,
  FolderOpen, FileText, BarChart3, Settings, TrafficCone, LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface NavGroup {
  category: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    category: 'Overview',
    items: [
      { label: 'Dashboard',      to: '/',        icon: LayoutDashboard },
      { label: 'Live Detection', to: '/detect',  icon: ScanEye },
    ],
  },
  {
    category: 'Enforcement',
    items: [
      { label: 'Violations', to: '/violations', icon: AlertTriangle },
      { label: 'Evidence',   to: '/evidence',   icon: FolderOpen },
      { label: 'Challans',   to: '/challans',   icon: FileText },
    ],
  },
  {
    category: 'Intelligence',
    items: [
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    ],
  },
  {
    category: 'System',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen w-[220px]"
      style={{ backgroundColor: '#1B2A47', borderRight: '1px solid #334155' }}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 64, borderBottom: '1px solid #334155' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#2563EB' }}
        >
          <TrafficCone size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold text-white">
            TrafficVision <span style={{ color: '#2563EB' }}>AI</span>
          </p>
        </div>
      </div>

      {/* Grouped navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">
        {navGroups.map(group => (
          <div key={group.category}>
            <p
              className="pl-5 pr-4 pt-6 pb-2 text-[10px] font-semibold uppercase"
              style={{ letterSpacing: '0.12em', color: '#475569' }}
            >
              {group.category}
            </p>
            {group.items.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className="block">
                {({ isActive }) => (
                  <div
                    className="flex items-center gap-3 text-sm font-medium transition-colors duration-150"
                    style={
                      isActive
                        ? { backgroundColor: '#2563EB', color: '#FFFFFF', padding: '12px 12px 12px 20px' }
                        : { backgroundColor: 'transparent', color: '#94A3B8', padding: '12px 12px 12px 20px' }
                    }
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#334155'
                        e.currentTarget.style.color = '#FFFFFF'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#94A3B8'
                      }
                    }}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User row — pinned to bottom */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid #334155' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: '#2563EB' }}
        >
          KA
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-medium text-white truncate">Mayank</p>
          <p className="text-xs truncate" style={{ color: '#94A3B8' }}>Traffic Officer</p>
        </div>
        <button
          title="Logout"
          className="p-1 flex-shrink-0 transition-colors"
          style={{ color: '#475569' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
