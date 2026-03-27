'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import RouteGuard from '@/components/layout/RouteGuard'
import Footer from '@/components/layout/Footer'

const EyeNavIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

const MegaphoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
)

const TagIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

import { MosqueIcon as MosqueIconFilled } from '@/components/ui/IslamicIcons'
const MasjidIcon = () => <MosqueIconFilled size={13} />

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const navLinks: { href: string; label: string; icon?: React.ReactNode }[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/visibility', label: 'Visibility', icon: <EyeNavIcon /> },
  { href: '/admin/display-names', label: 'Display Names', icon: <TagIcon /> },
  { href: '/admin/masjid-connect', label: 'MasjidConnect', icon: <MasjidIcon /> },
  { href: '/admin/offers', label: 'Offers', icon: <MegaphoneIcon /> },
  { href: '/admin/audit-log', label: 'Audit Log' },
]

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const SidebarContent = () => (
    <>
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-sm tracking-wide">MUSLIM AD NETWORK</div>
          <div className="text-white/50 text-xs mt-0.5">Admin Panel</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map((link) => {
          const isActive = link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {link.icon}{link.label}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-56 flex-shrink-0 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#1a4a2e' }}
      >
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-14 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <span className="text-sm font-semibold text-gray-700">Muslim Ad Network — Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#64748b] hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-white px-4 py-1.5 rounded-full transition-colors"
              style={{ backgroundColor: '#1a4a2e' }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
          {children}
          <Footer />
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="admin">
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RouteGuard>
  )
}
