'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/components/translation-provider'

interface Booking {
  id: string
  customerName: string
  startDate: string | Date
  endDate: string | Date
  totalDue: number | string
  status: string
}

interface DashboardData {
  totalBookings: number
  activeBookings: number
  totalRevenue: number | string
  recentBookings: Booking[]
}

export function DashboardClient({ data, session }: { data: DashboardData; session: any }) {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.totalBookings'),
      value: data.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('dashboard.activeBookings'),
      value: data.activeBookings,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('dashboard.totalRevenue'),
      value: formatCurrency(Number(data.totalRevenue)),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('excesses.title'),
      value: 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-1">{t('common.welcome')}, {session?.user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('bookings.title')} {t('errors.notFound')}</p>
            ) : (
              data.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{formatCurrency(Number(booking.totalDue))}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {booking.status === 'CONFIRMED'
                        ? t('bookings.confirmed')
                        : booking.status === 'PENDING'
                        ? t('bookings.pending')
                        : booking.status === 'PAID'
                        ? t('bookings.paid')
                        : t('bookings.completed')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}