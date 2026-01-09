'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  DollarSign,
  Settings,
  LogOut,
  Car,
  Users,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { useTranslation } from '@/components/translation-provider'

export function Sidebar() {
  const pathname = usePathname()
  const { t, isRTL } = useTranslation()
  const { data: session } = useSession()

  const menuItems = [
    {
      title: t('nav.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: t('nav.bookings'),
      href: '/dashboard/bookings',
      icon: Calendar,
      show: true,
    },
    {
      title: t('nav.excesses'),
      href: '/dashboard/excesses',
      icon: AlertTriangle,
      show: true,
    },
    {
      title: t('nav.finance'),
      href: '/dashboard/finance',
      icon: DollarSign,
      show: true,
    },
    {
      title: t('nav.allBookings'),
      href: '/dashboard/admin/all-bookings',
      icon: Calendar,
      show: session?.user?.role === 'ADMIN' || session?.user?.role === 'EMPLOYEE',
    },
    {
      title: t('nav.allExcesses'),
      href: '/dashboard/admin/all-excesses',
      icon: AlertTriangle,
      show: session?.user?.role === 'ADMIN' || session?.user?.role === 'EMPLOYEE',
    },
    {
      title: t('nav.users'),
      href: '/dashboard/admin/users',
      icon: Users,
      show: session?.user?.role === 'ADMIN',
    },
    {
      title: t('nav.bankCards'),
      href: '/dashboard/bank-cards',
      icon: CreditCard,
      show: session?.user?.role === 'ADMIN' || session?.user?.role === 'EMPLOYEE',
    },
    {
      title: t('nav.settings'),
      href: '/dashboard/settings',
      icon: Settings,
      show: true,
    },
  ]

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Adjust hover animation based on language direction
  const hoverAnimation = isRTL ? { x: -4 } : { x: 4 }

  return (
    <aside className={cn(
      "fixed top-0 z-40 h-screen w-64 bg-white",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('common.appName')}</h1>
            <p className="text-xs text-gray-500">
              {isRTL ? "إدارة التأجير" : "Rental Management"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={hoverAnimation}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t p-4">
          <motion.button
            whileHover={hoverAnimation}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('auth.logout')}</span>
          </motion.button>
        </div>
      </div>
    </aside>
  )
}