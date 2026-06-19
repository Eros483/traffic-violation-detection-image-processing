import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'

export default function Settings() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <PageTransition>
      <div className="space-y-8 max-w-2xl">
        <SectionHeader title="Settings" />

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Appearance</h2>
          <p className="text-sm text-text-secondary mb-4">
            Light is the default. Switch any time — your choice is remembered on this device.
          </p>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm font-medium text-text-primary">Theme</span>
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors text-sm"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-1">About</h2>
          <p className="text-sm text-text-secondary">
            TrafficVision AI — Bengaluru Traffic Challenge 2026. Detection-to-enforcement
            pipeline for Indian traffic violations.
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
