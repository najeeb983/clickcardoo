"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

export default function AllExcessesClient() {
  const [excesses, setExcesses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newExcessIds, setNewExcessIds] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/all-excesses')
      if (res.ok) {
        const data = await res.json()
        setExcesses(data || [])
        const newIds = new Set<string>()
        const now = new Date()
        data.forEach((e: any) => {
          const createdAt = new Date(e.createdAt)
          if (now.getTime() - createdAt.getTime() < 3600000) newIds.add(e.id)
        })
        setNewExcessIds(newIds)
      } else {
        setError('فشل تحميل التجاوزات')
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
    newRow: { backgroundColor: '#fff0f0' } as React.CSSProperties,
    badge: (status: string) => ({
      padding: '4px 8px',
      borderRadius: 3,
      fontSize: '12px',
      fontWeight: 'bold' as const,
      backgroundColor: status === 'NEED_UPDATE' ? '#fff3cd' : status === 'APPROVED' ? '#d4edda' : '#f8d7da',
      color: status === 'NEED_UPDATE' ? '#856404' : status === 'APPROVED' ? '#155724' : '#721c24'
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

      {excesses.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>لا توجد تجاوزات</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>المستخدم</th>
              <th style={styles.th}>النوع</th>
              <th style={styles.th}>المبلغ</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>الوصف</th>
              <th style={styles.th}>تاريخ الإنشاء</th>
              <th style={styles.th}>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {excesses.map((e: any) => (
              <tr key={e.id} style={newExcessIds.has(e.id) ? styles.newRow : undefined}>
                <td style={styles.td}>
                  <Link href={`/dashboard/admin/users/${e.booking?.accountId}`} style={{ color: '#007bff' }}>
                    {e.booking?.account?.name || e.booking?.account?.email}
                  </Link>
                </td>
                <td style={styles.td}>{e.type}</td>
                <td style={styles.td}>{e.amount}</td>
                <td style={styles.td}>
                  <span style={styles.badge(e.status)}>
                    {e.status === 'NEED_UPDATE' ? 'بحاجة للتحديث' : e.status === 'APPROVED' ? 'موافق عليه' : 'مرفوض'}
                  </span>
                </td>
                <td style={styles.td}>{e.description || '—'}</td>
                <td style={styles.td}>{new Date(e.createdAt).toLocaleDateString('ar-EG')}</td>
                <td style={styles.td}>
                  <Link href={`/dashboard/excesses/${e.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, padding: 8, backgroundColor: '#fff0f0', borderRadius: 4, fontSize: 12, color: '#666' }}>
        💡 التجاوزات بخلفية وردية تم إنشاؤها في الساعة الماضية
      </div>
    </div>
  )
}
