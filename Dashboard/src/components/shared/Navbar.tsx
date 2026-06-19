import { Bell, Sun, Moon, Search } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function Navbar() {
  const [showNotifs, setShowNotifs] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-50 flex items-center justify-end gap-2 px-6 h-14 bg-sidebar border-b border-border flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 w-64 rounded-lg bg-bg border border-border px-3 py-1.5 focus-within:border-primary">
        <Search className="w-4 h-4 shrink-0 text-text-muted" />
        <input
          placeholder="Search plates, violations..."
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-lg text-text-secondary hover:bg-bg transition-colors"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(s => !s)}
          className="p-2 rounded-lg text-text-secondary hover:bg-bg transition-colors"
        >
          <span className="relative block">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-sidebar" />
          </span>
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-12 w-80 rounded-xl bg-card border border-border shadow-card z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">Recent Alerts</span>
              </div>
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-text-muted">No new alerts.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white ml-1">
        KA
      </div>
    </header>
  )
}
