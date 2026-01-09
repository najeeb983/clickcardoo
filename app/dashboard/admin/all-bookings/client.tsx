"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

export default function AllBookingsClient() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newBookingIds, setNewBookingIds] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/all-bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data || [])
        const newIds = new Set<string>()
        const now = new Date()
        data.forEach((b: any) => {
          const createdAt = new Date(b.createdAt)
          if (now.getTime() - createdAt.getTime() < 3600000) newIds.add(b.id)
        })
        setNewBookingIds(newIds)
      } else {
        setError('فشل تحميل الحجوزات')
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحميل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const styles = {
    container: { padding: 16 } as React.CSSProperties,
    header: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 } as React.CSSProperties,
    button: { padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4 } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 } as React.CSSProperties,
    th: { backgroundColor: '#f5f5f5', padding: 12, textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' } as React.CSSProperties,
    td: { padding: 12, borderBottom: '1px solid #ddd' } as React.CSSProperties,
    newRow: { backgroundColor: '#fffacd' } as React.CSSProperties,
    badge: (status: string) => ({
      padding: '4px 8px',
      borderRadius: 3,
      fontSize: '12px',
      fontWeight: 'bold' as const,
      backgroundColor: status === 'PENDING' ? '#fff3cd' : status === 'PAID' ? '#d4edda' : status === 'CONFIRMED' ? '#cce5ff' : status === 'COMPLETED' ? '#d4edda' : '#f8d7da',
      color: status === 'PENDING' ? '#856404' : status === 'PAID' ? '#155724' : status === 'CONFIRMED' ? '#004085' : status === 'COMPLETED' ? '#155724' : '#721c24'
    }),
    error: { color: 'red', backgroundColor: '#ffebee', padding: 12, borderRadius: 4, marginBottom: 12 } as React.CSSProperties
  }

  if (loading) return <div style={styles.container}>جاري التحميل...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={load} style={styles.button}>تحديث</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {bookings.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>لا توجد حجوزات</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>المستخدم</th>
              <th style={styles.th}>معرف العقد</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>عدد الأيام</th>
              <th style={styles.th}>السعر اليومي</th>
              <th style={styles.th}>تاريخ البداية</th>
              <th style={styles.th}>تاريخ النهاية</th>
              <th style={styles.th}>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b: any) => (
              <tr key={b.id} style={newBookingIds.has(b.id) ? styles.newRow : undefined}>
                <td style={styles.td}>
                  <Link href={`/dashboard/admin/users/${b.accountId}`} style={{ color: '#007bff' }}>
                    {b.account?.name || b.account?.email}
                  </Link>
                </td>
                <td style={styles.td}>{b.contractId}</td>
                <td style={styles.td}>
                  <span style={styles.badge(b.status)}>
                    {b.status === 'PENDING' ? 'قيد الانتظار' : b.status === 'PAID' ? 'مدفوع' : b.status === 'CONFIRMED' ? 'موافق عليه' : b.status === 'COMPLETED' ? 'مكتمل' : 'ملغى'}
                  </span>
                </td>
                <td style={styles.td}>{b.rentalDays}</td>
                <td style={styles.td}>{b.dailyRate}</td>
                <td style={styles.td}>{new Date(b.startDate).toLocaleDateString('ar-EG')}</td>
                <td style={styles.td}>{new Date(b.endDate).toLocaleDateString('ar-EG')}</td>
                <td style={styles.td}>
                  <Link href={`/dashboard/admin/users/${b.accountId}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, padding: 8, backgroundColor: '#fffacd', borderRadius: 4, fontSize: 12, color: '#666' }}>
        💡 الحجوزات بخلفية صفراء تم إنشاؤها في الساعة الماضية
      </div>
    </div>
  )
}
